from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Inventory, Budget, PurchaseOrders, AIHistory, SystemHealth, Suppliers

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Inventory counts
    items = db.query(Inventory).all()
    total_val = sum(i.quantity * i.unit_price for i in items)
    low_stock = len([i for i in items if i.quantity <= i.reorder_point])
    
    # 2. Budget counts
    budget = db.query(Budget).first()
    remaining_budget = budget.remaining_budget if budget else 0.0
    monthly_budget = budget.monthly_budget if budget else 0.0
    
    # 3. Purchase orders and savings
    pos = db.query(PurchaseOrders).all()
    approved_pos = [p for p in pos if p.status == "Approved"]
    
    # Calculate savings in Python
    savings = sum((db.query(Suppliers).filter(Suppliers.id == p.supplier_id).first().price * p.quantity - p.total_price) 
                  for p in approved_pos if db.query(Suppliers).filter(Suppliers.id == p.supplier_id).first())
    savings = round(max(0.0, savings), 2)
    
    # 4. Recent AI Decisions (limit to 5)
    recent_decisions_db = db.query(AIHistory).order_by(AIHistory.timestamp.desc()).limit(5).all()
    recent_decisions = []
    for d in recent_decisions_db:
        recent_decisions.append({
            "id": d.id,
            "timestamp": d.timestamp.isoformat(),
            "agent_name": d.agent_name,
            "action_type": d.action_type,
            "decision_details": d.decision_details
        })

    # 5. Latest System Health
    health = db.query(SystemHealth).order_by(SystemHealth.timestamp.desc()).first()
    health_data = {
        "cpu_usage": health.cpu_usage if health else 5.2,
        "memory_usage": health.memory_usage if health else 42.1,
        "db_status": health.db_status if health else "Healthy",
        "api_status": health.api_status if health else "Healthy",
        "response_time_ms": health.response_time_ms if health else 12.5
    }

    # 6. Active Agent Status
    agent_states = [
        {"name": "Inventory Agent", "status": "Running", "role": "Continuously checking stock thresholds"},
        {"name": "Supplier Intelligence Agent", "status": "Running", "role": "Comparing material supplier quotes"},
        {"name": "Budget Agent", "status": "Running", "role": "Auditing procurement affordability"},
        {"name": "Purchasing Agent", "status": "Running", "role": "Recording purchase transaction orders"},
        {"name": "Reporting Agent", "status": "Running", "role": "Formatting summaries and generating PDFs"},
        {"name": "Notification Agent", "status": "Running", "role": "Publishing events to notification streams"},
        {"name": "Monitoring Agent", "status": "Running", "role": "Checking CPU, DB, and Gemini API health"},
        {"name": "Self-Healing Agent", "status": "Running", "role": "Interpreting exceptions and hot-patching code"},
        {"name": "Orchestrator Agent", "status": "Running", "role": "Coordinating inter-agent workflows"}
    ]

    return {
        "inventory_value": round(total_val, 2),
        "low_stock_count": low_stock,
        "monthly_budget": monthly_budget,
        "budget_remaining": remaining_budget,
        "savings_generated": savings,
        "purchase_orders_count": len(pos),
        "approved_orders_count": len(approved_pos),
        "recent_decisions": recent_decisions,
        "system_health": health_data,
        "agent_states": agent_states
    }
