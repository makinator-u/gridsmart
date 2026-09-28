from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Substation, Feeder, Village, ConsumerGroup, LoadReading, SimulationState, GridEvent, Outage
import pandas as pd
import io
import os
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter(prefix="/api/data", tags=["Data Setup & CSV"])

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))

@router.get("/templates/{file_type}")
def download_csv_template(file_type: str):
    mapping = {
        "feeders": "sample_feeders.csv",
        "load": "sample_load.csv",
        "consumer": "sample_consumer.csv",
        "outage": "sample_outage.csv"
    }
    filename = mapping.get(file_type.lower())
    if not filename:
        raise HTTPException(status_code=400, detail="Invalid template type. Choose feeders, load, consumer, or outage.")

    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Template file not found.")

    return FileResponse(filepath, filename=filename, media_type="text/csv")

@router.post("/upload")
async def upload_grid_csv(
    feeders_file: UploadFile = File(None),
    consumer_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    if not feeders_file and not consumer_file:
        raise HTTPException(status_code=400, detail="Please select at least one CSV file to upload.")

    substation = db.query(Substation).first()
    if not substation:
        substation = Substation(
            name="CSV Imported Substation 33/11kV",
            capacity_mw=20.0,
            available_power_mw=18.0,
            voltage_level_kv=33.0,
            data_source="CSV Upload"
        )
        db.add(substation)
        db.flush()

    parsed_summary = []

    if feeders_file:
        content = await feeders_file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Check required columns: feeder_id, feeder_name, capacity_mw
        if "feeder_id" in df.columns and "capacity_mw" in df.columns:
            for _, row in df.iterrows():
                f_code = str(row["feeder_id"]).strip()
                f_name = str(row.get("feeder_name", f"Feeder {f_code}")).strip()
                f_cap = float(row["capacity_mw"])

                existing = db.query(Feeder).filter(Feeder.feeder_id == f_code).first()
                if existing:
                    existing.capacity_mw = f_cap
                    existing.feeder_name = f_name
                else:
                    new_f = Feeder(
                        feeder_id=f_code,
                        feeder_name=f_name,
                        capacity_mw=f_cap,
                        current_load_mw=f_cap * 0.65,
                        status="NORMAL",
                        substation_id=substation.id
                    )
                    db.add(new_f)
            parsed_summary.append(f"Processed {len(df)} feeders from CSV.")

    if consumer_file:
        content = await consumer_file.read()
        df = pd.read_csv(io.BytesIO(content))
        if "feeder_id" in df.columns and "consumer_type" in df.columns:
            feeders = db.query(Feeder).all()
            for _, row in df.iterrows():
                f_code = str(row["feeder_id"]).strip()
                feeder = next((f for f in feeders if f.feeder_id == f_code), None)
                if feeder:
                    is_crit = (
                        str(row.get("is_critical", "")).strip().lower() in ["true", "1", "yes", "t", "y"]
                        or int(row.get("priority", 3)) == 1
                    )
                    cg = ConsumerGroup(
                        feeder_id=feeder.id,
                        consumer_type=str(row["consumer_type"]).strip(),
                        power_mw=float(row.get("power_mw", 1.0)),
                        max_power_mw=float(row.get("power_mw", 1.0)) * 1.3,
                        priority=int(row.get("priority", 3)),
                        flexibility_pct=float(row.get("flexibility", 20.0)),
                        is_critical=is_crit
                    )
                    db.add(cg)
            parsed_summary.append(f"Processed {len(df)} consumer groups from CSV.")

    sim_state = db.query(SimulationState).first()
    if sim_state:
        sim_state.data_source_mode = "CSV Upload"

    evt = GridEvent(
        event_type="DATA_IMPORT",
        description=f"CSV Upload Completed: {'; '.join(parsed_summary)} Data source set to CSV Upload.",
        severity="INFO"
    )
    db.add(evt)
    db.commit()

    return {"message": "CSV upload processed successfully", "summary": parsed_summary}

@router.get("/outages")
def get_outage_fairness(db: Session = Depends(get_db)):
    villages = db.query(Village).all()
    feeders = db.query(Feeder).all()
    outages = db.query(Outage).filter(Outage.is_active == True).all()

    village_outages = []
    for v in villages:
        feeder = next((f for f in feeders if f.id == v.feeder_id), None)
        village_outages.append({
            "village_name": v.name,
            "feeder_code": feeder.feeder_id if feeder else "N/A",
            "outage_hours_today": round(v.outage_hours_today, 1),
            "consumer_count": v.consumer_count,
            "equity_status": "POOR" if v.outage_hours_today >= 2.0 else ("MODERATE" if v.outage_hours_today >= 1.0 else "EXCELLENT")
        })

    return {
        "total_active_outages": len(outages),
        "village_outage_balance": village_outages,
        "active_outage_records": [
            {
                "id": o.id,
                "feeder_id": o.feeder_id,
                "village_name": o.village_name,
                "reason": o.reason,
                "duration_hours": o.duration_hours,
                "start_time": o.start_time.strftime("%H:%M:%S")
            } for o in outages
        ]
    }

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    feeders = db.query(Feeder).all()
    cgroups = db.query(ConsumerGroup).all()
    events = db.query(GridEvent).all()
    villages = db.query(Village).all()

    # Load distribution by category
    categories = {}
    for cg in cgroups:
        cat = cg.consumer_type
        categories[cat] = round(categories.get(cat, 0.0) + cg.power_mw, 2)

    # Feeder loading percentages
    feeder_loads = [
        {
            "code": f.feeder_id,
            "name": f.feeder_name,
            "capacity_mw": f.capacity_mw,
            "load_mw": f.current_load_mw,
            "loading_pct": round((f.current_load_mw / max(0.1, f.capacity_mw)) * 100, 1)
        } for f in feeders
    ]

    # Outage breakdown per village
    outage_data = [
        {
            "name": v.name,
            "outage_hours": round(v.outage_hours_today, 1)
        } for v in villages
    ]

    # Event count distribution
    event_counts = {}
    for e in events:
        event_counts[e.event_type] = event_counts.get(e.event_type, 0) + 1

    return {
        "load_by_category": categories,
        "feeder_loading": feeder_loads,
        "outage_distribution": outage_data,
        "event_summary": event_counts
    }
