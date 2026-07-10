from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, database

router = APIRouter(tags=["Live Engagement & Feedback"])

# --- LIVE POLLS ---
@router.get("/events/{event_id}/polls", response_model=List[schemas.PollResponse])
def read_polls(event_id: int, db: Session = Depends(database.get_db)):
    polls = crud.get_polls(db, event_id=event_id)
    # Seed a default live poll if empty
    if not polls:
        default_poll = schemas.PollCreate(
            question="What session are you most excited about today?",
            options=["AI Architecture Keynote", "React Server Components Deep-Dive", "Interactive Canvas Seating Panel", "Networking Cocktail Mixer"],
            is_active=True
        )
        crud.create_poll(db, poll=default_poll, event_id=event_id)
        polls = crud.get_polls(db, event_id=event_id)
    return polls

@router.post("/events/{event_id}/polls", response_model=schemas.PollResponse)
def add_new_poll(event_id: int, poll: schemas.PollCreate, db: Session = Depends(database.get_db)):
    return crud.create_poll(db, poll=poll, event_id=event_id)

@router.post("/polls/{poll_id}/vote", response_model=schemas.PollResponse)
def cast_poll_vote(poll_id: int, vote: schemas.PollVote, db: Session = Depends(database.get_db)):
    db_poll = crud.vote_poll(db, poll_id=poll_id, option_index=vote.option_index)
    if not db_poll:
        raise HTTPException(status_code=400, detail="Poll is closed or invalid option index")
    return db_poll


# --- LIVE Q&A ---
@router.get("/events/{event_id}/questions", response_model=List[schemas.QuestionResponse])
def read_questions(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_questions(db, event_id=event_id)

@router.post("/events/{event_id}/questions", response_model=schemas.QuestionResponse)
def submit_question(event_id: int, question: schemas.QuestionCreate, db: Session = Depends(database.get_db)):
    return crud.create_question(db, question=question, event_id=event_id)

@router.post("/questions/{question_id}/upvote", response_model=schemas.QuestionResponse)
def upvote_guest_question(question_id: int, db: Session = Depends(database.get_db)):
    db_question = crud.upvote_question(db, question_id=question_id)
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question

@router.post("/questions/{question_id}/answer", response_model=schemas.QuestionResponse)
def mark_question_answered(question_id: int, db: Session = Depends(database.get_db)):
    db_question = crud.answer_question(db, question_id=question_id)
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question


# --- FEEDBACK & SENTIMENT ---
@router.get("/events/{event_id}/feedback", response_model=List[schemas.FeedbackResponse])
def read_feedback(event_id: int, db: Session = Depends(database.get_db)):
    return crud.get_feedbacks(db, event_id=event_id)

@router.post("/events/{event_id}/feedback", response_model=schemas.FeedbackResponse)
def submit_feedback(event_id: int, feedback: schemas.FeedbackCreate, db: Session = Depends(database.get_db)):
    return crud.create_feedback(db, feedback=feedback, event_id=event_id)
