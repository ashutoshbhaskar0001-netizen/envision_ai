from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Inventory, Budget, PurchaseOrders
from app.schemas import InventoryResponse, InventoryCreate
from app.agents.orchestrator import Orchestrator

router = APIRouter()
orchestrator = Orchestrator()

@router.get("", response_model=list[InventoryResponse])
def list_inventory(db: Session = Depends(get_db)):
    return db.query(Inventory).all()

@router.post("", response_model=InventoryResponse)
def create_inventory_item(item_data: InventoryCreate, db: Session = Depends(get_db)):
    # Check if SKU exists
    existing = db.query(Inventory).filter(Inventory.sku == item_data.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
        
    item = Inventory(**item_data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=InventoryResponse)
def update_inventory_item(item_id: int, item_data: InventoryCreate, db: Session = Depends(get_db)):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    for k, v in item_data.dict().items():
        setattr(item, k, v)
        
    db.commit()
    db.refresh(item)
    return item

@router.post("/check")
def trigger_inventory_check(db: Session = Depends(get_db)):
    """Triggers the orchestrator to check inventory and run automated replenishments."""
    pos_created = orchestrator.run_auto_inventory_replenish(db)
    return {
        "status": "completed",
        "purchase_orders_created": pos_created,
        "message": f"Processed procurement loop. Generated {len(pos_created)} orders."
    }

@router.post("/reset")
def reset_inventory_demostate(db: Session = Depends(get_db)):
    """Resets the inventory items and budget to initial low stock demo state."""
    try:
        # Clear inventory and purchase orders
        db.query(Inventory).delete()
        db.query(PurchaseOrders).delete()
        
        # Reset budget
        budget = db.query(Budget).first()
        if budget:
            budget.monthly_budget = 100000.0
            budget.salaries = 22000.0
            budget.rent = 6000.0
            budget.utilities = 3000.0
            budget.operational_expenses = 14000.0
            budget.remaining_budget = 55000.0
        else:
            budget = Budget(
                monthly_budget=100000.0,
                salaries=22000.0,
                rent=6000.0,
                utilities=3000.0,
                operational_expenses=14000.0,
                remaining_budget=55000.0
            )
            db.add(budget)
            
        # Re-seed default items (some are below reorder point)
        items = [
            Inventory(sku="IRN-ROD-01", name="Iron Rods (10m)", category="Raw Materials", quantity=15, reorder_point=20, reorder_quantity=50, overstock_threshold=200, unit_price=120.0),
            Inventory(sku="COP-WIR-02", name="Copper Wire (100m)", category="Electronics", quantity=8, reorder_point=10, reorder_quantity=30, overstock_threshold=150, unit_price=250.0),
            Inventory(sku="ALU-PLT-03", name="Aluminum Plates (2x2m)", category="Raw Materials", quantity=45, reorder_point=15, reorder_quantity=40, overstock_threshold=250, unit_price=85.0),
            Inventory(sku="STE-SCR-04", name="Steel Screws (Box 500)", category="Fasteners", quantity=250, reorder_point=50, reorder_quantity=500, overstock_threshold=1000, unit_price=15.0),
            Inventory(sku="PLT-PCK-05", name="Plastic Packaging Sheets", category="Packaging", quantity=600, reorder_point=100, reorder_quantity=1000, overstock_threshold=5000, unit_price=1.2)
        ]
        db.add_all(items)
        db.commit()
        return {"status": "success", "message": "Database and inventory reset to low-stock demo state."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {e}")

@router.delete("/{item_id}")
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item)
    db.commit()
    return {"status": "success", "message": f"Inventory item {item_id} deleted successfully"}
