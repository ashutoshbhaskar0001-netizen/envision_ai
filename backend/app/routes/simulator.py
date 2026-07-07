from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import SimulatorRequest, SimulatorResponse
from app.agents.orchestrator import Orchestrator

router = APIRouter()
orchestrator = Orchestrator()

@router.post("/run", response_model=SimulatorResponse)
def run_simulation(req: SimulatorRequest, db: Session = Depends(get_db)):
    try:
        # Execute the simulated purchase workflow
        result = orchestrator.run_purchase_simulation(
            db, 
            material=req.material, 
            quantity=req.quantity, 
            supplier_id=req.supplier_id, 
            unit_price=req.price
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {e}")
