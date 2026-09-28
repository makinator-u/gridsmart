import pulp
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import Substation, Feeder, ConsumerGroup, OptimizationRun, RecommendedAction, GridEvent
from datetime import datetime

class LoadOptimizer:
    """
    Mixed-Integer Linear Programming (MILP) Load Management Optimizer.
    Finds the optimal, safest, and fairest load reduction/shifting plan.
    Includes robust fallback logic.
    """
    def run_optimization(self, db: Session, notes: str = "Operator Triggered MILP Optimization") -> OptimizationRun:
        substation = db.query(Substation).first()
        feeders = db.query(Feeder).all()
        consumer_groups = db.query(ConsumerGroup).all()

        if not substation or not feeders:
            raise ValueError("No grid infrastructure found for optimization.")

        total_demand_mw = sum(f.current_load_mw for f in feeders if f.status not in ["OFFLINE", "MAINTENANCE"])
        available_power_mw = substation.available_power_mw
        shortage_mw = max(0.0, total_demand_mw - available_power_mw)

        reduction_results = {cg.id: 0.0 for cg in consumer_groups}

        try:
            # Create PuLP MILP Problem
            prob = pulp.LpProblem("GridSmart_Load_Management", pulp.LpMinimize)

            reduction_vars = {}
            is_reduced_vars = {}

            for cg in consumer_groups:
                max_reduction = cg.power_mw * (cg.flexibility_pct / 100.0) if not cg.is_critical and cg.priority > 1 else 0.0
                if cg.priority in [4, 5] and not cg.is_critical:
                    max_reduction = cg.power_mw

                var_name = f"red_group_{cg.id}"
                bin_name = f"bin_group_{cg.id}"

                reduction_vars[cg.id] = pulp.LpVariable(var_name, lowBound=0.0, upBound=max_reduction)
                is_reduced_vars[cg.id] = pulp.LpVariable(bin_name, cat=pulp.LpBinary)

            priority_weights = {1: 10000.0, 2: 5000.0, 3: 1000.0, 4: 200.0, 5: 50.0}

            objective_terms = []
            for cg in consumer_groups:
                p_weight = priority_weights.get(cg.priority, 500.0)
                fairness_factor = 1.0 + (cg.outage_hours_today * 0.8)
                effective_weight = p_weight * fairness_factor
                objective_terms.append(effective_weight * reduction_vars[cg.id] + 5.0 * is_reduced_vars[cg.id])

            prob += pulp.lpSum(objective_terms), "Total_Weighted_Penalty"

            feeder_status_map = {f.id: f.status for f in feeders}

            # Substation capacity constraint
            total_remaining = [
                cg.power_mw - reduction_vars[cg.id]
                for cg in consumer_groups
                if feeder_status_map.get(cg.feeder_id) not in ["OFFLINE", "MAINTENANCE"]
            ]
            prob += (pulp.lpSum(total_remaining) <= available_power_mw), "Substation_Capacity"

            # Feeder level capacity constraints
            for f in feeders:
                if f.status in ["OFFLINE", "MAINTENANCE"]:
                    continue
                f_groups = [cg for cg in consumer_groups if cg.feeder_id == f.id]
                if f_groups:
                    f_rem = [cg.power_mw - reduction_vars[cg.id] for cg in f_groups]
                    prob += (pulp.lpSum(f_rem) <= f.capacity_mw), f"Feeder_Cap_{f.feeder_id}"

            # Binary link constraints
            for cg in consumer_groups:
                prob += (reduction_vars[cg.id] <= cg.power_mw * is_reduced_vars[cg.id]), f"Link_Bin_{cg.id}"

            prob.solve(pulp.PULP_CBC_CMD(msg=False))

            for cg in consumer_groups:
                val = reduction_vars[cg.id].varValue if reduction_vars[cg.id].varValue is not None else 0.0
                reduction_results[cg.id] = round(max(0.0, val), 2)

        except Exception as e:
            # Fallback Greedy Priority Allocator if solver binary fails
            deficit = shortage_mw
            # Sort groups by priority descending (priority 5, 4 first, priority 1 last) & low past outage hours first (fairness)
            sortable = sorted(
                [cg for cg in consumer_groups if not cg.is_critical and cg.priority > 1],
                key=lambda x: (-x.priority, x.outage_hours_today)
            )

            # First resolve feeder overloads
            for f in feeders:
                if f.status in ["OFFLINE", "MAINTENANCE"]:
                    continue
                f_groups = [cg for cg in consumer_groups if cg.feeder_id == f.id and not cg.is_critical and cg.priority > 1]
                f_overload = max(0.0, f.current_load_mw - f.capacity_mw)
                for cg in sorted(f_groups, key=lambda x: (-x.priority, x.outage_hours_today)):
                    if f_overload <= 0:
                        break
                    shed = min(cg.power_mw, f_overload)
                    reduction_results[cg.id] = round(shed, 2)
                    f_overload -= shed

            # Then resolve overall power deficit
            remaining_deficit = max(0.0, sum(cg.power_mw - reduction_results[cg.id] for cg in consumer_groups) - available_power_mw)
            for cg in sortable:
                if remaining_deficit <= 0:
                    break
                rem_cap = cg.power_mw - reduction_results[cg.id]
                if rem_cap > 0:
                    shed = min(rem_cap, remaining_deficit)
                    reduction_results[cg.id] = round(reduction_results[cg.id] + shed, 2)
                    remaining_deficit -= shed

        # Create OptimizationRun DB record
        opt_run = OptimizationRun(
            timestamp=datetime.utcnow(),
            total_demand_mw=round(total_demand_mw, 2),
            available_power_mw=round(available_power_mw, 2),
            shortage_mw=round(shortage_mw, 2),
            status="RECOMMENDED",
            summary_notes=notes
        )
        db.add(opt_run)
        db.flush()

        actions_list = []
        for f in feeders:
            f_groups = [cg for cg in consumer_groups if cg.feeder_id == f.id]
            for cg in f_groups:
                val = reduction_results.get(cg.id, 0.0)
                if val > 0.01:
                    action_type = "SHIFT" if cg.consumer_type in ["Agriculture", "Commercial"] and val < cg.power_mw else "REDUCE"
                    action = RecommendedAction(
                        optimization_id=opt_run.id,
                        feeder_id=f.id,
                        feeder_code=f.feeder_id,
                        consumer_group_name=cg.consumer_type,
                        action=action_type,
                        load_mw=val,
                        duration_mins=60,
                        status="RECOMMENDED"
                    )
                    db.add(action)
                    actions_list.append(action)
                else:
                    action = RecommendedAction(
                        optimization_id=opt_run.id,
                        feeder_id=f.id,
                        feeder_code=f.feeder_id,
                        consumer_group_name=cg.consumer_type,
                        action="KEEP_ON",
                        load_mw=0.0,
                        duration_mins=60,
                        status="RECOMMENDED"
                    )
                    db.add(action)
                    actions_list.append(action)

        grid_event = GridEvent(
            event_type="OPTIMIZATION",
            description=f"MILP Optimization run completed. Demand: {total_demand_mw:.2f} MW, Shortage: {shortage_mw:.2f} MW. Generated {len([a for a in actions_list if a.load_mw > 0])} load management recommendations.",
            severity="INFO" if shortage_mw == 0 else "WARNING"
        )
        db.add(grid_event)

        db.commit()
        db.refresh(opt_run)
        return opt_run

# Global instance
load_optimizer_service = LoadOptimizer()
