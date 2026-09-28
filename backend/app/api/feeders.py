from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Substation, Feeder, Village, ConsumerGroup, LoadReading
from typing import List, Dict, Any
from collections import defaultdict

router = APIRouter(prefix="/api/feeders", tags=["Feeders"])

@router.get("")
def get_feeders(db: Session = Depends(get_db)):
    feeders = db.query(Feeder).all()
    all_villages = db.query(Village).all()
    all_cgroups = db.query(ConsumerGroup).all()

    villages_by_feeder = defaultdict(list)
    for v in all_villages:
        villages_by_feeder[v.feeder_id].append(v)

    cgroups_by_feeder = defaultdict(list)
    for cg in all_cgroups:
        cgroups_by_feeder[cg.feeder_id].append(cg)

    result = []
    for f in feeders:
        villages = villages_by_feeder.get(f.id, [])
        cgroups = cgroups_by_feeder.get(f.id, [])
        loading_pct = round((f.current_load_mw / max(0.1, f.capacity_mw)) * 100, 1)
        
        result.append({
            "id": f.id,
            "feeder_id": f.feeder_id,
            "feeder_name": f.feeder_name,
            "capacity_mw": f.capacity_mw,
            "current_load_mw": f.current_load_mw,
            "loading_pct": loading_pct,
            "status": f.status,
            "villages": [{"id": v.id, "name": v.name, "outage_hours": v.outage_hours_today} for v in villages],
            "consumer_groups": [
                {
                    "id": cg.id,
                    "type": cg.consumer_type,
                    "power_mw": cg.power_mw,
                    "priority": cg.priority,
                    "is_critical": cg.is_critical
                } for cg in cgroups
            ]
        })
    return result

@router.get("/tree")
def get_network_tree(db: Session = Depends(get_db)):
    substation = db.query(Substation).first()
    feeders = db.query(Feeder).all()
    
    if not substation:
        return {"substation": None, "feeders": []}

    all_villages = db.query(Village).all()
    all_cgroups = db.query(ConsumerGroup).all()

    villages_by_feeder = defaultdict(list)
    for v in all_villages:
        villages_by_feeder[v.feeder_id].append(v)

    cgroups_by_feeder = defaultdict(list)
    for cg in all_cgroups:
        cgroups_by_feeder[cg.feeder_id].append(cg)

    feeders_tree = []
    for f in feeders:
        villages = villages_by_feeder.get(f.id, [])
        cgroups = cgroups_by_feeder.get(f.id, [])
        loading_pct = round((f.current_load_mw / max(0.1, f.capacity_mw)) * 100, 1)

        feeders_tree.append({
            "id": f.id,
            "code": f.feeder_id,
            "name": f.feeder_name,
            "capacity_mw": f.capacity_mw,
            "current_load_mw": f.current_load_mw,
            "loading_pct": loading_pct,
            "status": f.status,
            "villages": [v.name for v in villages],
            "critical_load_mw": round(sum(cg.power_mw for cg in cgroups if cg.is_critical or cg.priority == 1), 2),
            "flexible_load_mw": round(sum(cg.power_mw for cg in cgroups if cg.priority in [4, 5]), 2)
        })

    return {
        "substation": {
            "name": substation.name,
            "capacity_mw": substation.capacity_mw,
            "available_power_mw": substation.available_power_mw,
            "voltage_level_kv": substation.voltage_level_kv
        },
        "feeders": feeders_tree
    }

@router.get("/{feeder_id}")
def get_feeder_detail(feeder_id: str, db: Session = Depends(get_db)):
    query = db.query(Feeder).filter(Feeder.feeder_id == feeder_id)
    if feeder_id.isdigit():
        query = db.query(Feeder).filter((Feeder.feeder_id == feeder_id) | (Feeder.id == int(feeder_id)))
    
    feeder = query.first()
    if not feeder:
        raise HTTPException(status_code=404, detail="Feeder not found")

    villages = db.query(Village).filter(Village.feeder_id == feeder.id).all()
    cgroups = db.query(ConsumerGroup).filter(ConsumerGroup.feeder_id == feeder.id).all()
    readings = db.query(LoadReading).filter(LoadReading.feeder_id == feeder.id).order_by(LoadReading.timestamp.desc()).limit(20).all()

    return {
        "id": feeder.id,
        "feeder_id": feeder.feeder_id,
        "feeder_name": feeder.feeder_name,
        "capacity_mw": feeder.capacity_mw,
        "current_load_mw": feeder.current_load_mw,
        "status": feeder.status,
        "villages": [v.name for v in villages],
        "consumer_groups": cgroups,
        "recent_readings": readings
    }

