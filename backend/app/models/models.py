from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Substation(Base):
    __tablename__ = "substations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, default="Main Rural Substation 33/11kV")
    capacity_mw = Column(Float, nullable=False, default=20.0)
    available_power_mw = Column(Float, nullable=False, default=18.0)
    voltage_level_kv = Column(Float, nullable=False, default=33.0)
    data_source = Column(String(50), nullable=False, default="Simulation")
    created_at = Column(DateTime, default=datetime.utcnow)

    feeders = relationship("Feeder", back_populates="substation", cascade="all, delete-orphan")

class Feeder(Base):
    __tablename__ = "feeders"

    id = Column(Integer, primary_key=True, index=True)
    feeder_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. F01
    feeder_name = Column(String(100), nullable=False)
    capacity_mw = Column(Float, nullable=False)
    current_load_mw = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="NORMAL") # NORMAL, HIGH_LOADING, OVERLOADED, OFFLINE, MAINTENANCE
    substation_id = Column(Integer, ForeignKey("substations.id"))

    substation = relationship("Substation", back_populates="feeders")
    villages = relationship("Village", back_populates="feeder", cascade="all, delete-orphan")
    consumer_groups = relationship("ConsumerGroup", back_populates="feeder", cascade="all, delete-orphan")
    load_readings = relationship("LoadReading", back_populates="feeder", cascade="all, delete-orphan")

class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    feeder_id = Column(Integer, ForeignKey("feeders.id"))
    consumer_count = Column(Integer, default=150)
    outage_hours_today = Column(Float, default=0.0)

    feeder = relationship("Feeder", back_populates="villages")

class ConsumerGroup(Base):
    __tablename__ = "consumer_groups"

    id = Column(Integer, primary_key=True, index=True)
    feeder_id = Column(Integer, ForeignKey("feeders.id"))
    consumer_type = Column(String(50), nullable=False) # Residential, Agriculture, Commercial, Water Supply, Hospital, Telecom, Industrial
    power_mw = Column(Float, nullable=False, default=0.0)
    max_power_mw = Column(Float, nullable=False, default=1.0)
    priority = Column(Integer, nullable=False, default=3) # 1=Must Stay ON, 2=Very Important, 3=Normal, 4=Flexible, 5=Least Important
    flexibility_pct = Column(Float, default=20.0) # Percentage of load that can be shed/shifted
    is_critical = Column(Boolean, default=False)
    outage_hours_today = Column(Float, default=0.0)

    feeder = relationship("Feeder", back_populates="consumer_groups")

class LoadReading(Base):
    __tablename__ = "load_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    feeder_id = Column(Integer, ForeignKey("feeders.id"))
    load_mw = Column(Float, nullable=False)
    residential_mw = Column(Float, default=0.0)
    agriculture_mw = Column(Float, default=0.0)
    commercial_mw = Column(Float, default=0.0)
    critical_mw = Column(Float, default=0.0)
    source = Column(String(50), default="Simulation")

    feeder = relationship("Feeder", back_populates="load_readings")

class Outage(Base):
    __tablename__ = "outages"

    id = Column(Integer, primary_key=True, index=True)
    feeder_id = Column(Integer, ForeignKey("feeders.id"))
    consumer_group_id = Column(Integer, ForeignKey("consumer_groups.id"), nullable=True)
    village_name = Column(String(100), nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    reason = Column(String(200), default="Load Management Reduction")
    duration_hours = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

class MaintenanceEvent(Base):
    __tablename__ = "maintenance_events"

    id = Column(Integer, primary_key=True, index=True)
    feeder_id = Column(Integer, ForeignKey("feeders.id"))
    description = Column(String(255), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="PLANNED") # PLANNED, IN_PROGRESS, COMPLETED

class GridEvent(Base):
    __tablename__ = "grid_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(50), nullable=False) # OVERLOAD, SHORTAGE, ANOMALY, OPTIMIZATION, OPERATOR_ACTION, RESTORATION, SCENARIO_CHANGE
    feeder_id = Column(Integer, ForeignKey("feeders.id"), nullable=True)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="INFO") # INFO, WARNING, CRITICAL

class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    total_demand_mw = Column(Float, nullable=False)
    available_power_mw = Column(Float, nullable=False)
    shortage_mw = Column(Float, nullable=False)
    status = Column(String(50), default="RECOMMENDED") # RECOMMENDED, APPROVED, REJECTED, EXECUTED
    summary_notes = Column(Text, nullable=True)

    recommended_actions = relationship("RecommendedAction", back_populates="optimization_run", cascade="all, delete-orphan")

class RecommendedAction(Base):
    __tablename__ = "recommended_actions"

    id = Column(Integer, primary_key=True, index=True)
    optimization_id = Column(Integer, ForeignKey("optimization_runs.id"))
    feeder_id = Column(Integer, ForeignKey("feeders.id"))
    feeder_code = Column(String(50), nullable=False) # e.g., F02
    consumer_group_name = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False) # REDUCE, SHIFT, DELAY, RESTORE, KEEP_ON
    load_mw = Column(Float, nullable=False) # MW to reduce or shift
    duration_mins = Column(Integer, default=60)
    status = Column(String(50), default="RECOMMENDED") # RECOMMENDED, APPROVED, REJECTED, EXECUTED

    optimization_run = relationship("OptimizationRun", back_populates="recommended_actions")

class SimulationState(Base):
    __tablename__ = "simulation_state"

    id = Column(Integer, primary_key=True, index=True)
    is_running = Column(Boolean, default=True)
    speed_multiplier = Column(Integer, default=1) # 1, 5, 10
    simulated_time = Column(String(10), default="14:35") # HH:MM string format for easy simulation time
    simulated_hour = Column(Float, default=14.58) # decimal hour
    active_scenario = Column(String(100), default="Normal")
    data_source_mode = Column(String(50), default="Simulation") # Simulation, Manual, CSV Upload
    last_updated = Column(DateTime, default=datetime.utcnow)
