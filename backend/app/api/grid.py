from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import GridStatusResponse, ManualGridCreate
from app.models.models import Substation, Feeder, Village, ConsumerGroup, LoadReading, SimulationState, GridEvent, Outage
from app.services.data_service import initialize_demo_grid
from app.services.monitoring_engine import monitoring_engine_service
from typing import Dict, Any, List
import pandas as pd
import io

router = APIRouter(prefix="/api/grid", tags=["Grid"])

@router.get("/status", response_model=GridStatusResponse)
def get_grid_status(db: Session = Depends(get_db)):
    substation = db.query(Substation).first()
    sim_state = db.query(SimulationState).first()
    
    if not substation:
        # Auto-initialize demo grid on first access if DB empty
        substation = initialize_demo_grid(db)
        sim_state = db.query(SimulationState).first()

    status_data = monitoring_engine_service.evaluate_grid_status(db)

    return GridStatusResponse(
        total_feeders=status_data["total_feeders"],
        normal_feeders=status_data["normal_feeders"],
        warning_feeders=status_data["warning_feeders"],
        overloaded_feeders=status_data["overloaded_feeders"],
        offline_feeders=status_data["offline_feeders"],
        maintenance_feeders=status_data["maintenance_feeders"],
        total_demand_mw=status_data["total_demand_mw"],
        available_power_mw=status_data["available_power_mw"],
        current_shortage_mw=status_data["current_shortage_mw"],
        critical_load_mw=status_data["critical_load_mw"],
        flexible_load_mw=status_data["flexible_load_mw"],
        current_outages_count=status_data["current_outages_count"],
        data_source=sim_state.data_source_mode if sim_state else "Demo Simulation",
        simulation_time=sim_state.simulated_time if sim_state else "14:35",
        active_scenario=sim_state.active_scenario if sim_state else "Normal",
        is_running=sim_state.is_running if sim_state else True,
        speed_multiplier=sim_state.speed_multiplier if sim_state else 1
    )

@router.post("/demo")
def load_demo_grid(db: Session = Depends(get_db)):
    substation = initialize_demo_grid(db)
    return {"message": "Demo rural grid loaded successfully", "substation": substation.name}

@router.post("/create")
def create_manual_grid(payload: ManualGridCreate, db: Session = Depends(get_db)):
    # Clear existing state
    db.query(Outage).delete()
    db.query(GridEvent).delete()
    db.query(LoadReading).delete()
    db.query(ConsumerGroup).delete()
    db.query(Village).delete()
    db.query(Feeder).delete()
    db.query(Substation).delete()
    db.query(SimulationState).delete()

    substation = Substation(
        name=payload.substation_name,
        capacity_mw=payload.substation_capacity_mw,
        available_power_mw=payload.available_power_mw,
        voltage_level_kv=payload.voltage_level_kv,
        data_source="Manual Entry"
    )
    db.add(substation)
    db.flush()

    for idx, f_data in enumerate(payload.feeders, 1):
        f_code = f_data.get("feeder_id", f"F0{idx}")
        feeder = Feeder(
            feeder_id=f_code,
            feeder_name=f_data.get("name", f"Feeder {f_code}"),
            capacity_mw=float(f_data.get("capacity_mw", 4.0)),
            current_load_mw=float(f_data.get("initial_load_mw", 2.5)),
            status="NORMAL",
            substation_id=substation.id
        )
        db.add(feeder)
        db.flush()

        # Connected village
        village_name = f_data.get("connected_village", f"Village {f_code}")
        village = Village(
            name=village_name,
            feeder_id=feeder.id,
            consumer_count=int(f_data.get("consumer_count", 200)),
            outage_hours_today=0.0
        )
        db.add(village)

        # Consumer groups
        groups = f_data.get("consumer_groups", [
            {"consumer_type": "Residential", "power_mw": 1.2, "priority": 3, "is_critical": False},
            {"consumer_type": "Agriculture", "power_mw": 1.0, "priority": 4, "is_critical": False},
            {"consumer_type": "Hospital", "power_mw": 0.3, "priority": 1, "is_critical": True}
        ])

        for g in groups:
            cg = ConsumerGroup(
                feeder_id=feeder.id,
                consumer_type=g.get("consumer_type", "Residential"),
                power_mw=float(g.get("power_mw", 1.0)),
                max_power_mw=float(g.get("power_mw", 1.0)) * 1.3,
                priority=int(g.get("priority", 3)),
                flexibility_pct=30.0 if g.get("consumer_type") == "Agriculture" else 15.0,
                is_critical=bool(g.get("is_critical", False))
            )
            db.add(cg)

    sim_state = SimulationState(
        is_running=True,
        speed_multiplier=1,
        simulated_time="14:00",
        simulated_hour=14.0,
        active_scenario="Normal",
        data_source_mode="Manual Entry"
    )
    db.add(sim_state)

    event = GridEvent(
        event_type="SYSTEM_START",
        description=f"Manual Grid Created: Substation '{substation.name}' with {len(payload.feeders)} feeders.",
        severity="INFO"
    )
    db.add(event)

    db.commit()
    return {"message": "Manual grid created successfully", "substation_id": substation.id}
