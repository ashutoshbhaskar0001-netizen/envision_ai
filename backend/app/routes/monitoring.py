from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import AgentLogs, SystemHealth
from app.schemas import AgentLogResponse, SystemHealthResponse
from app.agents.monitoring_agent import MonitoringAgent

router = APIRouter()
monitoring_agent = MonitoringAgent()

@router.get("/health", response_model=SystemHealthResponse)
def get_system_health(request: Request, db: Session = Depends(get_db)):
    # Retrieve duration_ms from request state if calculated by middleware
    duration = getattr(request.state, "duration_ms", 12.0)
    health = monitoring_agent.measure_system_health(db, last_api_time_ms=duration)
    # Re-query latest system health record to return it as a complete database model representation
    db_health = db.query(SystemHealth).order_by(SystemHealth.timestamp.desc()).first()
    return db_health

@router.get("/agent-logs", response_model=list[AgentLogResponse])
def get_agent_logs(db: Session = Depends(get_db)):
    return db.query(AgentLogs).order_by(AgentLogs.timestamp.desc()).limit(100).all()
