from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import ScenarioRunRequest
from app.models.models import SimulationState, GridEvent, Feeder, Substation
from app.services.simulation_engine import simulation_engine_service

router = APIRouter(prefix="/api/scenarios", tags=["Scenarios"])

SCENARIOS_CATALOG = [
    {
        "name": "Normal",
        "description": "Standard rural operational conditions with typical diurnal load variation.",
        "agri_delta_pct": 0,
        "gen_delta_mw": 0.0,
        "severity": "INFO"
    },
    {
        "name": "High Agricultural Demand",
        "description": "Peak irrigation season causing agricultural pump loads to spike by +35%.",
        "agri_delta_pct": 35,
        "gen_delta_mw": 0.0,
        "severity": "WARNING"
    },
    {
        "name": "Drought",
        "description": "Groundwater depletion forces extended pump usage (+45% Agri load) and hydro generation drop (-2.5 MW).",
        "agri_delta_pct": 45,
        "gen_delta_mw": -2.5,
        "severity": "WARNING"
    },
    {
        "name": "Severe Drought",
        "description": "Emergency drought state: Agricultural load +50%, Available power -4.0 MW. Water supply elevated to highest priority.",
        "agri_delta_pct": 50,
        "gen_delta_mw": -4.0,
        "severity": "CRITICAL"
    },
    {
        "name": "Heat Wave",
        "description": "Extreme summer ambient temperatures drive domestic cooling and refrigeration loads up (+30%).",
        "agri_delta_pct": 10,
        "gen_delta_mw": -1.0,
        "severity": "WARNING"
    },
    {
        "name": "Power Generation Shortage",
        "description": "Upstream grid transformer trip causes available substation supply to drop by -5.0 MW.",
        "agri_delta_pct": 0,
        "gen_delta_mw": -5.0,
        "severity": "CRITICAL"
    },
    {
        "name": "Feeder Maintenance",
        "description": "Scheduled maintenance outage on Feeder F03 (Central Industrial). Load redistributed.",
        "agri_delta_pct": 0,
        "gen_delta_mw": 0.0,
        "severity": "INFO"
    },
    {
        "name": "Feeder Fault",
        "description": "Sudden insulator breakdown trips Feeder F02 (Agro-Belt). Total load shed on F02 until clearance.",
        "agri_delta_pct": 0,
        "gen_delta_mw": 0.0,
        "severity": "CRITICAL"
    }
]

@router.get("")
def list_scenarios():
    return SCENARIOS_CATALOG

@router.post("/run")
def run_scenario(req: ScenarioRunRequest, db: Session = Depends(get_db)):
    state = db.query(SimulationState).first()
    if not state:
        state = SimulationState(is_running=True, speed_multiplier=1, simulated_time="14:35", active_scenario="Normal")
        db.add(state)
        db.flush()

    scenario_name = req.scenario_name
    match = next((s for s in SCENARIOS_CATALOG if s["name"].lower() == scenario_name.lower()), None)
    if not match:
        raise HTTPException(status_code=404, detail="Scenario not found")

    state.active_scenario = match["name"]

    # Handle scenario specific feeder adjustments
    feeders = db.query(Feeder).all()
    substation = db.query(Substation).first()

    if match["name"] == "Feeder Maintenance":
        # Target an active feeder (prefer 3rd feeder or first active)
        target = feeders[2] if len(feeders) > 2 else (feeders[0] if feeders else None)
        if target:
            target.status = "MAINTENANCE"
    elif match["name"] == "Feeder Fault":
        # Target an active feeder (prefer 2nd feeder or first active)
        target = feeders[1] if len(feeders) > 1 else (feeders[0] if feeders else None)
        if target:
            target.status = "OFFLINE"
    else:
        # Reset feeder statuses to NORMAL if previously tripped by scenario
        for f in feeders:
            if f.status in ["OFFLINE", "MAINTENANCE"]:
                f.status = "NORMAL"

    evt = GridEvent(
        event_type="SCENARIO_CHANGE",
        description=f"Operator activated grid scenario: '{match['name']}'. {match['description']}",
        severity=match["severity"]
    )
    db.add(evt)
    db.commit()

    # Advance tick to recalculate loads under new scenario
    simulation_engine_service.advance_simulation_tick(db)

    return {
        "message": f"Scenario '{match['name']}' activated successfully.",
        "active_scenario": match["name"],
        "description": match["description"]
    }
