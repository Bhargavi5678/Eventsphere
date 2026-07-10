from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app import models, schemas, crud
from app.routers import events, guests, budget, scheduler, polls_qa, sponsors_staff, ai

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Full-stack FastAPI backend powering the EventSphere management platform.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(events.router)
app.include_router(guests.router)
app.include_router(budget.router)
app.include_router(scheduler.router)
app.include_router(polls_qa.router)
app.include_router(sponsors_staff.router)
app.include_router(ai.router)

# Seed database on startup if empty
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        # Check if events already exist
        if db.query(models.Event).count() == 0:
            print("Seeding default event data...")
            # 1. Create Default Event
            default_event = models.Event(
                id=1,
                title="TechSphere Global Summit 2026",
                description="The premier event for AI, cloud computing, and advanced agentic architectures. Bringing together global innovators and developers.",
                date="2026-10-15",
                location="Silicon Convention Center, California",
                theme="glassmorphism-dark",
                website_slug="techsphere-2026",
                website_config={
                    "banner_title": "TechSphere Global Summit 2026",
                    "banner_subtitle": "Innovating the Future of Agentic Tech",
                    "primary_color": "#818cf8",
                    "background_theme": "dark",
                    "show_schedule": True,
                    "show_sponsors": True
                }
            )
            db.add(default_event)
            db.commit()
            
            # 2. Add Default Budget Items
            budget_items = [
                models.BudgetItem(event_id=1, category="Venue", item_name="Exhibition Hall Rental", allocated_amount=15000.0, actual_amount=15000.0, notes="Deposit paid"),
                models.BudgetItem(event_id=1, category="Catering", item_name="VIP Buffet & Luncheon", allocated_amount=8000.0, actual_amount=7500.0, notes="Includes organic refreshments"),
                models.BudgetItem(event_id=1, category="Audio/Visual", item_name="LED Wall & Keynote Audio Setup", allocated_amount=5000.0, actual_amount=5200.0, notes="Overtime installation fee included"),
                models.BudgetItem(event_id=1, category="Marketing", item_name="Digital Banners & Print Badges", allocated_amount=2500.0, actual_amount=2000.0, notes="Eco-friendly printable cardboards"),
                models.BudgetItem(event_id=1, category="Staffing", item_name="Security & Support Coordinators", allocated_amount=4000.0, actual_amount=3800.0, notes="20 staff contracted")
            ]
            db.add_all(budget_items)
            
            # 3. Add Default Guests and Tickets
            guests = [
                models.Guest(id=1, event_id=1, name="Dr. Evelyn Vance", email="evelyn.vance@techinnovation.org", phone="+15550198", status="Attending", role="Speaker", table_id=1, seat_number=1),
                models.Guest(id=2, event_id=1, name="Marcus Thorne", email="mthorne@venturecapital.com", phone="+15550231", status="Attending", role="VIP", table_id=1, seat_number=2),
                models.Guest(id=3, event_id=1, name="Sarah Jenkins", email="sjenkins@cloudtech.io", phone="+15550478", status="Pending", role="Attendee"),
                models.Guest(id=4, event_id=1, name="David Kim", email="dkim@agenticcoder.com", phone="+15550992", status="Attending", role="Attendee", table_id=2, seat_number=1),
                models.Guest(id=5, event_id=1, name="Elena Rostova", email="elena.r@cybersecurity.net", phone="+15550881", status="Declined", role="Attendee"),
                models.Guest(id=6, event_id=1, name="Thomas Wright", email="twright@roboticslabs.com", phone="+15550772", status="Pending", role="Speaker")
            ]
            db.add_all(guests)
            db.commit()
            
            # Add Tickets for guests
            tickets = [
                models.Ticket(event_id=1, guest_id=1, ticket_code="ES-1-1-SPEAKER-VANCE", tier="VIP", price=0.0, checked_in=True),
                models.Ticket(event_id=1, guest_id=2, ticket_code="ES-1-2-VIP-THORNE", tier="VIP", price=499.0, checked_in=True),
                models.Ticket(event_id=1, guest_id=3, ticket_code="ES-1-3-GEN-JENKINS", tier="General", price=199.0, checked_in=False),
                models.Ticket(event_id=1, guest_id=4, ticket_code="ES-1-4-EARLY-KIM", tier="Early Bird", price=149.0, checked_in=False),
                models.Ticket(event_id=1, guest_id=5, ticket_code="ES-1-5-GEN-ROSTOVA", tier="General", price=199.0, checked_in=False),
                models.Ticket(event_id=1, guest_id=6, ticket_code="ES-1-6-SPEAKER-WRIGHT", tier="VIP", price=0.0, checked_in=False)
            ]
            db.add_all(tickets)
            
            # 4. Add Default Schedule Sessions
            sessions = [
                models.ScheduleSession(event_id=1, title="Agentic Coding: The Next Era of Software Development", speaker="Dr. Evelyn Vance", start_time="10:00", end_time="11:30", location="Main Auditorium"),
                models.ScheduleSession(event_id=1, title="FastAPI 2.0 & High-Performance Python Web Architectures", speaker="David Kim", start_time="13:00", end_time="14:00", location="Seminar Room B"),
                models.ScheduleSession(event_id=1, title="Venturing into AI: Investment Landscapes for 2027", speaker="Marcus Thorne", start_time="14:30", end_time="15:30", location="Main Auditorium")
            ]
            db.add_all(sessions)
            
            # 5. Add Seating tables
            seats = [
                models.Seat(id=1, event_id=1, table_name="VIP Round Table 1", table_shape="round", x_coordinate=200, y_coordinate=200, capacity=8, guest_ids=[1, 2]),
                models.Seat(id=2, event_id=1, table_name="Exhibition Center Table A", table_shape="rectangular", x_coordinate=450, y_coordinate=250, capacity=6, guest_ids=[4])
            ]
            db.add_all(seats)
            
            # 6. Add Sponsors
            sponsors = [
                models.Sponsor(event_id=1, name="Venture Labs", level="Gold", amount_funded=15000.0, logo_url="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=60", website="https://venturelabs.com"),
                models.Sponsor(event_id=1, name="Cyberdyne Systems", level="Silver", amount_funded=8000.0, logo_url="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60", website="https://cyberdyne.io"),
                models.Sponsor(event_id=1, name="Infinity Cloud", level="Bronze", amount_funded=3000.0, logo_url="https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=100&auto=format&fit=crop&q=60", website="https://infinitycloud.org")
            ]
            db.add_all(sponsors)
            
            # 7. Add Staff Members
            staff = [
                models.StaffMember(event_id=1, name="Agent Lukky", role="Admin", shift_start="08:00", shift_end="18:00", contact="+15550000"),
                models.StaffMember(event_id=1, name="Jordan Cross", role="Coordinator", shift_start="09:00", shift_end="17:00", contact="+15551111"),
                models.StaffMember(event_id=1, name="Sam Fisher", role="Security", shift_start="08:00", shift_end="20:00", contact="+15552222")
            ]
            db.add_all(staff)
            
            db.commit()
            print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "Online",
        "message": "EventSphere API is fully operational",
        "documentation": "/docs"
    }
