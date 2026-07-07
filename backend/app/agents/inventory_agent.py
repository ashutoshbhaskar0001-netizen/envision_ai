from sqlalchemy.orm import Session
from app.agents.base import BaseAgent
from app.models.models import Inventory

class InventoryAgent(BaseAgent):
    def __init__(self):
        super().__init__("Inventory Agent")

    def monitor_inventory(self, db: Session):
        """Scans the inventory table and returns items requiring attention."""
        self.log_message(db, "INFO", "Starting inventory monitoring scan...")
        items = db.query(Inventory).all()
        
        shortages = []
        overstocks = []
        
        for item in items:
            if item.quantity <= item.reorder_point:
                shortages.append(item)
                self.log_message(
                    db, 
                    "WARNING", 
                    f"Low stock detected for SKU '{item.sku}' ({item.name}). "
                    f"Quantity: {item.quantity}, Reorder Point: {item.reorder_point}."
                )
            elif item.quantity >= item.overstock_threshold:
                overstocks.append(item)
                self.log_message(
                    db,
                    "INFO",
                    f"Overstock detected for SKU '{item.sku}' ({item.name}). "
                    f"Quantity: {item.quantity}, Overstock Threshold: {item.overstock_threshold}."
                )
        
        self.log_message(
            db, 
            "INFO", 
            f"Inventory scan complete. Shortages: {len(shortages)}, Overstocks: {len(overstocks)}."
        )
        return shortages, overstocks

    def create_purchase_request(self, db: Session, item: Inventory) -> dict:
        """Generates a purchase request dictionary containing SKU and estimated costs."""
        # Python handles calculations
        estimated_cost = round(item.reorder_quantity * item.unit_price, 2)
        
        request = {
            "sku": item.sku,
            "name": item.name,
            "quantity": item.reorder_quantity,
            "unit_price": item.unit_price,
            "estimated_cost": estimated_cost,
            "category": item.category
        }
        
        self.log_decision(
            db,
            "Purchase Request Generated",
            {
                "sku": item.sku,
                "name": item.name,
                "reorder_quantity": item.reorder_quantity,
                "estimated_cost": estimated_cost
            }
        )
        return request
