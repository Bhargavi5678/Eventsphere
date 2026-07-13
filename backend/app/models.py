from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Guest")  # Admin, Event Organizer, Vendor, Guest
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    events = relationship("Event", back_populates="organizer")
    guests = relationship("Guest", back_populates="user")
    vendors = relationship("Vendor", back_populates="user")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(String, nullable=False)  # ISO string or date
    location = Column(String, nullable=False)
    theme = Column(String, default="modern-dark")
    website_slug = Column(String, unique=True, index=True, nullable=True)
    website_config = Column(JSON, default=dict)  # Stores styling & structure config
    status = Column(String, default="Published")  # Draft, Published, Cancelled
    guest_limit = Column(Integer, default=100)
    organizer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organizer = relationship("User", back_populates="events")
    guests = relationship("Guest", back_populates="event", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="event", cascade="all, delete-orphan")
    budget_items = relationship("BudgetItem", back_populates="event", cascade="all, delete-orphan")
    bookings = relationship("VendorBooking", back_populates="event", cascade="all, delete-orphan")
    sessions = relationship("ScheduleSession", back_populates="event", cascade="all, delete-orphan")
    seats = relationship("Seat", back_populates="event", cascade="all, delete-orphan")
    polls = relationship("Poll", back_populates="event", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="event", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="event", cascade="all, delete-orphan")
    sponsors = relationship("Sponsor", back_populates="event", cascade="all, delete-orphan")
    staff_members = relationship("StaffMember", back_populates="event", cascade="all, delete-orphan")


class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    status = Column(String, default="Pending")  # Attending, Declined, Maybe, Waitlist, Pending
    role = Column(String, default="Attendee")    # Attendee, Speaker, VIP, Staff
    table_id = Column(Integer, nullable=True)
    seat_number = Column(Integer, nullable=True)
    badge_printed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="guests")
    user = relationship("User", back_populates="guests")
    tickets = relationship("Ticket", back_populates="guest", cascade="all, delete-orphan")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    guest_id = Column(Integer, ForeignKey("guests.id", ondelete="CASCADE"), nullable=False)
    ticket_code = Column(String, unique=True, index=True, nullable=False)
    tier = Column(String, default="General")     # General, VIP, Early Bird
    price = Column(Float, default=0.0)
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime, nullable=True)

    event = relationship("Event", back_populates="tickets")
    guest = relationship("Guest", back_populates="tickets")


class BudgetItem(Base):
    __tablename__ = "budget_items"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)     # Venue, Catering, Decor, Marketing, etc.
    item_name = Column(String, nullable=False)
    allocated_amount = Column(Float, default=0.0)
    actual_amount = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

    event = relationship("Event", back_populates="budget_items")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)     # Catering, Venue, AV, Decor, Photography, DJ, Makeup, Security, Transportation
    rating = Column(Float, default=5.0)
    starting_price = Column(Float, default=0.0)
    contact = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    availability = Column(Boolean, default=True)
    reviews = Column(JSON, default=list)  # [{"author": "Marcus", "rating": 5, "comment": "Excellent ballroom!", "date": "2026-07-10"}]

    bookings = relationship("VendorBooking", back_populates="vendor", cascade="all, delete-orphan")
    user = relationship("User", back_populates="vendors")


class VendorBooking(Base):
    __tablename__ = "vendor_bookings"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="Pending")    # Pending, Confirmed
    cost = Column(Float, default=0.0)
    booking_date = Column(String, nullable=True)

    event = relationship("Event", back_populates="bookings")
    vendor = relationship("Vendor", back_populates="bookings")


class ScheduleSession(Base):
    __tablename__ = "schedule_sessions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    speaker = Column(String, nullable=True)
    start_time = Column(String, nullable=False)   # ISO or HH:MM
    end_time = Column(String, nullable=False)
    location = Column(String, nullable=True)
    session_type = Column(String, default="session") # session, meeting, deadline

    event = relationship("Event", back_populates="sessions")


class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    table_name = Column(String, nullable=False)
    table_shape = Column(String, default="round") # round, rectangular
    x_coordinate = Column(Integer, default=100)
    y_coordinate = Column(Integer, default=100)
    capacity = Column(Integer, default=8)
    guest_ids = Column(JSON, default=list)        # List of integer guest IDs placed at this table

    event = relationship("Event", back_populates="seats")


class Poll(Base):
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=False)         # ["Option A", "Option B", ...]
    votes = Column(JSON, default=list)             # [10, 5, ...] indices matching options
    is_active = Column(Boolean, default=True)

    event = relationship("Event", back_populates="polls")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    guest_name = Column(String, default="Anonymous")
    question_text = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0)
    is_answered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="questions")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, default=5)            # 1 to 5
    comments = Column(Text, nullable=True)
    sentiment = Column(String, default="Neutral")  # Positive, Neutral, Negative
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="feedbacks")


class Sponsor(Base):
    __tablename__ = "sponsors"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    level = Column(String, default="Bronze")      # Gold, Silver, Bronze
    amount_funded = Column(Float, default=0.0)
    logo_url = Column(String, nullable=True)
    website = Column(String, nullable=True)

    event = relationship("Event", back_populates="sponsors")


class StaffMember(Base):
    __tablename__ = "staff_members"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="Support")       # Coordinator, Security, Support, Admin
    shift_start = Column(String, nullable=True)
    shift_end = Column(String, nullable=True)
    contact = Column(String, nullable=False)

    event = relationship("Event", back_populates="staff_members")

