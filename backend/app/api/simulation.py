from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import SimulationControl, EventInject
from app.models.models import SimulationState, Substation
from app.services.simulation_engine import simulation_engine_service
from app.services.data_service import initialize_demo_grid

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

@router.get("/state")
def get_simulation_state(db: Session = Depends(get_db)):
    state = db.query(SimulationState).first()
    substation = db.query(Substation).first()
    if not state:
        state = SimulationState(is_running=True, speed_multiplier=1, simulated_time="14:35", active_scenario="Normal")
        db.add(state)
        db.commit()
        db.refresh(state)

    return {
        "is_running": state.is_running,
        "speed_multiplier": state.speed_multiplier,
        "simulated_time": state.simulated_time,
        "active_scenario": state.active_scenario,
        "data_source_mode": state.data_source_mode,
        "available_power_mw": substation.available_power_mw if substation else 18.0
    }

@router.post("/control")
@router.post("/start")
@router.post("/pause")
@router.post("/reset")
def control_simulation(control: SimulationControl = None, action_type: str = "control", db: Session = Depends(get_db)):
    state = db.query(SimulationState).first()
    if not state:
        state = SimulationState(is_running=True, speed_multiplier=1, simulated_time="14:35", active_scenario="Normal")
        db.add(state)
        db.flush()

    act = control.action if control else "start"

    if act == "start":
        state.is_running = True
        if control and control.speed:
            state.speed_multiplier = control.speed
    elif act == "pause":
        state.is_running = False
    elif act == "reset":
        state.is_running = True
        state.speed_multiplier = 1
        state.simulated_time = "14:00"
        state.simulated_hour = 14.0
        state.active_scenario = "Normal"
        initialize_demo_grid(db)

    db.commit()
    db.refresh(state)

    # Advance one tick on start/resume
    if state.is_running:
        simulation_engine_service.advance_simulation_tick(db)

    return {
        "message": f"Simulation set to {act}",
        "is_running": state.is_running,
        "speed_multiplier": state.speed_multiplier,
        "simulated_time": state.simulated_time
    }

@router.post("/tick")
def trigger_tick(db: Session = Depends(get_db)):
    simulation_engine_service.advance_simulation_tick(db)
    state = db.query(SimulationState).first()
    return {"simulated_time": state.simulated_time if state else "14:35"}

@router.post("/inject")
def inject_event(event: EventInject, db: Session = Depends(get_db)):
    desc = simulation_engine_service.inject_event(
        db,
        event_type=event.event_type,
        feeder_code=event.feeder_code,
        magnitude_mw=event.magnitude_mw or 1.5
    )
    # Trigger tick immediately so simulator reflects event
    simulation_engine_service.advance_simulation_tick(db)
    return {"message": "Event injected successfully", "description": desc}
