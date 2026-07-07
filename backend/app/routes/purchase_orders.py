from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import PurchaseOrders, Inventory
from app.schemas import PurchaseOrderResponse

router = APIRouter()

@router.get("", response_model=list[PurchaseOrderResponse])
def list_purchase_orders(db: Session = Depends(get_db)):
    return db.query(PurchaseOrders).order_by(PurchaseOrders.created_at.desc()).all()

@router.put("/{po_id}/status")
def update_po_status(po_id: int, status: str, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrders).filter(PurchaseOrders.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
        
    old_status = po.status
    po.status = status
    
    # If transitioning to Approved from Rejected/Pending, adjust stock
    if status == "Approved" and old_status != "Approved":
        item = db.query(Inventory).filter(Inventory.sku == po.sku).first()
        if item:
            item.quantity += po.quantity
            
    db.commit()
    db.refresh(po)
    return {"status": "success", "po_id": po.id, "new_status": po.status}
