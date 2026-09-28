from sqlalchemy.orm import Session
from app.models.models import Substation, Feeder, ConsumerGroup, Village, GridEvent, Outage
from app.ai.anomaly_detector import anomaly_detector_service
from typing import Dict, Any, List

class MonitoringEngine:
    """
    Combines rule-based problem detection and AI Anomaly Detection.
    Monitors overloads, power shortages, critical load risks, and excessive outages.
    """
    def evaluate_grid_status(self, db: Session) -> Dict[str, Any]:
        substation = db.query(Substation).first()
        feeders = db.query(Feeder).all()
        villages = db.query(Village).all()
        consumer_groups = db.query(ConsumerGroup).all()

        if not substation or not feeders:
            return {
                "total_feeders": 0,
                "normal_feeders": 0,
                "warning_feeders": 0,
                "overloaded_feeders": 0,
                "offline_feeders": 0,
                "maintenance_feeders": 0,
                "total_demand_mw": 0.0,
                "available_power_mw": 0.0,
                "current_shortage_mw": 0.0,
                "critical_load_mw": 0.0,
                "flexible_load_mw": 0.0,
                "current_outages_count": 0,
                "alerts": []
            }

        alerts = []
        normal_count = 0
        warning_count = 0
        overloaded_count = 0
        offline_count = 0
        maintenance_count = 0

        total_demand_mw = 0.0
        critical_load_mw = 0.0
        flexible_load_mw = 0.0

        for f in feeders:
            # Update current feeder load from consumer groups
            f_groups = [cg for cg in consumer_groups if cg.feeder_id == f.id]
            f_load = sum(cg.power_mw for cg in f_groups) if f.status not in ["OFFLINE", "MAINTENANCE"] else 0.0
            f.current_load_mw = round(f_load, 2)

            total_demand_mw += f.current_load_mw

            # Critical vs Flexible loads
            for cg in f_groups:
                if cg.is_critical or cg.priority == 1:
                    critical_load_mw += cg.power_mw
                elif cg.priority in [4, 5]:
                    flexible_load_mw += cg.power_mw * (cg.flexibility_pct / 100.0)

            # Determine Feeder Status
            loading_ratio = f.current_load_mw / max(0.1, f.capacity_mw)

            if f.status == "OFFLINE":
                offline_count += 1
            elif f.status == "MAINTENANCE":
                maintenance_count += 1
            elif f.current_load_mw > f.capacity_mw:
                f.status = "OVERLOADED"
                overloaded_count += 1
                alerts.append({
                    "id": f"overload_{f.feeder_id}",
                    "severity": "CRITICAL",
                    "type": "FEEDER_OVERLOAD",
                    "title": f"Feeder {f.feeder_id} Overloaded",
                    "message": f"Load ({f.current_load_mw:.2f} MW) exceeds rated capacity ({f.capacity_mw:.2f} MW) by {f.current_load_mw - f.capacity_mw:.2f} MW.",
                    "feeder_id": f.feeder_id
                })
            elif loading_ratio >= 0.85:
                f.status = "HIGH_LOADING"
                warning_count += 1
                alerts.append({
                    "id": f"warning_{f.feeder_id}",
                    "severity": "WARNING",
                    "type": "HIGH_LOADING",
                    "title": f"Feeder {f.feeder_id} High Loading",
                    "message": f"Load ({f.current_load_mw:.2f} MW) is at {loading_ratio * 100:.1f}% of feeder capacity.",
                    "feeder_id": f.feeder_id
                })
            else:
                f.status = "NORMAL"
                normal_count += 1

            # AI Anomaly Forest Check
            if f.status not in ["OFFLINE", "MAINTENANCE"]:
                is_anomaly, score, ai_msg = anomaly_detector_service.detect_feeder_anomaly(
                    feeder_id=f.feeder_id,
                    current_load_mw=f.current_load_mw,
                    capacity_mw=f.capacity_mw
                )
                if is_anomaly:
                    alerts.append({
                        "id": f"ai_anomaly_{f.feeder_id}",
                        "severity": "WARNING",
                        "type": "AI_ANOMALY",
                        "title": f"AI Unusual Load Detected on {f.feeder_id}",
                        "message": ai_msg,
                        "feeder_id": f.feeder_id
                    })

        # Overall Power Shortage check
        available_power_mw = substation.available_power_mw
        current_shortage_mw = max(0.0, round(total_demand_mw - available_power_mw, 2))

        if current_shortage_mw > 0.0:
            alerts.append({
                "id": "power_shortage_alert",
                "severity": "CRITICAL",
                "type": "POWER_SHORTAGE",
                "title": "Substation Supply Deficit",
                "message": f"Total demand ({total_demand_mw:.2f} MW) exceeds available power ({available_power_mw:.2f} MW). Shortage: {current_shortage_mw:.2f} MW.",
                "feeder_id": "SUBSTATION"
            })

        # Excessive Outage Check on Villages
        for v in villages:
            if v.outage_hours_today >= 2.0:
                alerts.append({
                    "id": f"outage_equity_{v.id}",
                    "severity": "WARNING",
                    "type": "EXCESSIVE_OUTAGE",
                    "title": f"Excessive Outage in {v.name}",
                    "message": f"{v.name} has suffered {v.outage_hours_today:.1f} hours of outages today. Optimizer will prioritize restoring power here.",
                    "feeder_id": "VILLAGE"
                })

        db.commit()

        active_outages_count = db.query(Outage).filter(Outage.is_active == True).count()

        return {
            "total_feeders": len(feeders),
            "normal_feeders": normal_count,
            "warning_feeders": warning_count,
            "overloaded_feeders": overloaded_count,
            "offline_feeders": offline_count,
            "maintenance_feeders": maintenance_count,
            "total_demand_mw": round(total_demand_mw, 2),
            "available_power_mw": round(available_power_mw, 2),
            "current_shortage_mw": current_shortage_mw,
            "critical_load_mw": round(critical_load_mw, 2),
            "flexible_load_mw": round(flexible_load_mw, 2),
            "current_outages_count": active_outages_count,
            "alerts": alerts
        }

# Global instance
monitoring_engine_service = MonitoringEngine()
