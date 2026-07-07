from datetime import datetime
from sqlalchemy.orm import Session
from app.agents.base import BaseAgent
from app.models.models import PurchaseOrders, Inventory

class PurchasingAgent(BaseAgent):
    def __init__(self):
        super().__init__("Purchasing Agent")

    def create_purchase_order(self, db: Session, sku: str, quantity: int, supplier_id: int, total_price: float, is_budget_approved: bool) -> dict:
        """Creates a purchase order in the database and updates inventory if approved."""
        status = "Approved" if is_budget_approved else "Rejected"
        notes = "Automatically approved by Budget Agent based on cash flow." if is_budget_approved else "Rejected due to insufficient budget."
        
        self.log_message(db, "INFO", f"Generating Purchase Order for SKU '{sku}' (Qty: {quantity}) with Status: {status}")
        
        # Create the purchase order entry
        po = PurchaseOrders(
            sku=sku,
            quantity=quantity,
            supplier_id=supplier_id,
            total_price=total_price,
            status=status,
            created_at=datetime.utcnow(),
            approved_at=datetime.utcnow() if is_budget_approved else None,
            notes=notes
        )
        
        db.add(po)
        db.commit()
        db.refresh(po)
        
        # If approved, increment the inventory item's stock immediately
        if is_budget_approved:
            item = db.query(Inventory).filter(Inventory.sku == sku).first()
            if item:
                old_qty = item.quantity
                item.quantity += quantity
                db.commit()
                self.log_message(
                    db, 
                    "INFO", 
                    f"Updated stock for SKU '{sku}': {old_qty} -> {item.quantity} (+{quantity})"
                )
            else:
                self.log_message(db, "ERROR", f"Inventory SKU '{sku}' not found to increment stock.")

        po_data = {
            "po_id": po.id,
            "sku": po.sku,
            "quantity": po.quantity,
            "supplier_id": po.supplier_id,
            "total_price": po.total_price,
            "status": po.status,
            "created_at": po.created_at.isoformat(),
            "notes": po.notes
        }

        self.log_decision(
            db,
            "Purchase Order Created",
            {
                "po_id": po.id,
                "sku": sku,
                "quantity": quantity,
                "total_price": total_price,
                "status": status
            }
        )
        return po_data
