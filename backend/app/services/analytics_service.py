from sqlalchemy.orm import Session
from app.models.models import Feeder, ConsumerGroup, GridEvent, Village
from typing import Dict, Any

class AnalyticsService:
    """
    Computes aggregated quantitative telemetry analytics, load category breakdowns,
    and historical outage distributions across the distribution network.
    """
    @staticmethod
    def get_grid_analytics(db: Session) -> Dict[str, Any]:
        feeders = db.query(Feeder).all()
        cgroups = db.query(ConsumerGroup).all()
        events = db.query(GridEvent).all()
        villages = db.query(Village).all()

        # Aggregate load demand by consumer category
        categories: Dict[str, float] = {}
        for cg in cgroups:
            ctype = cg.consumer_type
            categories[ctype] = round(categories.get(ctype, 0.0) + cg.power_mw, 2)

        # Feeder loading percentage breakdown
        feeder_loading = [
            {
                "code": f.feeder_id,
                "name": f.feeder_name,
                "current_load_mw": f.current_load_mw,
                "capacity_mw": f.capacity_mw,
                "loading_pct": round((f.current_load_mw / max(0.1, f.capacity_mw)) * 100, 1),
                "status": f.status,
            }
            for f in feeders
        ]

        # Village outage hours
        outage_dist = [
            {
                "name": v.name,
                "outage_hours": round(v.outage_hours_today, 1),
                "consumer_count": v.consumer_count,
            }
            for v in villages
        ]

        # Audit events summary by severity
        event_breakdown = {
            "INFO": len([e for e in events if e.severity == "INFO"]),
            "WARNING": len([e for e in events if e.severity == "WARNING"]),
            "CRITICAL": len([e for e in events if e.severity == "CRITICAL"]),
        }

        return {
            "load_by_category": categories,
            "feeder_loading": feeder_loading,
            "outage_distribution": outage_dist,
            "event_summary": event_breakdown,
            "total_events_logged": len(events),
        }

analytics_service = AnalyticsService()
