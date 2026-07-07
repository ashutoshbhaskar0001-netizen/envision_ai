from fastapi import APIRouter
from app.agents.notification_agent import NotificationAgent

router = APIRouter()
notification_agent = NotificationAgent()

@router.get("")
def list_notifications():
    return notification_agent.get_notifications()

@router.post("/clear")
def clear_notifications():
    notification_agent.clear_notifications()
    return {"status": "success", "message": "Cleared notifications."}
