from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Budget
from app.schemas import BudgetResponse, BudgetBase

router = APIRouter()

@router.get("", response_model=BudgetResponse)
def get_budget(db: Session = Depends(get_db)):
    budget = db.query(Budget).first()
    if not budget:
        # Create a default budget sheet
        budget = Budget(
            monthly_budget=100000.0,
            salaries=22000.0,
            rent=6000.0,
            utilities=3000.0,
            operational_expenses=14000.0,
            remaining_budget=55000.0
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget

@router.put("", response_model=BudgetResponse)
def update_budget(budget_data: BudgetBase, db: Session = Depends(get_db)):
    budget = db.query(Budget).first()
    if not budget:
        budget = Budget()
        db.add(budget)
        
    budget.monthly_budget = budget_data.monthly_budget
    budget.salaries = budget_data.salaries
    budget.rent = budget_data.rent
    budget.utilities = budget_data.utilities
    budget.operational_expenses = budget_data.operational_expenses
    budget.remaining_budget = budget_data.remaining_budget
    
    db.commit()
    db.refresh(budget)
    return budget
