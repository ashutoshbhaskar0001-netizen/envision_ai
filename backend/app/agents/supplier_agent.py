from sqlalchemy.orm import Session
from app.agents.base import BaseAgent
from app.models.models import Suppliers

class SupplierAgent(BaseAgent):
    def __init__(self):
        super().__init__("Supplier Intelligence Agent")

    def recommend_supplier(self, db: Session, material_name: str, quantity: int) -> dict:
        """Compares suppliers for a material and recommends the best one."""
        self.log_message(db, "INFO", f"Comparing suppliers for material: {material_name}")
        
        # Query all suppliers for the specified material
        suppliers = db.query(Suppliers).filter(Suppliers.material.ilike(material_name)).all()
        
        if not suppliers:
            # Check if there are general suppliers or try to search by SKU
            self.log_message(db, "WARNING", f"No suppliers found specifically for material: {material_name}. Trying fallback.")
            suppliers = db.query(Suppliers).all()
            if not suppliers:
                self.log_message(db, "ERROR", "No suppliers found in database at all.")
                return {}

        # If only one supplier is available
        if len(suppliers) == 1:
            best_supplier = suppliers[0]
            savings = 0.0
            comparison = [{"id": s.id, "name": s.name, "price": s.price, "delivery_days": s.delivery_days, "rating": s.rating} for s in suppliers]
        else:
            # Score each supplier using mathematical evaluation in Python
            # Normalized score based on price, delivery time, and rating
            max_price = max(s.price for s in suppliers)
            min_price = min(s.price for s in suppliers)
            max_delivery = max(s.delivery_days for s in suppliers)
            min_delivery = min(s.delivery_days for s in suppliers)
            
            scored_suppliers = []
            avg_price = sum(s.price for s in suppliers) / len(suppliers)
            
            for s in suppliers:
                # Price score (lower price = higher score)
                price_score = 1.0
                if max_price > min_price:
                    price_score = 1.0 - ((s.price - min_price) / (max_price - min_price))
                
                # Delivery score (lower days = higher score)
                delivery_score = 1.0
                if max_delivery > min_delivery:
                    delivery_score = 1.0 - ((s.delivery_days - min_delivery) / (max_delivery - min_delivery))
                
                # Rating score (higher rating = higher score)
                rating_score = s.rating / 5.0
                
                # Weighted score
                total_score = (price_score * 0.45) + (delivery_score * 0.25) + (rating_score * 0.3)
                scored_suppliers.append((s, total_score))
            
            # Sort by score descending
            scored_suppliers.sort(key=lambda x: x[1], reverse=True)
            best_supplier, best_score = scored_suppliers[0]
            
            # Calculate savings: (Average Price - Best Price) * Quantity
            savings = round(max(0.0, (avg_price - best_supplier.price) * quantity), 2)
            
            comparison = []
            for s in suppliers:
                comparison.append({
                    "id": s.id,
                    "name": s.name,
                    "price": s.price,
                    "delivery_days": s.delivery_days,
                    "rating": s.rating,
                    "is_recommended": s.id == best_supplier.id
                })

        recommendation = {
            "supplier_id": best_supplier.id,
            "supplier_name": best_supplier.name,
            "unit_price": best_supplier.price,
            "delivery_days": best_supplier.delivery_days,
            "rating": best_supplier.rating,
            "total_price": round(best_supplier.price * quantity, 2),
            "savings": savings,
            "comparison": comparison
        }

        self.log_decision(
            db,
            "Supplier Recommending",
            {
                "material": material_name,
                "chosen_supplier": best_supplier.name,
                "savings": savings,
                "total_price": recommendation["total_price"]
            }
        )
        return recommendation
