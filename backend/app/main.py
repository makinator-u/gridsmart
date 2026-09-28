from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, SessionLocal
from app.api import grid, feeders, simulation, alerts, optimization, scenarios, data_setup
from app.services.data_service import initialize_demo_grid

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GridSmart Backend",
    description="Rural Feeder Decision Support & Load Management System API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(grid.router)
app.include_router(feeders.router)
app.include_router(simulation.router)
app.include_router(alerts.router)
app.include_router(optimization.router)
app.include_router(scenarios.router)
app.include_router(data_setup.router)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Initialize default demo grid if empty
        grid.get_grid_status(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "app": "GridSmart — Rural Feeder Decision Support & Load Management System",
        "status": "ONLINE",
        "data_source": "Demo Simulation Engine (SCADA Abstraction Ready)",
        "docs_url": "/docs"
    }
