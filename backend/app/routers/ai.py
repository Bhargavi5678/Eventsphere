from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app import crud, database, schemas, models

router = APIRouter(prefix="/ai", tags=["AI Copilot Services"])

# --- AI EVENT PLANNER ---
@router.post("/plan")
def generate_ai_event_plan(payload: schemas.AIPlanRequest):
    """
    Simulates advanced AI planning based on theme, budget, guest count, and event type.
    """
    theme = payload.theme
    budget = payload.budget
    guest_count = payload.guest_count
    event_type = payload.event_type
    
    # 1. Generate Itinerary
    itinerary = [
        {"time": "09:00 AM", "activity": "Welcome Desk & Guest Registration Open", "details": "Handing out digital badges and welcome packets."},
        {"time": "10:00 AM", "activity": f"Opening Keynote: The Future of {theme.title()}", "details": f"Setting the theme and goals for this {event_type}."},
        {"time": "12:00 PM", "activity": "Networking Luncheon & Vendor Showcase", "details": f"Buffet serving tailored cuisines. Venue: Exhibition Hall."},
        {"time": "02:00 PM", "activity": "Interactive Panel Discussion & Q&A session", "details": "Speakers and audience voting via the live dashboard."},
        {"time": "04:30 PM", "activity": "Closing Remarks & Certificate Distribution", "details": "Recognizing speakers, sponsors, and distributing certificates."},
        {"time": "06:00 PM", "activity": "Evening Celebration & Dinner Party", "details": f"Theme-aligned lighting and DJ set. Budget allocated: ${round(budget * 0.15)}."}
    ]
    
    # 2. Generate Checklists
    checklist = [
        {"task": "Design custom landing page and publish RSVP site", "category": "Marketing", "priority": "High"},
        {"task": f"Book a theme-matching Venue: {theme.title()} style", "category": "Venue", "priority": "High"},
        {"task": f"Send invitations & track RSVPs for {guest_count} guests", "category": "Invitations", "priority": "Medium"},
        {"task": "Configure pricing tiers and launch ticket sales", "category": "Ticketing", "priority": "High"},
        {"task": "Approve final catering menu & dietary preferences", "category": "Catering", "priority": "Medium"},
        {"task": "Schedule event staff shifts and security protocols", "category": "Staff", "priority": "Low"},
        {"task": "Prepare digital badges and download check-in codes", "category": "Logistics", "priority": "Medium"}
    ]
    
    # 3. Vendor Category Recommendations
    vendors = [
        {"category": "Venue", "recommendation": "Grand Ballroom Plaza", "estimated_cost": round(budget * 0.35), "justification": "Offers ideal space and crystal layout to match premium styling."},
        {"category": "Catering", "recommendation": "Epicurean Delights Catering", "estimated_cost": round(budget * 0.28), "justification": "Exquisite dining choices fitting standard and VIP preferences."},
        {"category": "Audio/Visual", "recommendation": "Sonic Pulse Audio Visual", "estimated_cost": round(budget * 0.14), "justification": "Excellent acoustics and LED screen panels for keynotes."},
        {"category": "Decorations", "recommendation": "Flora & Bloom Decorators", "estimated_cost": round(budget * 0.10), "justification": "Specialize in the specified theme aesthetic and floristry."}
    ]
    
    return {
        "status": "Success",
        "event_type": event_type,
        "theme": theme,
        "guest_count": guest_count,
        "suggested_itinerary": itinerary,
        "suggested_checklist": checklist,
        "recommended_vendors": vendors,
        "ai_note": f"This plan was optimized for a ${budget:,} budget. It focuses on maximizing visitor engagement while retaining a {theme} atmosphere."
    }


