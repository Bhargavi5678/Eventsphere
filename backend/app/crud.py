import uuid
from sqlalchemy.orm import Session
from datetime import datetime
from app import models, schemas

# Helper to automatically determine sentiment based on comments
def analyze_sentiment(comments: str) -> str:
    if not comments:
        return "Neutral"
    positive_words = ["good", "great", "excellent", "love", "amazing", "wonderful", "perfect", "awesome", "nice"]
    negative_words = ["bad", "poor", "worst", "terrible", "hate", "boring", "late", "expensive", "rude", "cold"]
    text = comments.lower()
    pos_count = sum(1 for w in positive_words if w in text)
    neg_count = sum(1 for w in negative_words if w in text)
    if pos_count > neg_count:
        return "Positive"
    elif neg_count > pos_count:
        return "Negative"
    return "Neutral"

# --- EVENTS ---
def get_event(db: Session, event_id: int):
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_event_by_slug(db: Session, slug: str):
    return db.query(models.Event).filter(models.Event.website_slug == slug).first()

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Event).offset(skip).limit(limit).all()

def create_event(db: Session, event: schemas.EventCreate):
    db_event = models.Event(
        title=event.title,
        description=event.description,
        date=event.date,
        location=event.location,
        theme=event.theme,
        website_slug=event.website_slug or str(uuid.uuid4())[:8],
        status=event.status or "Published",
        guest_limit=event.guest_limit or 100,
        organizer_id=event.organizer_id,
        website_config=event.website_config or {
            "banner_title": event.title,
            "banner_subtitle": event.description or "Welcome to our event website!",
            "primary_color": "#6366f1",
            "background_theme": "dark",
            "show_schedule": True,
            "show_sponsors": True
        }
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def duplicate_event(db: Session, event_id: int):
    orig = get_event(db, event_id)
    if not orig:
        return None
    
    new_event = models.Event(
        title=f"Copy of {orig.title}",
        description=orig.description,
        date=orig.date,
        location=orig.location,
        theme=orig.theme,
        website_slug=f"copy-{str(uuid.uuid4())[:8]}",
        website_config=orig.website_config,
        status="Draft",
        guest_limit=orig.guest_limit,
        organizer_id=orig.organizer_id
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    # Copy sessions
    for session in orig.sessions:
        new_session = models.ScheduleSession(
            event_id=new_event.id,
            title=session.title,
            speaker=session.speaker,
            start_time=session.start_time,
            end_time=session.end_time,
            location=session.location,
            session_type=session.session_type
        )
        db.add(new_session)
        
    # Copy seating
    for seat in orig.seats:
        new_seat = models.Seat(
            event_id=new_event.id,
            table_name=seat.table_name,
            table_shape=seat.table_shape,
            x_coordinate=seat.x_coordinate,
            y_coordinate=seat.y_coordinate,
            capacity=seat.capacity,
            guest_ids=[]
        )
        db.add(new_seat)
        
    # Copy sponsors
    for sponsor in orig.sponsors:
        new_sponsor = models.Sponsor(
            event_id=new_event.id,
            name=sponsor.name,
            level=sponsor.level,
            amount_funded=sponsor.amount_funded,
            logo_url=sponsor.logo_url,
            website=sponsor.website
        )
        db.add(new_sponsor)
        
    db.commit()
    db.refresh(new_event)
    return new_event

def update_event(db: Session, event_id: int, event_update: schemas.EventUpdate):
    db_event = get_event(db, event_id)
    if not db_event:
        return None
    for key, value in event_update.model_dump(exclude_unset=True).items():
        setattr(db_event, key, value)
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int):
    db_event = get_event(db, event_id)
    if db_event:
        db.delete(db_event)
        db.commit()
        return True
    return False


# --- GUESTS ---
def check_rsvp_status_and_limit(db: Session, event_id: int, guest_id: Optional[int], target_status: str) -> str:
    """
    Checks if a status change to 'Attending' exceeds the event's guest limit.
    If so, returns 'Waitlist'. Otherwise returns the target_status.
    """
    if not target_status or target_status.lower() != 'attending':
        return target_status
        
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        return target_status
        
    query = db.query(models.Guest).filter(
        models.Guest.event_id == event_id,
        models.Guest.status == "Attending"
    )
    if guest_id:
        query = query.filter(models.Guest.id != guest_id)
        
    attending_count = query.count()
    if attending_count >= event.guest_limit:
        return "Waitlist"
    return "Attending"

def get_guests(db: Session, event_id: int):
    return db.query(models.Guest).filter(models.Guest.event_id == event_id).all()

def get_guest(db: Session, guest_id: int):
    return db.query(models.Guest).filter(models.Guest.id == guest_id).first()

def create_guest(db: Session, guest: schemas.GuestCreate, event_id: int):
    status = guest.status or "Pending"
    status = check_rsvp_status_and_limit(db, event_id, None, status)
    
    db_guest = models.Guest(**guest.model_dump(), event_id=event_id)
    db_guest.status = status
    db.add(db_guest)
    db.commit()
    db.refresh(db_guest)
    return db_guest

def update_guest(db: Session, guest_id: int, guest_update: schemas.GuestUpdate):
    db_guest = get_guest(db, guest_id)
    if not db_guest:
        return None
        
    update_data = guest_update.model_dump(exclude_unset=True)
    if "status" in update_data:
        status = update_data["status"]
        status = check_rsvp_status_and_limit(db, db_guest.event_id, guest_id, status)
        update_data["status"] = status
        
    for key, value in update_data.items():
        setattr(db_guest, key, value)
    db.commit()
    db.refresh(db_guest)
    return db_guest

def delete_guest(db: Session, guest_id: int):
    db_guest = get_guest(db, guest_id)
    if db_guest:
        db.delete(db_guest)
        db.commit()
        return True
    return False


# --- TICKETS ---
def get_tickets(db: Session, event_id: int):
    return db.query(models.Ticket).filter(models.Ticket.event_id == event_id).all()

def create_ticket(db: Session, ticket: schemas.TicketCreate, event_id: int):
    # Check if guest already has a ticket
    existing_ticket = db.query(models.Ticket).filter(
        models.Ticket.event_id == event_id,
        models.Ticket.guest_id == ticket.guest_id
    ).first()
    if existing_ticket:
        return existing_ticket

    ticket_code = f"ES-{event_id}-{ticket.guest_id}-{uuid.uuid4().hex[:6].upper()}"
    db_ticket = models.Ticket(
        event_id=event_id,
        guest_id=ticket.guest_id,
        ticket_code=ticket_code,
        tier=ticket.tier,
        price=ticket.price,
        checked_in=False
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def check_in_ticket(db: Session, ticket_code: str):
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_code == ticket_code).first()
    if not ticket:
        return None
    ticket.checked_in = True
    ticket.checked_in_at = datetime.utcnow()
    # Update guest status to Attending if checked in
    guest = db.query(models.Guest).filter(models.Guest.id == ticket.guest_id).first()
    if guest:
        guest.status = "Attending"
    db.commit()
    db.refresh(ticket)
    return ticket


# --- BUDGET ---
def get_budget_items(db: Session, event_id: int):
    return db.query(models.BudgetItem).filter(models.BudgetItem.event_id == event_id).all()

def create_budget_item(db: Session, item: schemas.BudgetItemCreate, event_id: int):
    db_item = models.BudgetItem(**item.model_dump(), event_id=event_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_budget_item(db: Session, item_id: int):
    db_item = db.query(models.BudgetItem).filter(models.BudgetItem.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
        return True
    return False


# --- VENDORS ---
def get_vendors(db: Session):
    return db.query(models.Vendor).all()

def create_vendor(db: Session, vendor: schemas.VendorCreate):
    db_vendor = models.Vendor(**vendor.model_dump())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

def get_vendor_bookings(db: Session, event_id: int):
    return db.query(models.VendorBooking).filter(models.VendorBooking.event_id == event_id).all()

def create_vendor_booking(db: Session, booking: schemas.VendorBookingCreate, event_id: int):
    db_booking = models.VendorBooking(
        event_id=event_id,
        vendor_id=booking.vendor_id,
        cost=booking.cost,
        booking_date=booking.booking_date,
        status="Confirmed"
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking


# --- SCHEDULER ---
def get_schedule_sessions(db: Session, event_id: int):
    return db.query(models.ScheduleSession).filter(models.ScheduleSession.event_id == event_id).all()

def create_schedule_session(db: Session, session: schemas.ScheduleSessionCreate, event_id: int):
    db_session = models.ScheduleSession(**session.model_dump(), event_id=event_id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def delete_schedule_session(db: Session, session_id: int):
    db_session = db.query(models.ScheduleSession).filter(models.ScheduleSession.id == session_id).first()
    if db_session:
        db.delete(db_session)
        db.commit()
        return True
    return False


# --- SEATING ---
def get_seats(db: Session, event_id: int):
    return db.query(models.Seat).filter(models.Seat.event_id == event_id).all()

def create_seat(db: Session, seat: schemas.SeatCreate, event_id: int):
    db_seat = models.Seat(
        event_id=event_id,
        table_name=seat.table_name,
        table_shape=seat.table_shape,
        x_coordinate=seat.x_coordinate,
        y_coordinate=seat.y_coordinate,
        capacity=seat.capacity,
        guest_ids=seat.guest_ids or []
    )
    db.add(db_seat)
    db.commit()
    db.refresh(db_seat)
    return db_seat

def update_seat(db: Session, seat_id: int, x: int, y: int, guest_ids: list[int]):
    db_seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first()
    if not db_seat:
        return None
    db_seat.x_coordinate = x
    db_seat.y_coordinate = y
    db_seat.guest_ids = guest_ids
    
    # Update associated guest record table and seat positions
    for i, guest_id in enumerate(guest_ids):
        guest = db.query(models.Guest).filter(models.Guest.id == guest_id).first()
        if guest:
            guest.table_id = seat_id
            guest.seat_number = i + 1
            
    db.commit()
    db.refresh(db_seat)
    return db_seat

def delete_seat(db: Session, seat_id: int):
    db_seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first()
    if db_seat:
        # Clear table references for seated guests
        guests = db.query(models.Guest).filter(models.Guest.table_id == seat_id).all()
        for g in guests:
            g.table_id = None
            g.seat_number = None
        db.delete(db_seat)
        db.commit()
        return True
    return False


# --- POLLS ---
def get_polls(db: Session, event_id: int):
    return db.query(models.Poll).filter(models.Poll.event_id == event_id).all()

def create_poll(db: Session, poll: schemas.PollCreate, event_id: int):
    votes_list = [0] * len(poll.options)
    db_poll = models.Poll(
        event_id=event_id,
        question=poll.question,
        options=poll.options,
        votes=votes_list,
        is_active=poll.is_active
    )
    db.add(db_poll)
    db.commit()
    db.refresh(db_poll)
    return db_poll

def vote_poll(db: Session, poll_id: int, option_index: int):
    db_poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    if not db_poll or not db_poll.is_active:
        return None
    
    votes = list(db_poll.votes)
    if 0 <= option_index < len(votes):
        votes[option_index] += 1
        db_poll.votes = votes
        db.commit()
        db.refresh(db_poll)
    return db_poll


# --- Q&A ---
def get_questions(db: Session, event_id: int):
    return db.query(models.Question).filter(models.Question.event_id == event_id).order_by(models.Question.upvotes.desc()).all()

def create_question(db: Session, question: schemas.QuestionCreate, event_id: int):
    db_question = models.Question(
        event_id=event_id,
        guest_name=question.guest_name or "Anonymous",
        question_text=question.question_text,
        upvotes=0,
        is_answered=False
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def upvote_question(db: Session, question_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        return None
    db_question.upvotes += 1
    db.commit()
    db.refresh(db_question)
    return db_question

def answer_question(db: Session, question_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        return None
    db_question.is_answered = True
    db.commit()
    db.refresh(db_question)
    return db_question


# --- FEEDBACK ---
def get_feedbacks(db: Session, event_id: int):
    return db.query(models.Feedback).filter(models.Feedback.event_id == event_id).all()

def create_feedback(db: Session, feedback: schemas.FeedbackCreate, event_id: int):
    sentiment = analyze_sentiment(feedback.comments)
    db_feedback = models.Feedback(
        event_id=event_id,
        rating=feedback.rating,
        comments=feedback.comments,
        sentiment=sentiment
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


# --- SPONSORS ---
def get_sponsors(db: Session, event_id: int):
    return db.query(models.Sponsor).filter(models.Sponsor.event_id == event_id).all()

def create_sponsor(db: Session, sponsor: schemas.SponsorCreate, event_id: int):
    db_sponsor = models.Sponsor(**sponsor.model_dump(), event_id=event_id)
    db.add(db_sponsor)
    db.commit()
    db.refresh(db_sponsor)
    return db_sponsor

def delete_sponsor(db: Session, sponsor_id: int):
    db_sponsor = db.query(models.Sponsor).filter(models.Sponsor.id == sponsor_id).first()
    if db_sponsor:
        db.delete(db_sponsor)
        db.commit()
        return True
    return False


# --- STAFF ---
def get_staff_members(db: Session, event_id: int):
    return db.query(models.StaffMember).filter(models.StaffMember.event_id == event_id).all()

def create_staff_member(db: Session, staff: schemas.StaffMemberCreate, event_id: int):
    db_staff = models.StaffMember(**staff.model_dump(), event_id=event_id)
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

def delete_staff_member(db: Session, staff_id: int):
    db_staff = db.query(models.StaffMember).filter(models.StaffMember.id == staff_id).first()
    if db_staff:
        db.delete(db_staff)
        db.commit()
        return True
    return False
