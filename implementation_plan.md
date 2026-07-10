# Implementation Plan - EventSphere Platform

EventSphere is a dynamic, end-to-end event planning and management platform. This plan details the architecture, file structure, database schema, and implementation strategy for all 26 core features.

## Architecture Overview

EventSphere will be built as a full-stack web application:
1. **Frontend**: Built using React, TypeScript, Tailwind CSS, Lucide icons, Recharts, and Framer Motion. It will feature a premium, dark-themed responsive design with smooth transitions and glassmorphism.
2. **Backend**: Built using FastAPI (Python), SQLAlchemy ORM, and Pydantic. It provides fully documented REST endpoints (available via Swagger UI at `/docs`) and handles database interactions, AI planning algorithms, exports, and analytics.
3. **Database**: SQLite database (`eventsphere.db`) for immediate local runnability, with standard SQLAlchemy models compatible with PostgreSQL.

---

## Proposed Project Structure

```text
Event sphere/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI App Entrypoint
│   │   ├── config.py           # Database & App Settings
│   │   ├── database.py         # SQLAlchemy connection
│   │   ├── models.py           # Database Models
│   │   ├── schemas.py          # Pydantic Schemas
│   │   ├── crud.py             # Database Helper Operations
│   │   ├── routers/            # Endpoints grouped by feature
│   │   │   ├── __init__.py
│   │   │   ├── events.py
│   │   │   ├── guests.py
│   │   │   ├── tickets.py
│   │   │   ├── budget.py
│   │   │   ├── vendors.py
│   │   │   ├── scheduler.py
│   │   │   ├── seating.py
│   │   │   ├── badges.py
│   │   │   ├── polls_qa.py
│   │   │   ├── certificates.py
│   │   │   ├── feedback.py
│   │   │   ├── sponsors.py
│   │   │   ├── staff.py
│   │   │   └── ai.py           # AI Planner, Budget Prediction, Chat
│   │   └── services/           # Business logic helpers
│   │       ├── __init__.py
│   │       ├── mailer.py       # SMS / Email Automation Simulator
│   │       ├── calendar.py     # ICS Export Generator
│   │       └── pdf_badge.py    # Digital Badge/Certificate generator logic
│   ├── requirements.txt
│   └── run.py                  # Dev-server starter
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx             # Routing & Global Layout
    │   ├── index.css           # Global CSS & Tailwind utilities
    │   ├── components/         # Shared Components (Sidebar, UI elements)
    │   │   ├── Sidebar.tsx
    │   │   ├── Navbar.tsx
    │   │   ├── Modal.tsx
    │   │   └── ui/             # Reusable custom UI components (Buttons, inputs, cards)
    │   ├── context/
    │   │   └── LanguageContext.tsx  # Multi-language translation state
    │   ├── types/              # TypeScript Interfaces
    │   └── pages/              # Application Pages
    │       ├── Dashboard.tsx   # Live Dashboard, Analytics, Polls
    │       ├── EventPlanner.tsx # AI Event Planner & Smart Scheduler
    │       ├── SeatingMap.tsx  # Seating arrangement & Interactive map
    │       ├── GuestRSVP.tsx   # Guest list, RSVPs, Notifications log
    │       ├── Ticketing.tsx   # Ticketing, QR check-in simulator, Badge builder
    │       ├── BudgetManager.tsx # Budget tracking & AI Budget prediction
    │       ├── VendorMarket.tsx # Vendor Marketplace & Bookings
    │       ├── EventWebsiteGen.tsx # Event website generator & Editor
    │       ├── PollsQA.tsx     # Live Polls, Questions & Answers
    │       ├── MediaGallery.tsx # Photo Gallery
    │       ├── Certificates.tsx # Certificate Generator & Templates
    │       ├── SponsorsStaff.tsx # Sponsorship & Staff management
    │       └── EventWebsitePublic.tsx # Generated public website preview
```

---

## Database Schema (SQLAlchemy Models)

