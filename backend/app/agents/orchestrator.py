from datetime import datetime
from sqlalchemy.orm import Session
from app.agents.base import BaseAgent
from app.agents.inventory_agent import InventoryAgent
from app.agents.supplier_agent import SupplierAgent
from app.agents.budget_agent import BudgetAgent
from app.agents.purchasing_agent import PurchasingAgent
from app.agents.reporting_agent import ReportingAgent
from app.agents.notification_agent import NotificationAgent
from app.agents.monitoring_agent import MonitoringAgent
from app.agents.self_healing_agent import SelfHealingAgent
from app.models.models import PurchaseOrders, Suppliers

class Orchestrator(BaseAgent):
    def __init__(self):
        super().__init__("Orchestrator Agent")
        self.inventory_agent = InventoryAgent()
        self.supplier_agent = SupplierAgent()
        self.budget_agent = BudgetAgent()
        self.purchasing_agent = PurchasingAgent()
        self.reporting_agent = ReportingAgent()
        self.notification_agent = NotificationAgent()
        self.monitoring_agent = MonitoringAgent()
        self.self_healing_agent = SelfHealingAgent()

    def run_auto_inventory_replenish(self, db: Session) -> list:
        """Executes the complete inventory check and automatic procurement workflow."""
        self.log_message(db, "INFO", "Starting automated procurement cycle...")
        
        # 1. Scan for shortages
        shortages, overstocks = self.inventory_agent.monitor_inventory(db)
        replenishments_processed = []

        for item in shortages:
            # Check if there is already a Pending or Approved purchase order for this SKU in the last 24h
            existing_po = db.query(PurchaseOrders).filter(
                PurchaseOrders.sku == item.sku,
                PurchaseOrders.status.in_(["Pending", "Approved"])
            ).first()
            
            if existing_po:
                self.log_message(db, "INFO", f"Purchase order for SKU '{item.sku}' already exists. Skipping duplication.")
                continue
            
            # Start workflow
            self.log_message(db, "INFO", f"Triggering replenishment workflow for SKU '{item.sku}' ({item.name})")
            
            # Notify shortage
            self.notification_agent.emit(
                db, 
                "WARNING", 
                "LOW_STOCK", 
                f"Shortage detected: SKU '{item.sku}' ({item.name}) has {item.quantity} units (Reorder Point: {item.reorder_point})."
            )
            
            # 2. Query Supplier Recommendation
            recommendation = self.supplier_agent.recommend_supplier(db, item.name, item.reorder_quantity)
            if not recommendation:
                self.log_message(db, "ERROR", f"No supplier found for material '{item.name}'. Replenishment aborted.")
                continue
                
            self.notification_agent.emit(
                db, 
                "INFO", 
                "AI_RECOMMENDATION", 
                f"Supplier Intelligence recommends '{recommendation['supplier_name']}' for '{item.name}'. Est Savings: ${recommendation['savings']:,.2f}."
            )
            
            # 3. Budget Check & Deduction
            total_cost = recommendation["total_price"]
            budget_assessment = self.budget_agent.check_affordability(db, total_cost, commit=False)
            
            if budget_assessment["is_approved"]:
                self.notification_agent.emit(
                    db, 
                    "INFO", 
                    "PURCHASE_APPROVED", 
                    f"Budget approved! Remaining budget ${budget_assessment['remaining_budget_before']:,.2f} is sufficient to cover ${total_cost:,.2f}."
                )
                
                # Commit budget deduction
                self.budget_agent.check_affordability(db, total_cost, commit=True)
                
                # 4. Generate Purchase Order
                po_record = self.purchasing_agent.create_purchase_order(
                    db,
                    sku=item.sku,
                    quantity=item.reorder_quantity,
                    supplier_id=recommendation["supplier_id"],
                    total_price=total_cost,
                    is_budget_approved=True
                )
                
                self.notification_agent.emit(
                    db, 
                    "INFO", 
                    "PURCHASE_APPROVED", 
                    f"Purchase Order #{po_record['po_id']} successfully generated and stock updated."
                )
                
                replenishments_processed.append(po_record)
            else:
                self.notification_agent.emit(
                    db, 
                    "ERROR", 
                    "PURCHASE_REJECTED", 
                    f"Procurement failed! Budget insufficient for ${total_cost:,.2f}. Remaining balance: ${budget_assessment['remaining_budget_before']:,.2f}."
                )
                
                # Create rejected purchase order
                po_record = self.purchasing_agent.create_purchase_order(
                    db,
                    sku=item.sku,
                    quantity=item.reorder_quantity,
                    supplier_id=recommendation["supplier_id"],
                    total_price=total_cost,
                    is_budget_approved=False
                )
                replenishments_processed.append(po_record)

        self.log_message(db, "INFO", f"Procurement cycle completed. Replenishments processed: {len(replenishments_processed)}.")
        return replenishments_processed

    def run_purchase_simulation(self, db: Session, material: str, quantity: int, supplier_id: int, unit_price: float) -> dict:
        """Runs a simulated step-by-step multi-agent purchasing workflow."""
        steps = []
        now = datetime.utcnow().strftime("%H:%M:%S")

        # Step 1: Inventory Agent Stock Evaluation
        steps.append({
            "agent_name": "Inventory Agent",
            "action": "Evaluating Material shortage",
            "details": f"Checked stock requirements for '{material}'. Requested reorder quantity: {quantity} units.",
            "timestamp": now
        })

        # Step 2: Supplier Agent Analysis
        selected_supplier = db.query(Suppliers).filter(Suppliers.id == supplier_id).first()
        supplier_name = selected_supplier.name if selected_supplier else "Unknown Supplier"
        
        # Calculate comparison and savings
        suppliers = db.query(Suppliers).filter(Suppliers.material.ilike(material)).all()
        avg_price = sum(s.price for s in suppliers) / len(suppliers) if suppliers else unit_price
        savings = round(max(0.0, (avg_price - unit_price) * quantity), 2)
        
        steps.append({
            "agent_name": "Supplier Intelligence Agent",
            "action": "Comparing Supplier options",
            "details": f"Selected supplier: '{supplier_name}' @ ${unit_price}/unit. Savings relative to average market price: ${savings:,.2f}.",
            "timestamp": now
        })

        # Step 3: Budget Agent Auditing
        total_price = round(unit_price * quantity, 2)
        budget_assessment = self.budget_agent.check_affordability(db, total_price, commit=False)
        is_approved = budget_assessment["is_approved"]
        
        steps.append({
            "agent_name": "Budget Agent",
            "action": "Performing Financial audit",
            "details": f"Audited account. Total cost: ${total_price:,.2f}. Remaining balance: ${budget_assessment['remaining_budget_before']:,.2f}. Status: {'APPROVED' if is_approved else 'REJECTED'}.",
            "timestamp": now
        })

        # Step 4: Purchase Agent Execution (Simulated)
        steps.append({
            "agent_name": "Purchasing Agent",
            "action": "Drafting Purchase Order",
            "details": f"PO draft status: {'Ready to release' if is_approved else 'Cancelled due to budget constraints'}.",
            "timestamp": now
        })

        # Log simulated decisions
        self.log_decision(
            db,
            "Simulation Run",
            {
                "material": material,
                "quantity": quantity,
                "supplier": supplier_name,
                "price": total_price,
                "approved": is_approved
            }
        )

        return {
            "success": is_approved,
            "decision": "Approved" if is_approved else "Rejected",
            "steps": steps,
            "savings_calculated": savings,
            "budget_impact": budget_assessment,
            "recommendation": f"Procurement is advised via '{supplier_name}' offering a savings of ${savings:,.2f}."
        }
