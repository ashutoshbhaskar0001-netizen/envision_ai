import time
from sqlalchemy.orm import Session
from app.agents.base import BaseAgent

# Global notification memory queue for quick API polling
notifications_queue = []

class NotificationAgent(BaseAgent):
    def __init__(self):
        super().__init__("Notification Agent")

    def emit(self, db: Session, level: str, category: str, message: str) -> dict:
        """Publishes a notification alert to the dashboard stream and records it in database logs."""
        # Clean categories: LOW_STOCK, BUDGET_WARNING, SUPPLIER_CHANGE, PURCHASE_APPROVED, PURCHASE_REJECTED, AI_RECOMMENDATION
        self.log_message(db, level, f"[{category}] {message}")
        
        notification = {
            "id": int(time.time() * 1000),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "level": level.upper(),
            "category": category.upper(),
            "message": message,
            "read": False
        }
        
        notifications_queue.insert(0, notification)
        # Cap queue at 100 items to prevent bloat
        if len(notifications_queue) > 100:
            notifications_queue.pop()
            
        return notification

    def get_notifications(self) -> list:
        """Returns all current notifications in the dashboard stream."""
        return notifications_queue

    def clear_notifications(self):
        """Clears the current notification queue."""
        global notifications_queue
        notifications_queue = []
