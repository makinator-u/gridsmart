from abc import ABC, abstractmethod
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import Substation, Feeder, Village, ConsumerGroup, LoadReading, SimulationState, GridEvent, Outage
from datetime import datetime

class BaseDataSource(ABC):
    """
    Abstract Data Source interface.
    Allows seamlessly plugging in SCADA/AMI/IoT interfaces in the future
    without modifying the monitoring, anomaly detection, or MILP optimization engines.
    """
    @abstractmethod
    def fetch_grid_data(self, db: Session) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_source_name(self) -> str:
        pass


class SimulatorDataSource(BaseDataSource):
    """
    Simulation Data Source that reads state from the local simulated database.
    """
    def get_source_name(self) -> str:
        return "Demo Simulation"

    def fetch_grid_data(self, db: Session) -> Dict[str, Any]:
        substation = db.query(Substation).first()
        feeders = db.query(Feeder).all()
        return {
            "source": self.get_source_name(),
            "substation": substation,
            "feeders": feeders
        }


class CSVDataSource(BaseDataSource):
    """
    CSV Upload Data Source that reads grid state imported via CSV files.
    """
    def get_source_name(self) -> str:
        return "CSV Upload"

    def fetch_grid_data(self, db: Session) -> Dict[str, Any]:
        substation = db.query(Substation).first()
        feeders = db.query(Feeder).all()
        return {
            "source": self.get_source_name(),
            "substation": substation,
            "feeders": feeders
        }


class FutureSCADADataSource(BaseDataSource):
    """
    Future SCADA / AMI Data Source placeholder.
    This architecture component demonstrates how a real SCADA connection
    (e.g., DNP3, IEC 60870-5-104, MQTT, or Utility REST API) can be hooked in.
    """
    def get_source_name(self) -> str:
        return "SCADA / AMI Utility Interface (Future)"

    def fetch_grid_data(self, db: Session) -> Dict[str, Any]:
        raise NotImplementedError("Real-time SCADA integration is not connected in this prototype.")