# --- AI CHAT ASSISTANT (DATABASE-INTEGRATED) ---
@router.post("/chat", response_model=schemas.AIChatResponse)
def chat_assistant(payload: schemas.AIChatRequest, db: Session = Depends(database.get_db)):
    """
    Context-aware AI Chat Assistant reading from active database records for the event.
    """
    event_id = payload.event_id
    message = payload.message.lower()
    
    event = crud.get_event(db, event_id=event_id)
    if not event:
        return schemas.AIChatResponse(reply="I couldn't find the event you are referring to. Please verify the active event selection.")
        
    # Read active event statistics
    guests = crud.get_guests(db, event_id=event_id)
    tickets = crud.get_tickets(db, event_id=event_id)
    budget_items = crud.get_budget_items(db, event_id=event_id)
    sponsors = crud.get_sponsors(db, event_id=event_id)
    staff = crud.get_staff_members(db, event_id=event_id)
    
    total_guests = len(guests)
    attending_guests = sum(1 for g in guests if g.status.lower() == "attending")
    pending_guests = sum(1 for g in guests if g.status.lower() == "pending")
    declined_guests = sum(1 for g in guests if g.status.lower() == "declined")
    
    checked_in_tickets = sum(1 for t in tickets if t.checked_in)
    
    total_budget_allocated = sum(item.allocated_amount for item in budget_items)
    total_budget_spent = sum(item.actual_amount for item in budget_items)
    
    total_sponsors_funds = sum(s.amount_funded for s in sponsors)
    
    # NLP / Heuristic keywords parsing
    if "guest" in message or "rsvp" in message or "invite" in message:
        reply = (
            f"Regarding guests: There are currently **{total_guests} guests** invited to *{event.title}*.\n"
            f"- **Attending**: {attending_guests}\n"
            f"- **Pending**: {pending_guests}\n"
            f"- **Declined**: {declined_guests}\n"
            f"The RSVP conversion rate is currently **{round((attending_guests/total_guests)*100) if total_guests > 0 else 0}%**."
        )
    elif "budget" in message or "cost" in message or "expense" in message or "spent" in message:
        rem_budget = total_budget_allocated - total_budget_spent
        reply = (
            f"Here is the budget summary for *{event.title}*:\n"
            f"- **Allocated Budget**: ${total_budget_allocated:,.2f}\n"
            f"- **Actual Expenses**: ${total_budget_spent:,.2f}\n"
            f"- **Remaining Balance**: ${rem_budget:,.2f}\n"
            f"Your spending is at **{round((total_budget_spent/total_budget_allocated)*100) if total_budget_allocated > 0 else 0}%** of allocation."
        )
    elif "ticket" in message or "sale" in message or "check" in message:
        reply = (
            f"Ticketing statistics for *{event.title}*:\n"
            f"- **Total Registrations**: {len(tickets)}\n"
            f"- **Checked In**: {checked_in_tickets} ({round((checked_in_tickets/len(tickets))*100) if len(tickets) > 0 else 0}%)\n"
            f"Scan a guest ticket's QR code in the check-in panel to update these figures in real-time."
        )
    elif "sponsor" in message:
        reply = (
            f"Sponsorship status for *{event.title}*:\n"
            f"- **Total Sponsors**: {len(sponsors)}\n"
            f"- **Funds Raised**: ${total_sponsors_funds:,.2f}\n"
            f"You can review sponsor logos and levels in the Sponsors panel."
        )
    elif "staff" in message or "shift" in message:
        reply = (
            f"Staff overview for *{event.title}*:\n"
            f"- **Total Staff Members**: {len(staff)}\n"
            f"Roles assigned: " + ", ".join(list(set([s.role for s in staff]))) if staff else "No staff assigned yet."
        )
    elif "hello" in message or "hi " in message or "hey" in message:
        reply = (
            f"Hello! I am your EventSphere AI Chat Assistant.\n"
            f"I have live access to the database for **{event.title}**.\n"
            f"Ask me about: guests, RSVP stats, tickets, check-in progress, budgets, or staff shifts!"
        )
    else:
        reply = (
            f"I'm here to assist with *{event.title}*. I detected your inquiry. "
            f"Currently, we have {total_guests} guests ({attending_guests} attending), "
            f"and budget spent is ${total_budget_spent:,.2f} out of ${total_budget_allocated:,.2f}.\n\n"
            f"Please let me know if you need specific breakdowns of guests, budgets, tickets, or schedules!"
        )
        
    return schemas.AIChatResponse(reply=reply)
