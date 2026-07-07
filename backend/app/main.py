import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.models.models import Inventory, Suppliers, Budget, Employees, SystemHealth
from app.routes import (
    dashboard, inventory, suppliers, budget, 
    purchase_orders, reports, notifications, 
    monitoring, self_healing, simulator, ai
)

logger = logging.getLogger("erp_main")
logging.basicConfig(level=logging.INFO)

# Seed database with initial default data if empty
def seed_database(db: Session):
    # 1. Budget Seeding
    if db.query(Budget).count() == 0:
        logger.info("Seeding initial company budget...")
        default_budget = Budget(
            monthly_budget=100000.0,
            salaries=22000.0,
            rent=6000.0,
            utilities=3000.0,
            operational_expenses=14000.0,
            remaining_budget=55000.0 # 100000 - 22000 - 6000 - 3000 - 14000
        )
        db.add(default_budget)
        db.commit()

    # 2. Inventory Seeding
    if db.query(Inventory).count() == 0:
        logger.info("Seeding initial inventory items...")
        items = [
            Inventory(sku="IRN-ROD-01", name="Iron Rods (10m)", category="Raw Materials", quantity=15, reorder_point=20, reorder_quantity=50, overstock_threshold=200, unit_price=120.0),
            Inventory(sku="COP-WIR-02", name="Copper Wire (100m)", category="Electronics", quantity=8, reorder_point=10, reorder_quantity=30, overstock_threshold=150, unit_price=250.0),
            Inventory(sku="ALU-PLT-03", name="Aluminum Plates (2x2m)", category="Raw Materials", quantity=45, reorder_point=15, reorder_quantity=40, overstock_threshold=250, unit_price=85.0),
            Inventory(sku="STE-SCR-04", name="Steel Screws (Box 500)", category="Fasteners", quantity=250, reorder_point=50, reorder_quantity=500, overstock_threshold=1000, unit_price=15.0),
            Inventory(sku="PLT-PCK-05", name="Plastic Packaging Sheets", category="Packaging", quantity=600, reorder_point=100, reorder_quantity=1000, overstock_threshold=5000, unit_price=1.2)
        ]
        db.add_all(items)
        db.commit()

    # 3. Suppliers Seeding
    if db.query(Suppliers).count() == 0:
        logger.info("Seeding default suppliers...")
        suppliers = [
            # Iron Rod suppliers
            Suppliers(name="Apex Metals Corp", material="Iron Rods (10m)", price=120.0, delivery_days=3, rating=4.5, is_preferred=True),
            Suppliers(name="Global Alloys Ltd", material="Iron Rods (10m)", price=125.0, delivery_days=2, rating=4.2),
            Suppliers(name="Summit Heavy Industries", material="Iron Rods (10m)", price=115.0, delivery_days=6, rating=3.8),
            
            # Copper Wire suppliers
            Suppliers(name="VoltTech Components", material="Copper Wire (100m)", price=250.0, delivery_days=2, rating=4.8, is_preferred=True),
            Suppliers(name="EcoWires Manufacturing", material="Copper Wire (100m)", price=240.0, delivery_days=5, rating=4.0),
            Suppliers(name="CopperDirect Inc", material="Copper Wire (100m)", price=260.0, delivery_days=1, rating=4.3),

            # Aluminum Plates suppliers
            Suppliers(name="Vanguard Aerospace Alloys", material="Aluminum Plates (2x2m)", price=85.0, delivery_days=4, rating=4.6, is_preferred=True),
            Suppliers(name="Sheet Metal Distributors", material="Aluminum Plates (2x2m)", price=90.0, delivery_days=3, rating=4.1),

            # Steel Screws suppliers
            Suppliers(name="Fasteners Unlimited", material="Steel Screws (Box 500)", price=15.0, delivery_days=5, rating=4.2),
            Suppliers(name="Pro-Tite Screws Corp", material="Steel Screws (Box 500)", price=14.0, delivery_days=7, rating=4.7, is_preferred=True),

            # Packaging suppliers
            Suppliers(name="EcoPack Solutions", material="Plastic Packaging Sheets", price=1.20, delivery_days=3, rating=4.4, is_preferred=True),
            Suppliers(name="FlexiWrap Industries", material="Plastic Packaging Sheets", price=1.15, delivery_days=4, rating=3.9)
        ]
        db.add_all(suppliers)
        db.commit()

    # 4. Employees Seeding
    if db.query(Employees).count() == 0:
        logger.info("Seeding default employees...")
        employees = [
            Employees(name="Alice Vance", role="Operations Director", salary=8000.0),
            Employees(name="Bob Carter", role="Procurement Manager", salary=6000.0),
            Employees(name="Charlie Davis", role="Warehouse Supervisor", salary=4500.0),
            Employees(name="Diana Evans", role="Systems Operator", salary=3500.0)
        ]
        db.add_all(employees)
        db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Run Seeding
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()
        
    yield

app = FastAPI(
    title="AI ERP Multi-Agent System",
    description="A multi-agent autonomous business decision system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Global API Response Timer Middleware
@app.middleware("http")
async def time_response(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = (time.time() - start_time) * 1000
    # Store dynamic response time inside request state
    request.state.duration_ms = duration
    return response

# Register Routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["Suppliers"])
app.include_router(budget.router, prefix="/api/budget", tags=["Budget"])
app.include_router(purchase_orders.router, prefix="/api/purchase-orders", tags=["Purchase Orders"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(self_healing.router, prefix="/api/self-healing", tags=["Self Healing"])
app.include_router(simulator.router, prefix="/api/simulator", tags=["Simulator"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Analysis"])

@app.get("/api/health")
def api_health():
    return {"status": "running", "timestamp": time.time()}
