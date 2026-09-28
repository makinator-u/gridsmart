from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import OptimizationRequest
from app.models.models import OptimizationRun, RecommendedAction, ConsumerGroup, Feeder, Outage, GridEvent, Village
from app.optimization.load_optimizer import load_optimizer_service
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Optimization & Recommendations"])

@router.post("/optimization/run")
def run_optimization(req: OptimizationRequest = None, db: Session = Depends(get_db)):
    notes = req.notes if req else "Operator Triggered MILP Optimization"
    opt_run = load_optimizer_service.run_optimization(db, notes=notes)

    actions = db.query(RecommendedAction).filter(RecommendedAction.optimization_id == opt_run.id).all()

    return {
        "optimization_id": opt_run.id,
        "timestamp": opt_run.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "total_demand_mw": opt_run.total_demand_mw,
        "available_power_mw": opt_run.available_power_mw,
        "shortage_mw": opt_run.shortage_mw,
        "status": opt_run.status,
        "recommended_actions": [
            {
                "id": a.id,
                "feeder_code": a.feeder_code,
                "consumer_group_name": a.consumer_group_name,
                "action": a.action,
                "load_mw": a.load_mw,
                "duration_mins": a.duration_mins,
                "status": a.status
            } for a in actions
        ]
    }

@router.get("/recommendations")
def get_latest_recommendations(db: Session = Depends(get_db)):
    latest_run = db.query(OptimizationRun).order_by(OptimizationRun.timestamp.desc()).first()
    if not latest_run:
        # Run optimization automatically to have initial recommendations
        latest_run = load_optimizer_service.run_optimization(db, "Initial baseline plan")

    actions = db.query(RecommendedAction).filter(RecommendedAction.optimization_id == latest_run.id).all()

    return {
        "optimization_id": latest_run.id,
        "timestamp": latest_run.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "total_demand_mw": latest_run.total_demand_mw,
        "available_power_mw": latest_run.available_power_mw,
        "shortage_mw": latest_run.shortage_mw,
        "status": latest_run.status,
        "recommended_actions": [
            {
                "id": a.id,
                "feeder_code": a.feeder_code,
                "consumer_group_name": a.consumer_group_name,
                "action": a.action,
                "load_mw": a.load_mw,
                "duration_mins": a.duration_mins,
                "status": a.status
            } for a in actions
        ]
    }

@router.post("/recommendations/{optimization_id}/approve")
def approve_recommendation_plan(optimization_id: int, db: Session = Depends(get_db)):
    opt_run = db.query(OptimizationRun).filter(OptimizationRun.id == optimization_id).first()
    if not opt_run:
        raise HTTPException(status_code=404, detail="Optimization run not found")

    opt_run.status = "APPROVED"
    actions = db.query(RecommendedAction).filter(RecommendedAction.optimization_id == opt_run.id).all()

    applied_reductions = 0
    total_reduced_mw = 0.0

    for a in actions:
        a.status = "APPROVED"
        if a.load_mw > 0:
            applied_reductions += 1
            total_reduced_mw += a.load_mw

            # Apply reduction to consumer group in grid model
            feeder = db.query(Feeder).filter(Feeder.feeder_id == a.feeder_code).first()
            if feeder:
                cg = db.query(ConsumerGroup).filter(
                    ConsumerGroup.feeder_id == feeder.id,
                    ConsumerGroup.consumer_type == a.consumer_group_name
                ).first()
                if cg:
                    cg.power_mw = round(max(0.0, cg.power_mw - a.load_mw), 2)
                    cg.outage_hours_today += round(a.duration_mins / 60.0, 1)

                    # Update connected village outage record
                    villages = db.query(Village).filter(Village.feeder_id == feeder.id).all()
                    for v in villages:
                        v.outage_hours_today += round((a.duration_mins / 60.0) * 0.5, 1)

                    # Record Outage Entry
                    outage_entry = Outage(
                        feeder_id=feeder.id,
                        consumer_group_id=cg.id,
                        village_name=villages[0].name if villages else "Cluster",
                        start_time=datetime.utcnow(),
                        reason=f"Approved Load Management: {a.action} {a.load_mw} MW on {a.consumer_group_name}",
                        duration_hours=round(a.duration_mins / 60.0, 1),
                        is_active=True
                    )
                    db.add(outage_entry)

    # Log Grid Event
    evt = GridEvent(
        event_type="OPERATOR_ACTION",
        description=f"Operator APPROVED optimization plan #{opt_run.id}. Applied {applied_reductions} load reductions totaling {total_reduced_mw:.2f} MW. Grid state updated.",
        severity="INFO"
    )
    db.add(evt)
    db.commit()

    return {"message": f"Optimization Plan #{opt_run.id} APPROVED and executed in grid simulator.", "status": "APPROVED"}

@router.post("/recommendations/{optimization_id}/reject")
def reject_recommendation_plan(optimization_id: int, db: Session = Depends(get_db)):
    opt_run = db.query(OptimizationRun).filter(OptimizationRun.id == optimization_id).first()
    if not opt_run:
        raise HTTPException(status_code=404, detail="Optimization run not found")

    opt_run.status = "REJECTED"
    actions = db.query(RecommendedAction).filter(RecommendedAction.optimization_id == opt_run.id).all()
    for a in actions:
        a.status = "REJECTED"

    evt = GridEvent(
        event_type="OPERATOR_ACTION",
        description=f"Operator REJECTED optimization plan #{opt_run.id}. No changes made to current grid load distribution.",
        severity="WARNING"
    )
    db.add(evt)
    db.commit()

    return {"message": f"Optimization Plan #{opt_run.id} REJECTED.", "status": "REJECTED"}
