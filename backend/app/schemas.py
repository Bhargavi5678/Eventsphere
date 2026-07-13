from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Common Configuration
class ORMModel(BaseModel):
    class Config:
        from_attributes = True

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: str
    name: str
    role: str = "Guest" # Admin, Event Organizer, Vendor, Guest
    is_verified: bool = False

class UserRegister(BaseModel):
    email: str
    name: str
    password: str
    role: str = "Guest"

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyEmailRequest(BaseModel):
    email: str
    token: str

class UserResponse(UserBase, ORMModel):
    id: int
    created_at: datetime

# --- EVENT SCHEMAS ---
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    location: str
    theme: Optional[str] = "modern-dark"
    website_slug: Optional[str] = None
    website_config: Optional[Dict[str, Any]] = None
    status: Optional[str] = "Published" # Draft, Published, Cancelled
    guest_limit: Optional[int] = 100
    organizer_id: Optional[int] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    location: Optional[str] = None
    theme: Optional[str] = None
    website_slug: Optional[str] = None
    website_config: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    guest_limit: Optional[int] = None
    organizer_id: Optional[int] = None

class EventResponse(EventBase, ORMModel):
    id: int
    created_at: datetime

# --- GUEST SCHEMAS ---
class GuestBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    status: Optional[str] = "Pending"
    role: Optional[str] = "Attendee"
    table_id: Optional[int] = None
    seat_number: Optional[int] = None
    badge_printed: Optional[bool] = False
    user_id: Optional[int] = None

class GuestCreate(GuestBase):
    pass

class GuestUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    role: Optional[str] = None
    table_id: Optional[int] = None
    seat_number: Optional[int] = None
    badge_printed: Optional[bool] = None
    user_id: Optional[int] = None

class GuestResponse(GuestBase, ORMModel):
    id: int
    event_id: int
    created_at: datetime

# --- TICKET SCHEMAS ---
class TicketBase(BaseModel):
    tier: str = "General"
    price: float = 0.0
    checked_in: Optional[bool] = False

class TicketCreate(BaseModel):
    guest_id: int
    tier: str = "General"
    price: float = 0.0

class TicketResponse(TicketBase, ORMModel):
    id: int
    event_id: int
    guest_id: int
    ticket_code: str
    checked_in_at: Optional[datetime] = None

# --- BUDGET SCHEMAS ---
class BudgetItemBase(BaseModel):
    category: str
    item_name: str
    allocated_amount: float = 0.0
    actual_amount: float = 0.0
    notes: Optional[str] = None

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetItemResponse(BudgetItemBase, ORMModel):
    id: int
    event_id: int

# --- VENDOR SCHEMAS ---
class VendorBase(BaseModel):
    name: str
    category: str
    rating: float = 5.0
    starting_price: float = 0.0
    contact: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    availability: Optional[bool] = True
    reviews: Optional[List[Dict[str, Any]]] = None
    user_id: Optional[int] = None

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase, ORMModel):
    id: int

class VendorBookingBase(BaseModel):
    vendor_id: int
    cost: float = 0.0
    booking_date: Optional[str] = None

class VendorBookingCreate(VendorBookingBase):
    pass

class VendorBookingResponse(ORMModel):
    id: int
    event_id: int
    vendor_id: int
    status: str
    cost: float
    booking_date: Optional[str]
    vendor: VendorResponse

# --- SCHEDULE SESSION SCHEMAS ---
class ScheduleSessionBase(BaseModel):
    title: str
    speaker: Optional[str] = None
    start_time: str
    end_time: str
    location: Optional[str] = None
    session_type: Optional[str] = "session" # session, meeting, deadline

class ScheduleSessionCreate(ScheduleSessionBase):
    pass

class ScheduleSessionResponse(ScheduleSessionBase, ORMModel):
    id: int
    event_id: int

# --- SEATING SCHEMAS ---
class SeatBase(BaseModel):
    table_name: str
    table_shape: Optional[str] = "round"
    x_coordinate: Optional[int] = 100
    y_coordinate: Optional[int] = 100
    capacity: Optional[int] = 8
    guest_ids: Optional[List[int]] = None

class SeatCreate(SeatBase):
    pass

class SeatResponse(SeatBase, ORMModel):
    id: int
    event_id: int

# --- POLLS SCHEMAS ---
class PollBase(BaseModel):
    question: str
    options: List[str]
    is_active: Optional[bool] = True

class PollCreate(PollBase):
    pass

class PollVote(BaseModel):
    option_index: int

class PollResponse(PollBase, ORMModel):
    id: int
    event_id: int
    votes: List[int]

# --- Q&A SCHEMAS ---
class QuestionBase(BaseModel):
    guest_name: Optional[str] = "Anonymous"
    question_text: str

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase, ORMModel):
    id: int
    event_id: int
    upvotes: int
    is_answered: bool
    created_at: datetime

# --- FEEDBACK SCHEMAS ---
class FeedbackBase(BaseModel):
    rating: int = Field(5, ge=1, le=5)
    comments: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackResponse(FeedbackBase, ORMModel):
    id: int
    event_id: int
    sentiment: str
    created_at: datetime

# --- SPONSOR SCHEMAS ---
class SponsorBase(BaseModel):
    name: str
    level: str = "Bronze"
    amount_funded: float = 0.0
    logo_url: Optional[str] = None
    website: Optional[str] = None

class SponsorCreate(SponsorBase):
    pass

class SponsorResponse(SponsorBase, ORMModel):
    id: int
    event_id: int

# --- STAFF SCHEMAS ---
class StaffMemberBase(BaseModel):
    name: str
    role: str = "Support"
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    contact: str

class StaffMemberCreate(StaffMemberBase):
    pass

class StaffMemberResponse(StaffMemberBase, ORMModel):
    id: int
    event_id: int

# --- AI & NOTIFICATION WRAPPER SCHEMAS ---
class AIPlanRequest(BaseModel):
    theme: str
    budget: float
    guest_count: int
    event_type: str

class AIChatRequest(BaseModel):
    message: str
    event_id: int

class AIChatResponse(BaseModel):
    reply: str

class AIBudgetPredictRequest(BaseModel):
    event_type: str
    guest_count: int
    location_type: str

class AIBudgetPredictResponse(BaseModel):
    predicted_total: float
    suggested_breakdown: Dict[str, float]
    confidence_score: float

class NotificationCampaignRequest(BaseModel):
    channel: str # "Email" or "SMS" or "Push"
    template_type: str # "RSVP Reminder", "Ticket Details", "Venue Update", "Post-Event Survey"
    recipient_role: str = "All" # "Attendee", "Speaker", "VIP", "All"

