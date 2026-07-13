from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, database
from app.services.calendar import generate_ics_content

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("/", response_model=List[schemas.EventResponse])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_events(db, skip=skip, limit=limit)

@router.get("/{event_id}", response_model=schemas.EventResponse)
def read_event(event_id: int, db: Session = Depends(database.get_db)):
    db_event = crud.get_event(db, event_id=event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@router.get("/slug/{slug}", response_model=schemas.EventResponse)
def read_event_by_slug(slug: str, db: Session = Depends(database.get_db)):
    db_event = crud.get_event_by_slug(db, slug=slug)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event page not found")
    return db_event

@router.post("/", response_model=schemas.EventResponse)
def create_new_event(event: schemas.EventCreate, db: Session = Depends(database.get_db)):
    return crud.create_event(db=db, event=event)

@router.put("/{event_id}", response_model=schemas.EventResponse)
def update_event_details(event_id: int, event: schemas.EventUpdate, db: Session = Depends(database.get_db)):
    db_event = crud.update_event(db=db, event_id=event_id, event_update=event)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@router.delete("/{event_id}")
def delete_event_by_id(event_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_event(db=db, event_id=event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "Event deleted successfully"}

@router.post("/{event_id}/duplicate", response_model=schemas.EventResponse)
def duplicate_existing_event(event_id: int, db: Session = Depends(database.get_db)):
    db_event = crud.duplicate_event(db, event_id=event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@router.post("/{event_id}/publish", response_model=schemas.EventResponse)
def publish_event(event_id: int, db: Session = Depends(database.get_db)):
    db_event = crud.update_event(db=db, event_id=event_id, event_update=schemas.EventUpdate(status="Published"))
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@router.post("/{event_id}/cancel", response_model=schemas.EventResponse)
def cancel_event(event_id: int, db: Session = Depends(database.get_db)):
    db_event = crud.update_event(db=db, event_id=event_id, event_update=schemas.EventUpdate(status="Cancelled"))
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

# --- CALENDAR SYNC (ICS Export) ---
@router.get("/{event_id}/ics")
def get_event_ics_file(event_id: int, db: Session = Depends(database.get_db)):
    db_event = crud.get_event(db, event_id=event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    ics_text = generate_ics_content(
        event_title=db_event.title,
        event_desc=db_event.description,
        event_date_str=db_event.date,
        location=db_event.location
    )
    
    filename = f"event-{event_id}.ics"
    return Response(
        content=ics_text,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
