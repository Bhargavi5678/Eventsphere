from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, database

router = APIRouter(tags=["Budget & Vendors"])

# --- BUDGET ITEMS ---
@router.get("/events/{event_id}/budget", response_model=List[schemas.BudgetItemResponse])
def read_budget_items(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_budget_items(db, event_id=event_id)

@router.post("/events/{event_id}/budget", response_model=schemas.BudgetItemResponse)
def add_budget_item(event_id: int, item: schemas.BudgetItemCreate, db: Session = Depends(database.get_db)):
    return crud.create_budget_item(db, item=item, event_id=event_id)

@router.delete("/budget/{item_id}")
def remove_budget_item(item_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_budget_item(db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget item not found")
    return {"status": "Budget item deleted"}


# --- VENDOR MARKETPLACE ---
@router.get("/vendors", response_model=List[schemas.VendorResponse])
def read_marketplace_vendors(db: Session = Depends(database.get_db)):
    vendors = crud.get_vendors(db)
    # If database is empty, seed mock vendors so the marketplace is functional
    if not vendors:
        mock_vendors = [
            schemas.VendorCreate(
                name="Grand Ballroom Plaza", category="Venue", rating=4.8, starting_price=2500.0,
                contact="venue@grandballroom.com", image_url="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500&auto=format&fit=crop&q=60",
                description="Luxurious ballroom with crystal chandeliers, perfect for weddings and gala dinners."
            ),
            schemas.VendorCreate(
                name="Epicurean Delights Catering", category="Catering", rating=4.9, starting_price=45.0,
                contact="catering@epicurean.com", image_url="https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=60",
                description="Premium multi-cuisine buffet and fine dining catering with organic locally sourced ingredients."
            ),
            schemas.VendorCreate(
                name="Sonic Pulse Audio Visual", category="AV", rating=4.7, starting_price=1200.0,
                contact="av@sonicpulse.com", image_url="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60",
                description="Professional concert-grade sound systems, ambient stage lighting, and high-definition LED walls."
            ),
            schemas.VendorCreate(
                name="Flora & Bloom Decorators", category="Decor", rating=4.6, starting_price=800.0,
                contact="decor@florabloom.com", image_url="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60",
                description="Stunning floral arrangements, elegant table setups, and thematic backdrop styling."
            ),
            schemas.VendorCreate(
                name="Shutter Elite Photography", category="Photography", rating=4.9, starting_price=1500.0,
                contact="photos@shutterelite.com", image_url="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60",
                description="Award-winning event photography and cinematic 4K videography coverage."
            ),
            schemas.VendorCreate(
                name="Neon Beats Entertainment", category="Entertainment", rating=4.8, starting_price=1800.0,
                contact="dj@neonbeats.com", image_url="https://images.unsplash.com/photo-1487180144351-b8472da7a4c3?w=500&auto=format&fit=crop&q=60",
                description="High-energy live bands, custom DJ sets, and visual performers to keep the dance floor packed."
            )
        ]
        for v in mock_vendors:
            crud.create_vendor(db, vendor=v)
        vendors = crud.get_vendors(db)
    return vendors

@router.get("/events/{event_id}/bookings", response_model=List[schemas.VendorBookingResponse])
def read_event_bookings(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_vendor_bookings(db, event_id=event_id)

@router.post("/events/{event_id}/bookings", response_model=schemas.VendorBookingResponse)
def book_vendor_for_event(event_id: int, booking: schemas.VendorBookingCreate, db: Session = Depends(database.get_db)):
    # Create booking
    db_booking = crud.create_vendor_booking(db, booking=booking, event_id=event_id)
    
    # Auto-log booking cost to budget items
    vendor = db.query(models.Vendor).filter(models.Vendor.id == booking.vendor_id).first()
    vendor_name = vendor.name if vendor else "Vendor"
    vendor_cat = vendor.category if vendor else "Other"
    
    budget_payload = schemas.BudgetItemCreate(
        category=vendor_cat,
        item_name=f"Booking: {vendor_name}",
        allocated_amount=booking.cost,
        actual_amount=booking.cost,
        notes=f"Auto-generated from marketplace booking on {booking.booking_date or 'today'}"
    )
    crud.create_budget_item(db, item=budget_payload, event_id=event_id)
    
    # Reload booking to include vendor object relationship
    db.refresh(db_booking)
    return db_booking


# --- AI BUDGET PREDICTION ---
@router.post("/ai/predict-budget", response_model=schemas.AIBudgetPredictResponse)
def predict_budget(payload: schemas.AIBudgetPredictRequest):
    """
    Intelligent heuristic predictor forecasting event expense ranges based on event properties.
    """
    g_count = payload.guest_count
    e_type = payload.event_type.lower()
    loc_type = payload.location_type.lower()
    
    # Base costs per guest
    guest_cost_map = {
        "wedding": 150.0,
        "conference": 65.0,
        "concert": 110.0,
        "corporate": 90.0,
        "birthday": 50.0,
        "other": 60.0
    }
    
    # Fixed base overheads
    fixed_overhead_map = {
        "wedding": 6000.0,
        "conference": 4000.0,
        "concert": 12000.0,
        "corporate": 5000.0,
        "birthday": 1500.0,
        "other": 2000.0
    }
    
    base_cost = guest_cost_map.get(e_type, 60.0)
    fixed_cost = fixed_overhead_map.get(e_type, 2000.0)
    
    # Location multipliers
    multiplier = 1.0
    if loc_type == "premium":
        multiplier = 2.2
    elif loc_type == "budget":
        multiplier = 0.7
    else: # Standard
        multiplier = 1.2
        
    predicted_total = (fixed_cost + (base_cost * g_count)) * multiplier
    
    # Breakdown allocations
    breakdown = {
        "Venue": round(predicted_total * 0.35, 2),
        "Catering": round(predicted_total * 0.30, 2),
        "Audio/Visual": round(predicted_total * 0.15, 2),
        "Decor & Floral": round(predicted_total * 0.10, 2),
        "Staffing & Security": round(predicted_total * 0.06, 2),
        "Marketing & Printing": round(predicted_total * 0.04, 2)
    }
    
    confidence = 0.88 if g_count > 10 else 0.65
    if loc_type == "premium" and e_type == "wedding":
        confidence = 0.94
        
    return schemas.AIBudgetPredictResponse(
        predicted_total=round(predicted_total, 2),
        suggested_breakdown=breakdown,
        confidence_score=confidence
    )
