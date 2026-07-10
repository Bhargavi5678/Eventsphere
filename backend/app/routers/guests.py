from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, database
from app.services.mailer import send_notification, get_logs
from app.services.pdf_badge import generate_svg_badge

router = APIRouter(tags=["Guests, Tickets & Campaigns"])

# --- GUESTS ENDPOINTS ---
@router.get("/events/{event_id}/guests", response_model=List[schemas.GuestResponse])
def read_event_guests(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_guests(db, event_id=event_id)

@router.post("/events/{event_id}/guests", response_model=schemas.GuestResponse)
def add_guest_to_event(event_id: int, guest: schemas.GuestCreate, db: Session = Depends(database.get_db)):
    # Verify event exists
    db_event = crud.get_event(db, event_id=event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db_guest = crud.create_guest(db, guest=guest, event_id=event_id)
    
    # Auto-generate a general ticket for this guest when they are added
    ticket_payload = schemas.TicketCreate(guest_id=db_guest.id, tier="General", price=0.0)
    crud.create_ticket(db, ticket=ticket_payload, event_id=event_id)
    
    # Trigger automation simulator: welcome guest
    send_notification(
        event_id=event_id,
        recipient_name=db_guest.name,
        recipient_address=db_guest.email,
        channel="Email",
        template_type="Welcome Invitation",
        body=f"Hi {db_guest.name}, you have been added to the guest list for {db_event.title}. Please RSVP as soon as possible!"
    )
    
    return db_guest

@router.put("/guests/{guest_id}", response_model=schemas.GuestResponse)
def update_guest_profile(guest_id: int, guest: schemas.GuestUpdate, db: Session = Depends(database.get_db)):
    db_guest = crud.update_guest(db, guest_id=guest_id, guest_update=guest)
    if not db_guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return db_guest

@router.delete("/guests/{guest_id}")
def remove_guest(guest_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_guest(db, guest_id=guest_id)
    if not success:
        raise HTTPException(status_code=404, detail="Guest not found")
    return {"status": "Guest removed successfully"}

# --- TICKETS ENDPOINTS ---
@router.get("/events/{event_id}/tickets", response_model=List[schemas.TicketResponse])
def read_event_tickets(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_tickets(db, event_id=event_id)

@router.post("/events/{event_id}/tickets", response_model=schemas.TicketResponse)
def issue_custom_ticket(event_id: int, ticket: schemas.TicketCreate, db: Session = Depends(database.get_db)):
    # Verify guest exists
    guest = crud.get_guest(db, guest_id=ticket.guest_id)
    if not guest or guest.event_id != event_id:
        raise HTTPException(status_code=404, detail="Guest not found in this event")
        
    db_ticket = crud.create_ticket(db, ticket=ticket, event_id=event_id)
    return db_ticket

# --- QR CHECK-IN ---
@router.post("/tickets/check-in", response_model=schemas.TicketResponse)
def check_in_by_code(payload: dict, db: Session = Depends(database.get_db)):
    ticket_code = payload.get("ticket_code")
    if not ticket_code:
        raise HTTPException(status_code=400, detail="ticket_code is required")
        
    db_ticket = crud.check_in_ticket(db, ticket_code=ticket_code)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Invalid ticket code")
    
    # Notify simulator
    guest = crud.get_guest(db, db_ticket.guest_id)
    event = crud.get_event(db, db_ticket.event_id)
    if guest and event:
        send_notification(
            event_id=db_ticket.event_id,
            recipient_name=guest.name,
            recipient_address=guest.phone or guest.email,
            channel="SMS" if guest.phone else "Email",
            template_type="Check-In Confirmation",
            body=f"Welcome {guest.name}! You have successfully checked in to {event.title}."
        )
        
    return db_ticket

# --- DIGITAL BADGE GENERATION ---
@router.get("/guests/{guest_id}/badge")
def get_guest_badge(guest_id: int, db: Session = Depends(database.get_db)):
    guest = crud.get_guest(db, guest_id=guest_id)
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
        
    event = crud.get_event(db, event_id=guest.event_id)
    event_title = event.title if event else "EventSphere Event"
    
    # Get associated ticket code
    ticket = db.query(models.Ticket).filter(models.Ticket.guest_id == guest_id).first()
    ticket_code = ticket.ticket_code if ticket else f"ES-MOCK-{guest_id}"
    
    svg_content = generate_svg_badge(
        guest_name=guest.name,
        guest_role=guest.role,
        event_title=event_title,
        ticket_code=ticket_code
    )
    
    # Update badge printed status
    guest.badge_printed = True
    db.commit()
    
    return Response(content=svg_content, media_type="image/svg+xml")

# --- EMAIL / SMS / PUSH CAMPAIGN SCHEDULER ---
@router.post("/events/{event_id}/notifications/campaign")
def trigger_notification_campaign(event_id: int, campaign: schemas.NotificationCampaignRequest, db: Session = Depends(database.get_db)):
    event = crud.get_event(db, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    guests = crud.get_guests(db, event_id=event_id)
    
    # Filter guests based on role
    target_guests = guests
    if campaign.recipient_role != "All":
        target_guests = [g for g in guests if g.role.lower() == campaign.recipient_role.lower()]
        
    sent_count = 0
    for guest in target_guests:
        # Define body based on campaign type
        if campaign.template_type == "RSVP Reminder":
            if guest.status != "Pending":
                continue
            body = f"Hello {guest.name}, we are waiting for your RSVP for {event.title}. Please confirm your attendance!"
        elif campaign.template_type == "Ticket Details":
            ticket = db.query(models.Ticket).filter(models.Ticket.guest_id == guest.id).first()
            code = ticket.ticket_code if ticket else "N/A"
            body = f"Dear {guest.name}, here is your check-in code for {event.title}: {code}. Use this QR code at the entrance."
        elif campaign.template_type == "Venue Update":
            body = f"Important Update for {event.title}: The venue location is set to {event.location}. Doors open on time!"
        else: # Post-Event Survey
            body = f"Thank you for attending {event.title}! Please fill out our feedback survey at: http://eventsphere.com/survey/{event_id}"
            
        send_notification(
            event_id=event_id,
            recipient_name=guest.name,
            recipient_address=guest.email if campaign.channel in ["Email", "Push"] else (guest.phone or guest.email),
            channel=campaign.channel,
            template_type=campaign.template_type,
            body=body
        )
        sent_count += 1
        
    return {"status": "Campaign processed", "sent_messages_count": sent_count}

@router.get("/events/{event_id}/notifications/logs")
def read_notification_logs(event_id: int):
    return get_logs(event_id=event_id)