We will define the following tables in [models.py](file:///c:/Users/lukky/OneDrive/Desktop/Event%20sphere/backend/app/models.py):

1. **Event**: `id`, `title`, `description`, `date`, `location`, `theme`, `website_slug`, `website_config` (JSON configuration for website builder), `created_at`.
2. **Guest**: `id`, `event_id`, `name`, `email`, `phone`, `status` (Attending, Declined, Pending), `role` (Attendee, Speaker, VIP, Staff), `table_id`, `seat_number`, `badge_printed` (Boolean).
3. **Ticket**: `id`, `event_id`, `guest_id`, `ticket_code` (Unique), `tier` (General, VIP, Early Bird), `price`, `checked_in` (Boolean), `checked_in_at`.
4. **BudgetItem**: `id`, `event_id`, `category`, `item_name`, `allocated_amount`, `actual_amount`, `notes`.
5. **Vendor**: `id`, `name`, `category` (Catering, Venue, AV, Decor), `rating`, `starting_price`, `contact`, `image_url`, `description`.
6. **VendorBooking**: `id`, `event_id`, `vendor_id`, `status` (Pending, Confirmed), `cost`, `booking_date`.
7. **ScheduleSession**: `id`, `event_id`, `title`, `speaker`, `start_time`, `end_time`, `location`.
8. **Seat**: `id`, `event_id`, `table_name`, `table_shape` (round/rectangular), `x_coordinate`, `y_coordinate`, `capacity`, `guest_ids` (JSON list).
9. **Poll**: `id`, `event_id`, `question`, `options` (JSON list), `votes` (JSON list), `is_active` (Boolean).
10. **Question**: `id`, `event_id`, `guest_name`, `question_text`, `upvotes` (Integer), `is_answered` (Boolean), `created_at`.
11. **Feedback**: `id`, `event_id`, `rating` (1-5), `comments`, `sentiment` (Positive, Neutral, Negative).
12. **Sponsor**: `id`, `event_id`, `name`, `level` (Gold, Silver, Bronze), `amount_funded`, `logo_url`, `website`.
13. **StaffMember**: `id`, `event_id`, `name`, `role` (Coordinator, Security, Support, Admin), `shift_start`, `shift_end`, `contact`.

---

## 26 Core Features Implementation Detail

Here is how each feature will be wired across the React frontend and FastAPI backend:

| # | Feature | Backend Endpoint / Logic | Frontend Component / View |
|---|---|---|---|
| **1** | **Guest Management** | CRUD endpoints in `/guests` (Add, Edit, Delete, Filter). | Guest table with filters, search, import, export in `GuestRSVP.tsx`. |
| **2** | **RSVP Tracking** | `/guests/{id}/rsvp` to update RSVP status. | Action buttons in Guest table + guest-facing RSVP mockup. |
| **3** | **Ticketing** | `/tickets` to generate tickets, fetch tiers, track sales. | Pricing tiers, purchase simulation, visual ticket with QR code. |
| **4** | **Budget Management** | CRUD `/budget` to log actual/allocated expense items. | Interactive charts (allocated vs actual) and expense ledger in `BudgetManager.tsx`. |
| **5** | **Vendor Marketplace** | `/vendors` and `/vendors/book` to retrieve and book vendors. | Catalog cards, search, category filters, and simulated booking. |
| **6** | **AI Event Planner** | `/ai/plan` endpoint. Uses rules & prompt template to generate checklists, itineraries, and vendor recommendations. | AI chat form in `EventPlanner.tsx` to generate and save planning schedules. |
| **7** | **Smart Event Scheduler** | `/scheduler` endpoints to plan sessions and resolve conflicts (overlapping slots). | Timetable schedule list, timeline view, drag-and-drop ordering. |
| **8** | **Event Website Generator** | `/events/{id}/website` stores customized style configs (theme, background, content). | WYSIWYG editor in `EventWebsiteGen.tsx` and public-facing rendered page preview. |
| **9** | **Live Dashboard** | Aggregated data in `/analytics/dashboard` returning RSVP%, sales, check-in rate. | Dark-mode HUD with key metrics, real-time counter simulation, charts in `Dashboard.tsx`. |
| **10** | **QR Check-In** | `/tickets/check-in` updates database status when scanning a barcode/QR. | Simulated camera scanner that scans/uploads QR codes to check in guests. |
| **11** | **Digital Badge Generator** | `/badges/preview` returns badge mockup configurations. | Canvas-based template designer (VIP/Staff/Speaker) with export options. |
| **12** | **Seating Arrangement Builder** | CRUD `/seating` endpoints to save tables and guest placements. | Interactive seating canvas in `SeatingMap.tsx` with drag-and-drop guest assignment. |
| **13** | **Calendar Sync** | `/events/{id}/calendar` downloads standard `.ics` file. | Buttons to "Sync to Google Calendar" (URL builder) and "Download .ics". |
| **14** | **Push Notifications** | WebPush mock + `/notifications/send` logging endpoint. | Simulated notification center showing real-time banner popups. |
| **15** | **Email & SMS Automation** | `/notifications/send-campaign` mocks automated mailer triggers. | Campaigns builder UI (e.g. RSVP reminders) with send logs. |
| **16** | **AI Chat Assistant** | `/ai/chat` answers queries about guests, budget, event stats. | Sticky floating AI chatbot available throughout the dashboard. |
| **17** | **Interactive Venue Map** | Part of seating endpoints, adds stage, catering, layout objects. | Visually arrange tables, stage, catering booths on a floor plan. |
| **18** | **Multi-language Support** | Client-side localization context (English / Spanish / French). | Navbar toggle switching entire application text content instantly. |
| **19** | **Live Polls & Q&A** | WebSockets/Short-polling `/polls` & `/qa` for upvoting and voting. | Interactive Q&A list (with upvotes) & voting charts in `PollsQA.tsx`. |
| **20** | **Certificate Generator** | `/certificates/generate` creates completion/speaker certificates. | Template editor, download PDF/image button in `Certificates.tsx`. |
| **21** | **Photo Gallery** | CRUD `/gallery` for images, tags, descriptions. | Masonry grid with image lightboxes, upload simulator, category tags. |
| **22** | **Feedback System** | `/feedback` aggregates rating data and runs simple sentiment analysis. | Sentiment score charts, average rating star display, feedback list. |
| **23** | **Sponsorship Management** | CRUD `/sponsors` for sponsors level, amount, and banner settings. | Sponsor grid, tier builder, dashboard showcase in `SponsorsStaff.tsx`. |
| **24** | **Staff Management** | CRUD `/staff` mapping shifts, contact details, and role assignments. | Shift scheduler calendar, contact directory, and role tags. |
| **25** | **Attendance & Revenue Analytics** | `/analytics/financials` calculates ticket revenue, costs, net profit. | Complex financial charts (Recharts) detailing revenue trends. |
| **26** | **AI Budget Prediction** | `/ai/predict-budget` inputs guest count/type and outputs cost projections. | Input slider forecasting total budget and cost distribution charts. |

---

## User Review Required

> [!IMPORTANT]
> To ensure the application is completely functional and easy to launch in a single step, I will bundle a pre-populated SQLite database containing realistic event data, mock guest lists, vendor marketplace options, and sample budget logs.

> [!NOTE]
> For the AI components, I will write intelligent heuristics, text generation logic, and calculation algorithms on the FastAPI backend (e.g., standard linear regression/classification heuristic calculations for budget prediction, NLP keywords for sentiment analysis, and structural template matching for event planning). This guarantees they work out-of-the-box without requiring custom API credentials, while keeping the API extensible for external LLM integrations.

---

## Verification Plan

### Automated Verification
We will include a unit testing suite on the backend to test core APIs:
- `pytest` for testing FastAPI routes (events, RSVPs, ticketing, budget predictions).
- Run linting with `flake8` or `black` on backend code.
- Run `npm run build` on the React frontend to verify that TypeScript compile and bundler processes pass without errors.

### Manual Verification
1. We will launch the backend server using Uvicorn: `python run.py` (running on port `8000`).
2. We will run the frontend using Vite: `npm run dev` (running on port `5173`).
3. We will open the browser to view the premium dashboard interface and interact with all 26 feature pages.
