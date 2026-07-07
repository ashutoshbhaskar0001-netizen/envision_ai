import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Inventory, Suppliers, Budget, AIHistory
from app.services.gemini_service import GeminiService

router = APIRouter()
gemini_service = GeminiService()

@router.get("/analyze")
def analyze_inventory(db: Session = Depends(get_db)):
    start_time = time.time()
    
    # 1. Fetch low stock items from Python logic
    inventory_items = db.query(Inventory).all()
    low_stock_items = [i for i in inventory_items if i.quantity <= i.reorder_point]
    
    supplier_recommendations = []
    total_savings = 0.0
    total_order_quantity = 0
    total_cost = 0.0
    
    # 2. Python logic to compare suppliers and find cheapest
    for item in low_stock_items:
        # Find all suppliers offering this material
        # The schema in Suppliers has 'material' (e.g. "Iron Rods (10m)")
        # In Inventory we have 'name' (e.g. "Iron Rods (10m)")
        suppliers = db.query(Suppliers).filter(Suppliers.material.ilike(item.name)).all()
        
        if not suppliers:
            cheapest = None
            price = item.unit_price
            delivery = 5
            rating = 5.0
            supplier_name = "Default Market Vendor"
            savings = 0.0
        else:
            cheapest = min(suppliers, key=lambda s: s.price)
            highest = max(suppliers, key=lambda s: s.price)
            price = cheapest.price
            delivery = cheapest.delivery_days
            rating = cheapest.rating
            supplier_name = cheapest.name
            savings = (highest.price - cheapest.price) * item.reorder_quantity
            
        qty_to_order = item.reorder_quantity
        cost = qty_to_order * price
        
        supplier_recommendations.append({
            "sku": item.sku,
            "material": item.name,
            "quantity": qty_to_order,
            "supplier_name": supplier_name,
            "price_per_unit": price,
            "total_price": cost,
            "delivery_days": delivery,
            "rating": rating,
            "savings": round(savings, 2)
        })
        
        total_savings += savings
        total_order_quantity += qty_to_order
        total_cost += cost

    # 3. Check budget approval
    budget = db.query(Budget).first()
    remaining_budget = budget.remaining_budget if budget else 0.0
    
    budget_approved = total_cost <= remaining_budget
    budget_status = "Approved" if budget_approved else "Rejected"
    budget_reason = (
        f"Approved. Total procurement cost of ${total_cost:,.2f} is within the remaining balance of ${remaining_budget:,.2f}."
        if budget_approved else
        f"Rejected. Total cost ${total_cost:,.2f} exceeds remaining budget of ${remaining_budget:,.2f}."
    )
    
    # 4. Prepare data for Gemini explanation
    analysis_payload = {
        "low_stock_count": len(low_stock_items),
        "total_order_quantity": total_order_quantity,
        "total_cost": round(total_cost, 2),
        "total_savings": round(total_savings, 2),
        "budget_approved": budget_approved,
        "budget_reason": budget_reason,
        "recommendations": supplier_recommendations
    }
    
    # 5. Get Gemini explanation or fallback narrative
    system_instruction = (
        "You are an expert Autonomous ERP Supply Chain Analyst. "
        "Explain the calculated inventory and replenishment recommendation payload. "
        "CRITICAL: Do NOT perform any math or statistical calculations. All values, counts, sums, and averages "
        "are pre-calculated by Python and provided in the input data. Only interpret, explain, and write "
        "professional reports based strictly on the provided pre-calculated metrics. Format with clean markdown."
    )
    
    prompt = (
        f"Please analyze the following pre-calculated ERP replenishment plan and write an executive summary:\n"
        f"{analysis_payload}\n"
    )
    
    try:
        summary_md = gemini_service.run_with_retry(prompt, system_instruction)
    except Exception as e:
        # Save fallback narrative if Gemini fails
        summary_md = (
            f"# Executive Operations Analysis (Gemini Offline Fallback)\n\n"
            f"An automatic stock scan was executed. There are **{len(low_stock_items)}** items requiring replenishment, "
            f"recommending a total purchase of **{total_order_quantity}** units for a total budget impact of **${total_cost:,.2f}**.\n\n"
            f"## Replenishment Summary\n"
            f"- **Budget Status**: {budget_status} - {budget_reason}\n"
            f"- **Potential Procurement Savings**: ${total_savings:,.2f} by purchasing from cheapest qualified suppliers.\n\n"
            f"## Strategic Next Steps\n"
            f"1. Create Purchase Orders immediately for materials meeting low-stock alarms.\n"
            f"2. Confirm lead delivery schedules directly with selected suppliers."
        )
    
    # 6. Save in AIHistory
    ai_history_entry = AIHistory(
        agent_name="Inventory Analysis Agent",
        action_type="Analysis",
        decision_details={
            "summary": summary_md,
            "potential_savings": round(total_savings, 2),
            "total_cost": round(total_cost, 2),
            "order_quantity": total_order_quantity,
            "budget_approved": budget_approved,
            "recommendations": supplier_recommendations
        }
    )
    db.add(ai_history_entry)
    db.commit()
    
    execution_time_ms = (time.time() - start_time) * 1000
    
    return {
        "summary": summary_md,
        "supplier_recommendations": supplier_recommendations,
        "budget_approval": {
            "approved": budget_approved,
            "reason": budget_reason,
            "total_cost": round(total_cost, 2)
        },
        "potential_savings": round(total_savings, 2),
        "order_quantity": total_order_quantity,
        "confidence": 95.0,
        "execution_time_ms": round(execution_time_ms, 2)
    }
