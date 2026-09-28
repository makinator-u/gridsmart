from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SubstationBase(BaseModel):
    name: str = "Main Rural Substation 33/11kV"
    capacity_mw: float = 20.0
    available_power_mw: float = 18.0
    voltage_level_kv: float = 33.0

class SubstationCreate(SubstationBase):
    pass

class SubstationResponse(SubstationBase):
    id: int
    data_source: str
    created_at: datetime

    class Config:
        from_attributes = True

class FeederBase(BaseModel):
    feeder_id: str
    feeder_name: str
    capacity_mw: float
    current_load_mw: float = 0.0
    status: str = "NORMAL"

class FeederCreate(FeederBase):
    pass

class FeederResponse(FeederBase):
    id: int
    substation_id: Optional[int] = None

    class Config:
        from_attributes = True

class VillageBase(BaseModel):
    name: str
    feeder_id: int
    consumer_count: int = 150
    outage_hours_today: float = 0.0

class VillageResponse(VillageBase):
    id: int

    class Config:
        from_attributes = True

class ConsumerGroupBase(BaseModel):
    consumer_type: str
    power_mw: float
    max_power_mw: float
    priority: int = 3
    flexibility_pct: float = 20.0
    is_critical: bool = False

class ConsumerGroupCreate(ConsumerGroupBase):
    feeder_id: int

class ConsumerGroupResponse(ConsumerGroupBase):
    id: int
    feeder_id: int
    outage_hours_today: float = 0.0

    class Config:
        from_attributes = True

class GridStatusResponse(BaseModel):
    total_feeders: int
    normal_feeders: int
    warning_feeders: int
    overloaded_feeders: int
    offline_feeders: int
    maintenance_feeders: int
    total_demand_mw: float
    available_power_mw: float
    current_shortage_mw: float
    critical_load_mw: float
    flexible_load_mw: float
    current_outages_count: int
    data_source: str
    simulation_time: str
    active_scenario: str
    is_running: bool
    speed_multiplier: int

class ManualGridCreate(BaseModel):
    substation_name: str = "Rural Central Substation"
    substation_capacity_mw: float = 25.0
    available_power_mw: float = 20.0
    voltage_level_kv: float = 33.0
    feeders: List[dict] # list of feeder items with name, capacity, connected_villages, consumer_groups

class SimulationControl(BaseModel):
    action: str # start, pause, reset
    speed: Optional[int] = None # 1, 5, 10

class EventInject(BaseModel):
    event_type: str # INCREASE_AGRICULTURE, INCREASE_RESIDENTIAL, REDUCE_GENERATION, TRIP_FEEDER, MAINTENANCE, RESTORE_FEEDER
    feeder_code: Optional[str] = None
    magnitude_mw: Optional[float] = 1.5

class OptimizationRequest(BaseModel):
    notes: Optional[str] = "Manual operator optimization request"

class OptimizationRunResponse(BaseModel):
    id: int
    timestamp: datetime
    total_demand_mw: float
    available_power_mw: float
    shortage_mw: float
    status: str
    summary_notes: Optional[str] = None
    recommended_actions: List[dict]

    class Config:
        from_attributes = True

class ScenarioRunRequest(BaseModel):
    scenario_name: str # Normal, High Agricultural Demand, Drought, Severe Drought, Heat Wave, Power Generation Shortage, Feeder Maintenance, Feeder Fault

class GridEventResponse(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    feeder_id: Optional[int] = None
    description: str
    severity: str

    class Config:
        from_attributes = True
