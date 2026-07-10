import datetime
from typing import List, Dict, Any

# Simple in-memory notification log to mock active dispatch tracking
notification_logs: List[Dict[str, Any]] = []

def send_notification(event_id: int, recipient_name: str, recipient_address: str, channel: str, template_type: str, body: str):
    log_entry = {
        "id": len(notification_logs) + 1,
        "event_id": event_id,
        "recipient_name": recipient_name,
        "recipient_address": recipient_address,
        "channel": channel,          # Email, SMS, Push
        "template_type": template_type,
        "body": body,
        "status": "Sent",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    notification_logs.append(log_entry)
    return log_entry

def get_logs(event_id: int) -> List[Dict[str, Any]]:
    return [log for log in notification_logs if log["event_id"] == event_id]
