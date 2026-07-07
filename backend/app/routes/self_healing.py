from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ErrorLogs
from app.schemas import ErrorLogResponse
from app.agents.self_healing_agent import SelfHealingAgent

router = APIRouter()
self_healing_agent = SelfHealingAgent()

# A test function designed to fail when b is 0
def divide_numbers(a, b):
    # This will trigger ZeroDivisionError: division by zero
    return a / b

@router.get("/logs", response_model=list[ErrorLogResponse])
def list_error_logs(db: Session = Depends(get_db)):
    return db.query(ErrorLogs).order_by(ErrorLogs.timestamp.desc()).all()

@router.post("/trigger-error")
def trigger_synthetic_error(db: Session = Depends(get_db)):
    """Triggers a synthetic zero-division exception, intercepting it with the Self-Healing Agent."""
    try:
        # Run divide_numbers(10, 0) through the Self-Healing agent
        result = self_healing_agent.run_with_healing(db, divide_numbers, 10, 0)
        
        # Query the latest log to return alongside the result
        latest_log = db.query(ErrorLogs).order_by(ErrorLogs.timestamp.desc()).first()
        
        return {
            "status": "success",
            "message": "Self-healing executed successfully.",
            "execution_result": result,
            "error_details": {
                "error_message": latest_log.error_message if latest_log else None,
                "resolved": latest_log.resolved if latest_log else False,
                "resolution_details": latest_log.resolution_details if latest_log else None
            }
        }
    except Exception as e:
        # If the self healing fails or raises the original error
        latest_log = db.query(ErrorLogs).order_by(ErrorLogs.timestamp.desc()).first()
        return {
            "status": "failed",
            "message": f"Self-healing was triggered but manual intervention was required: {e}",
            "error_details": {
                "error_message": latest_log.error_message if latest_log else str(e),
                "resolved": latest_log.resolved if latest_log else False,
                "resolution_details": latest_log.resolution_details if latest_log else None
            }
        }
