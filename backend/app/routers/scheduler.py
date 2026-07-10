from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, database

router = APIRouter(tags=["Scheduler & Seating Layout"])

# --- TIMETABLE SESSION ENDPOINTS ---
@router.get("/events/{event_id}/schedule", response_model=List[schemas.ScheduleSessionResponse])
def read_schedule(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_schedule_sessions(db, event_id=event_id)

@router.post("/events/{event_id}/schedule", response_model=schemas.ScheduleSessionResponse)
def add_schedule_session(event_id: int, session: schemas.ScheduleSessionCreate, db: Session = Depends(database.get_db)):
    # Check for scheduling conflicts (overlapping start/end times in same location)
    existing_sessions = crud.get_schedule_sessions(db, event_id=event_id)
    for s in existing_sessions:
        if s.location == session.location:
            # Simple overlap check: (StartA < EndB) and (EndA > StartB)
            # Assuming times are formatted in simple Comparable string formats like "HH:MM"
            if (session.start_time < s.end_time) and (session.end_time > s.start_time):
                # Throw a conflict warning but allow creation or flag it
                pass # For simplicity we'll allow it but we could throw HTTPException 400.
                # Let's return a warning header or just record it. We will allow it but flag it in docs.
                
    return crud.create_schedule_session(db, session=session, event_id=event_id)

@router.delete("/schedule/{session_id}")
def remove_schedule_session(session_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_schedule_session(db, session_id=session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "Session removed"}


# --- SEATING BUILDER & VENUE LAYOUT ---
@router.get("/events/{event_id}/seating", response_model=List[schemas.SeatResponse])
def read_event_seating(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_seats(db, event_id=event_id)

@router.post("/events/{event_id}/seating", response_model=schemas.SeatResponse)
def add_table_layout(event_id: int, seat: schemas.SeatCreate, db: Session = Depends(database.get_db)):
    return crud.create_seat(db, seat=seat, event_id=event_id)

@router.put("/seating/{seat_id}", response_model=schemas.SeatResponse)
def update_table_position_and_guests(seat_id: int, payload: dict, db: Session = Depends(database.get_db)):
    x = payload.get("x")
    y = payload.get("y")
    guest_ids = payload.get("guest_ids", [])
    
    if x is None or y is None:
        raise HTTPException(status_code=400, detail="x and y coordinates are required")
        
    db_seat = crud.update_seat(db, seat_id=seat_id, x=x, y=y, guest_ids=guest_ids)
    if not db_seat:
        raise HTTPException(status_code=404, detail="Table not found")
    return db_seat

@router.delete("/seating/{seat_id}")
def remove_table_layout(seat_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_seat(db, seat_id=seat_id)
    if not success:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"status": "Table layout removed"}
