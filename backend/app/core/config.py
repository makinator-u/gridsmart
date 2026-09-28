import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "GridSmart Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./gridsmart.db")
    CORS_ORIGINS: list[str] = ["*"]
    
    # Grid Simulation defaults
    DEFAULT_SPEED: int = 1
    SIMULATION_TICK_MINS: int = 3
    ANOMALY_CONTAMINATION: float = 0.06

settings = Settings()
