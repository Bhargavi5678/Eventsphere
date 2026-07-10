import datetime
import re

def generate_ics_content(event_title: str, event_desc: str, event_date_str: str, location: str) -> str:
    """
    Generates iCalendar format text from event info.
    Attempts to parse date string (e.g. YYYY-MM-DD or ISO strings).
    """
    # Default to today/tomorrow if parsing fails
    start_dt = datetime.datetime.now() + datetime.timedelta(days=1)
    
    # Try parsing date: YYYY-MM-DD
    match = re.search(r"(\d{4})[-/](\d{2})[-/](\d{2})", event_date_str)
    if match:
        year, month, day = map(int, match.groups())
        try:
            start_dt = datetime.datetime(year, month, day, 18, 0, 0) # default to 6:00 PM
        except ValueError:
            pass
            
    end_dt = start_dt + datetime.timedelta(hours=4) # default 4 hours duration
    
    dtstamp = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    dtstart = start_dt.strftime("%Y%m%dT%H%M%SZ")
    dtend = end_dt.strftime("%Y%m%dT%H%M%SZ")
    
    clean_title = event_title.replace("\n", " ").replace(",", "\\,")
    clean_desc = (event_desc or "").replace("\n", "\\n").replace(",", "\\,")
    clean_loc = location.replace("\n", " ").replace(",", "\\,")
    
    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//EventSphere//Event Planner//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:es-{dtstamp}@eventsphere.com",
        f"DTSTAMP:{dtstamp}",
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{clean_title}",
        f"DESCRIPTION:{clean_desc}",
        f"LOCATION:{clean_loc}",
        "END:VEVENT",
        "END:VCALENDAR"
    ]
    
    return "\r\n".join(ics_lines)
