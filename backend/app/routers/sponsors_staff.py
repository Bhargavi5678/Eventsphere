from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, database
from app.services.pdf_badge import generate_svg_certificate

router = APIRouter(tags=["Sponsors, Staff & Certificates"])

# --- SPONSORSHIP MANAGEMENT ---
@router.get("/events/{event_id}/sponsors", response_model=List[schemas.SponsorResponse])
def read_sponsors(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_sponsors(db, event_id=event_id)

@router.post("/events/{event_id}/sponsors", response_model=schemas.SponsorResponse)
def add_sponsor(event_id: int, sponsor: schemas.SponsorCreate, db: Session = Depends(database.get_db)):
    return crud.create_sponsor(db, sponsor=sponsor, event_id=event_id)

@router.delete("/sponsors/{sponsor_id}")
def remove_sponsor(sponsor_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_sponsor(db, sponsor_id=sponsor_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    return {"status": "Sponsor deleted"}


# --- STAFF MANAGEMENT ---
@router.get("/events/{event_id}/staff", response_model=List[schemas.StaffMemberResponse])
def read_staff(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_staff_members(db, event_id=event_id)

@router.post("/events/{event_id}/staff", response_model=schemas.StaffMemberResponse)
def add_staff_member(event_id: int, staff: schemas.StaffMemberCreate, db: Session = Depends(database.get_db)):
    return crud.create_staff_member(db, staff=staff, event_id=event_id)

@router.delete("/staff/{staff_id}")
def remove_staff_member(staff_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_staff_member(db, staff_id=staff_id)
    if not success:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return {"status": "Staff member removed"}


# --- CERTIFICATE GENERATION ---
@router.get("/events/{event_id}/certificates/generate")
def generate_guest_certificate(event_id: int, guest_name: str, db: Session = Depends(database.get_db)):
    event = crud.get_event(db, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    svg_certificate = generate_svg_certificate(
        guest_name=guest_name,
        event_title=event.title,
        date_str=event.date
    )
    
    return Response(
        content=svg_certificate,
        media_type="image/svg+xml"
    )
