from sqlalchemy.orm import Session
from app.agents.base import BaseAgent
from app.models.models import Budget

class BudgetAgent(BaseAgent):
    def __init__(self):
        super().__init__("Budget Agent")

    def check_affordability(self, db: Session, cost: float, commit: bool = False) -> dict:
        """Checks if the budget is sufficient for the purchase, returning status and breakdown."""
        self.log_message(db, "INFO", f"Checking budget approval for purchase cost: ${cost:,.2f}")
        
        # Fetch the budget record (assume ID=1 represents the active company budget sheet)
        budget = db.query(Budget).first()
        if not budget:
            self.log_message(db, "ERROR", "No budget record found. Creating a default budget sheet.")
            budget = Budget(
                monthly_budget=100000.0,
                salaries=20000.0,
                rent=5000.0,
                utilities=2000.0,
                operational_expenses=10000.0,
                remaining_budget=63000.0
            )
            db.add(budget)
            db.commit()
            db.refresh(budget)

        remaining = budget.remaining_budget
        is_approved = cost <= remaining

        if is_approved:
            self.log_message(
                db, 
                "INFO", 
                f"Budget approved. Remaining budget: ${remaining:,.2f}, Purchase Cost: ${cost:,.2f}"
            )
            if commit:
                budget.remaining_budget = round(remaining - cost, 2)
                db.commit()
                self.log_message(
                    db, 
                    "INFO", 
                    f"Committed budget deduction. New remaining budget: ${budget.remaining_budget:,.2f}"
                )
        else:
            self.log_message(
                db, 
                "WARNING", 
                f"Budget rejected! Insufficient funds. Remaining budget: ${remaining:,.2f}, Purchase Cost: ${cost:,.2f}"
            )

        budget_state = {
            "is_approved": is_approved,
            "monthly_budget": budget.monthly_budget,
            "fixed_expenses": budget.salaries + budget.rent + budget.utilities + budget.operational_expenses,
            "salaries": budget.salaries,
            "rent": budget.rent,
            "utilities": budget.utilities,
            "operational_expenses": budget.operational_expenses,
            "remaining_budget_before": remaining,
            "remaining_budget_after": round(remaining - cost, 2) if is_approved else remaining,
            "purchase_cost": cost
        }

        self.log_decision(
            db,
            "Budget Assessment",
            {
                "cost": cost,
                "approved": is_approved,
                "remaining_budget": budget_state["remaining_budget_after"]
            }
        )
        return budget_state
