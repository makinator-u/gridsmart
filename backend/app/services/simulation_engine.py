import math
import random
from sqlalchemy.orm import Session
from app.models.models import Substation, Feeder, ConsumerGroup, LoadReading, SimulationState, GridEvent
from datetime import datetime

class SimulationEngine:
    """
    Simulates realistic rural feeder conditions over time based on diurnal patterns,
    active scenarios, and interactive operator event injections.
    """
    def advance_simulation_tick(self, db: Session):
        sim_state = db.query(SimulationState).first()
        if not sim_state or not sim_state.is_running:
            return

        # Advance decimal hour by (3 sim minutes * speed_multiplier) per tick
        mins_advance = 3 * max(1, sim_state.speed_multiplier)
        sim_state.simulated_hour = (sim_state.simulated_hour + (mins_advance / 60.0)) % 24.0
        
        hours = int(sim_state.simulated_hour)
        mins = int((sim_state.simulated_hour - hours) * 60)
        sim_state.simulated_time = f"{hours:02d}:{mins:02d}"
        sim_state.last_updated = datetime.utcnow()

        hour = sim_state.simulated_hour
        scenario_name = sim_state.active_scenario or "Normal"

        substation = db.query(Substation).first()
        feeders = db.query(Feeder).all()
        consumer_groups = db.query(ConsumerGroup).all()

        if not substation or not feeders:
            return

        # Dynamically import scenario definitions for single source of truth
        from app.api.scenarios import SCENARIOS_CATALOG
        scenario_meta = next(
            (s for s in SCENARIOS_CATALOG if s["name"].lower() == scenario_name.lower()),
            {"agri_delta_pct": 0, "gen_delta_mw": 0.0}
        )

        agri_mult = 1.0 + (scenario_meta.get("agri_delta_pct", 0) / 100.0)
        gen_shortage_delta = scenario_meta.get("gen_delta_mw", 0.0)
        res_mult = 1.30 if scenario_name == "Heat Wave" else 1.0
        comm_mult = 1.25 if scenario_name == "Heat Wave" else 1.0

        # Update available power dynamically based on actual substation capacity
        base_available = substation.capacity_mw * 0.90
        substation.available_power_mw = max(
            substation.capacity_mw * 0.35,
            round(base_available + gen_shortage_delta, 2)
        )

        # Diurnal load multipliers:
        # Residential: peaks morning (7-9 AM) and evening (6-10 PM)
        res_diurnal = 0.7 + 0.45 * (math.exp(-((hour - 8)**2)/4) + math.exp(-((hour - 20)**2)/6))
        
        # Agriculture: peaks mid-day / irrigation periods (10 AM - 4 PM)
        agri_diurnal = 0.6 + 0.65 * math.exp(-((hour - 14)**2)/12)
        
        # Commercial / Industrial: peaks working hours (9 AM - 6 PM)
        comm_diurnal = 0.5 + 0.55 * math.exp(-((hour - 13)**2)/16)

        feeder_status_map = {f.id: f.status for f in feeders}

        # Update consumer group load levels
        for cg in consumer_groups:
            if feeder_status_map.get(cg.feeder_id) in ["OFFLINE", "MAINTENANCE"]:
                cg.power_mw = 0.0
                continue

            base_max = cg.max_power_mw
            ctype = cg.consumer_type

            if ctype == "Residential":
                val = base_max * res_diurnal * res_mult
            elif ctype == "Agriculture":
                val = base_max * agri_diurnal * agri_mult
            elif ctype in ["Commercial", "Industrial"]:
                val = base_max * comm_diurnal * comm_mult
            else: # Hospital, Water, Telecom
                val = base_max * (0.9 + 0.1 * math.sin(hour))

            # Add minor natural fluctuation noise (+/- 3%)
            noise = 1.0 + random.uniform(-0.03, 0.03)
            cg.power_mw = round(max(0.05, val * noise), 2)

        # Save historical load readings for analytics
        for f in feeders:
            f_groups = [cg for cg in consumer_groups if cg.feeder_id == f.id]
            f_total = sum(cg.power_mw for cg in f_groups) if f.status not in ["OFFLINE", "MAINTENANCE"] else 0.0
            f.current_load_mw = round(f_total, 2)

            res_mw = sum(cg.power_mw for cg in f_groups if cg.consumer_type == "Residential")
            agri_mw = sum(cg.power_mw for cg in f_groups if cg.consumer_type == "Agriculture")
            comm_mw = sum(cg.power_mw for cg in f_groups if cg.consumer_type in ["Commercial", "Industrial"])
            crit_mw = sum(cg.power_mw for cg in f_groups if cg.is_critical or cg.priority == 1)

            reading = LoadReading(
                timestamp=datetime.utcnow(),
                feeder_id=f.id,
                load_mw=f.current_load_mw,
                residential_mw=round(res_mw, 2),
                agriculture_mw=round(agri_mw, 2),
                commercial_mw=round(comm_mw, 2),
                critical_mw=round(crit_mw, 2),
                source="Simulation"
            )
            db.add(reading)

        db.commit()

    def inject_event(self, db: Session, event_type: str, feeder_code: str = None, magnitude_mw: float = 1.5) -> str:
        """
        Operator event injection for interactive live demonstrations.
        """
        feeders = db.query(Feeder).all()
        substation = db.query(Substation).first()
        consumer_groups = db.query(ConsumerGroup).all()

        if not feeders:
            return "No feeders available."

        # Dynamically find target feeder
        target_feeder = None
        if feeder_code:
            target_feeder = next((f for f in feeders if f.feeder_id == feeder_code or str(f.id) == str(feeder_code)), None)
        
        if not target_feeder:
            if event_type == "INCREASE_AGRICULTURE":
                agri_feeder_ids = {cg.feeder_id for cg in consumer_groups if cg.consumer_type == "Agriculture"}
                target_feeder = next((f for f in feeders if f.id in agri_feeder_ids), feeders[0])
            else:
                target_feeder = feeders[0]

        desc = ""
        if event_type == "INCREASE_AGRICULTURE":
            agri_groups = [cg for cg in consumer_groups if cg.consumer_type == "Agriculture" and cg.feeder_id == target_feeder.id]
            for cg in agri_groups:
                cg.power_mw = round(cg.power_mw + magnitude_mw, 2)
            desc = f"Operator Injected: Agricultural demand surge (+{magnitude_mw:.1f} MW) on Feeder {target_feeder.feeder_id}."

        elif event_type == "INCREASE_RESIDENTIAL":
            res_groups = [cg for cg in consumer_groups if cg.consumer_type == "Residential" and cg.feeder_id == target_feeder.id]
            for cg in res_groups:
                cg.power_mw = round(cg.power_mw + magnitude_mw, 2)
            desc = f"Operator Injected: Residential peak demand (+{magnitude_mw:.1f} MW) on Feeder {target_feeder.feeder_id}."

        elif event_type == "REDUCE_GENERATION":
            min_gen = substation.capacity_mw * 0.35 if substation else 8.0
            substation.available_power_mw = max(min_gen, round(substation.available_power_mw - magnitude_mw, 2))
            desc = f"Operator Injected: Substation power generation deficit (-{magnitude_mw:.1f} MW). Available power now: {substation.available_power_mw:.1f} MW."

        elif event_type == "TRIP_FEEDER":
            target_feeder.status = "OFFLINE"
            for cg in consumer_groups:
                if cg.feeder_id == target_feeder.id:
                    cg.power_mw = 0.0
            desc = f"Operator Injected: Fault trip on Feeder {target_feeder.feeder_id}. Feeder offline."

        elif event_type == "MAINTENANCE":
            target_feeder.status = "MAINTENANCE"
            desc = f"Operator Injected: Planned maintenance initiated on Feeder {target_feeder.feeder_id}."

        elif event_type == "RESTORE_FEEDER":
            target_feeder.status = "NORMAL"
            desc = f"Operator Injected: Feeder {target_feeder.feeder_id} restored to normal service."

        # Log event
        evt = GridEvent(
            event_type="OPERATOR_ACTION",
            feeder_id=target_feeder.id,
            description=desc,
            severity="WARNING" if "trip" in desc.lower() or "deficit" in desc.lower() else "INFO"
        )
        db.add(evt)
        db.commit()

        # Recalculate immediate loads
        for f in feeders:
            f_groups = [cg for cg in consumer_groups if cg.feeder_id == f.id]
            f.current_load_mw = round(sum(cg.power_mw for cg in f_groups), 2) if f.status not in ["OFFLINE", "MAINTENANCE"] else 0.0
        db.commit()

        return desc

# Global instance
simulation_engine_service = SimulationEngine()