def initialize_demo_grid(db: Session) -> Substation:
    """
    Generates a realistic 6-feeder rural electricity distribution network.
    Substation capacity: 20 MW, Available generation: 18 MW.
    Feeders: F01 to F06 connecting 10 villages & 1000+ consumers.
    """
    # Clear existing data
    db.query(Outage).delete()
    db.query(GridEvent).delete()
    db.query(LoadReading).delete()
    db.query(ConsumerGroup).delete()
    db.query(Village).delete()
    db.query(Feeder).delete()
    db.query(Substation).delete()
    db.query(SimulationState).delete()

    substation = Substation(
        name="GridSmart Central Rural Substation 33/11kV",
        capacity_mw=22.0,
        available_power_mw=18.0,
        voltage_level_kv=33.0,
        data_source="Demo Simulation"
    )
    db.add(substation)
    db.flush()

    # Define 6 Feeders
    feeders_data = [
        {"feeder_id": "F01", "name": "F01 - Greenfield Rural", "capacity_mw": 4.0, "initial_load": 2.8},
        {"feeder_id": "F02", "name": "F02 - Agro-Belt Feeder", "capacity_mw": 4.0, "initial_load": 3.4},
        {"feeder_id": "F03", "name": "F03 - Central Industrial", "capacity_mw": 4.5, "initial_load": 3.1},
        {"feeder_id": "F04", "name": "F04 - South Village Cluster", "capacity_mw": 3.5, "initial_load": 2.4},
        {"feeder_id": "F05", "name": "F05 - North River Feeder", "capacity_mw": 3.5, "initial_load": 2.6},
        {"feeder_id": "F06", "name": "F06 - Valley East Feeder", "capacity_mw": 4.0, "initial_load": 2.7},
    ]

    feeder_objs = []
    for f in feeders_data:
        feeder = Feeder(
            feeder_id=f["feeder_id"],
            feeder_name=f["name"],
            capacity_mw=f["capacity_mw"],
            current_load_mw=f["initial_load"],
            status="NORMAL",
            substation_id=substation.id
        )
        db.add(feeder)
        feeder_objs.append(feeder)
    db.flush()

    # Mapping villages to feeders
    villages_data = [
        {"name": "Village Khed (A)", "feeder_code": "F01", "consumers": 180},
        {"name": "Village Shirur (B)", "feeder_code": "F01", "consumers": 210},
        {"name": "Village Rahuri (C)", "feeder_code": "F02", "consumers": 260},
        {"name": "Village Nevasa (D)", "feeder_code": "F02", "consumers": 240},
        {"name": "Village Sangamner (E)", "feeder_code": "F03", "consumers": 190},
        {"name": "Village Kopargaon (F)", "feeder_code": "F04", "consumers": 170},
        {"name": "Village Akole (G)", "feeder_code": "F04", "consumers": 150},
        {"name": "Village Junnar (H)", "feeder_code": "F05", "consumers": 220},
        {"name": "Village Ambegaon (I)", "feeder_code": "F05", "consumers": 160},
        {"name": "Village Parner (J)", "feeder_code": "F06", "consumers": 230},
    ]

    for v in villages_data:
        feeder = next(f for f in feeder_objs if f.feeder_id == v["feeder_code"])
        village = Village(
            name=v["name"],
            feeder_id=feeder.id,
            consumer_count=v["consumers"],
            outage_hours_today=0.5 if v["feeder_code"] == "F01" else (1.2 if v["feeder_code"] == "F02" else 0.0)
        )
        db.add(village)

    # Add Consumer Groups for each feeder
    consumer_templates = [
        # F01
        {"feeder_code": "F01", "type": "Residential", "power": 1.2, "max": 1.8, "priority": 3, "flex": 15, "crit": False},
        {"feeder_code": "F01", "type": "Agriculture", "power": 1.1, "max": 1.6, "priority": 4, "flex": 40, "crit": False},
        {"feeder_code": "F01", "type": "Commercial", "power": 0.3, "max": 0.5, "priority": 4, "flex": 25, "crit": False},
        {"feeder_code": "F01", "type": "Hospital", "power": 0.2, "max": 0.3, "priority": 1, "flex": 0, "crit": True},
        # F02 - Agro heavy
        {"feeder_code": "F02", "type": "Agriculture", "power": 2.1, "max": 2.8, "priority": 4, "flex": 50, "crit": False},
        {"feeder_code": "F02", "type": "Residential", "power": 0.9, "max": 1.4, "priority": 3, "flex": 15, "crit": False},
        {"feeder_code": "F02", "type": "Water Supply", "power": 0.3, "max": 0.4, "priority": 1, "flex": 0, "crit": True},
        {"feeder_code": "F02", "type": "Telecom", "power": 0.1, "max": 0.2, "priority": 2, "flex": 10, "crit": False},
        # F03 - Industrial & Health
        {"feeder_code": "F03", "type": "Industrial", "power": 1.8, "max": 2.2, "priority": 3, "flex": 30, "crit": False},
        {"feeder_code": "F03", "type": "Commercial", "power": 0.8, "max": 1.2, "priority": 4, "flex": 25, "crit": False},
        {"feeder_code": "F03", "type": "Hospital", "power": 0.4, "max": 0.5, "priority": 1, "flex": 0, "crit": True},
        {"feeder_code": "F03", "type": "Residential", "power": 0.1, "max": 0.3, "priority": 3, "flex": 15, "crit": False},
        # F04
        {"feeder_code": "F04", "type": "Residential", "power": 1.4, "max": 1.9, "priority": 3, "flex": 15, "crit": False},
        {"feeder_code": "F04", "type": "Agriculture", "power": 0.7, "max": 1.2, "priority": 4, "flex": 45, "crit": False},
        {"feeder_code": "F04", "type": "Water Supply", "power": 0.2, "max": 0.3, "priority": 1, "flex": 0, "crit": True},
        {"feeder_code": "F04", "type": "Commercial", "power": 0.1, "max": 0.2, "priority": 4, "flex": 20, "crit": False},
        # F05
        {"feeder_code": "F05", "type": "Agriculture", "power": 1.3, "max": 1.8, "priority": 4, "flex": 45, "crit": False},
        {"feeder_code": "F05", "type": "Residential", "power": 1.0, "max": 1.5, "priority": 3, "flex": 15, "crit": False},
        {"feeder_code": "F05", "type": "Telecom", "power": 0.1, "max": 0.2, "priority": 2, "flex": 0, "crit": False},
        {"feeder_code": "F05", "type": "Commercial", "power": 0.2, "max": 0.3, "priority": 4, "flex": 20, "crit": False},
        # F06
        {"feeder_code": "F06", "type": "Residential", "power": 1.5, "max": 2.0, "priority": 3, "flex": 15, "crit": False},
        {"feeder_code": "F06", "type": "Agriculture", "power": 0.8, "max": 1.4, "priority": 4, "flex": 40, "crit": False},
        {"feeder_code": "F06", "type": "Hospital", "power": 0.3, "max": 0.4, "priority": 1, "flex": 0, "crit": True},
        {"feeder_code": "F06", "type": "Commercial", "power": 0.1, "max": 0.2, "priority": 4, "flex": 20, "crit": False},
    ]

    for c in consumer_templates:
        feeder = next(f for f in feeder_objs if f.feeder_id == c["feeder_code"])
        cg = ConsumerGroup(
            feeder_id=feeder.id,
            consumer_type=c["type"],
            power_mw=c["power"],
            max_power_mw=c["max"],
            priority=c["priority"],
            flexibility_pct=c["flex"],
            is_critical=c["crit"],
            outage_hours_today=0.0
        )
        db.add(cg)

    # Initial simulation state
    sim_state = SimulationState(
        is_running=True,
        speed_multiplier=1,
        simulated_time="14:35",
        simulated_hour=14.58,
        active_scenario="Normal",
        data_source_mode="Simulation"
    )
    db.add(sim_state)

    # Log initial grid event
    init_event = GridEvent(
        event_type="SYSTEM_START",
        description="GridSmart Demo Grid initialized: 1 Substation, 6 Feeders, 10 Villages, 1000+ Consumers.",
        severity="INFO"
    )
    db.add(init_event)

    db.commit()
    db.refresh(substation)
    return substation
