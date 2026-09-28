from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.monitoring_engine import monitoring_engine_service
from app.models.models import GridEvent

router = APIRouter(prefix="/api", tags=["Alerts & Events"])

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    status_data = monitoring_engine_service.evaluate_grid_status(db)
    return {
        "count": len(status_data["alerts"]),
        "alerts": status_data["alerts"]
    }

@router.get("/events")
def get_events(limit: int = 50, db: Session = Depends(get_db)):
    events = db.query(GridEvent).order_by(GridEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.strftime("%H:%M:%S"),
            "event_type": e.event_type,
            "feeder_id": e.feeder_id,
            "description": e.description,
            "severity": e.severity
        } for e in events
    ]
