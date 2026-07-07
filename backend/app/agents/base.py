import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import AgentLogs, AIHistory

class BaseAgent:
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"erp_agent.{name.lower().replace(' ', '_')}")

    def log_message(self, db: Session, level: str, message: str):
        """Logs an agent message into the AgentLogs database table."""
        self.logger.log(getattr(logging, level.upper(), logging.INFO), message)
        try:
            log_entry = AgentLogs(
                agent_name=self.name,
                log_level=level.upper(),
                message=message,
                timestamp=datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to log message to database: {e}")

    def log_decision(self, db: Session, action_type: str, details: dict):
        """Logs a major AI business decision to the AIHistory table."""
        self.logger.info(f"DECISION [{action_type}]: {details}")
        try:
            decision = AIHistory(
                agent_name=self.name,
                action_type=action_type,
                decision_details=details,
                timestamp=datetime.utcnow()
            )
            db.add(decision)
            db.commit()
        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to log decision to database: {e}")
