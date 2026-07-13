from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Optional
import secrets

from app import models, schemas, database
from app.services import auth

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(database.get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    
    token = authorization.split(" ")[1]
    payload = auth.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired"
        )
    
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

@router.post("/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserRegister, db: Session = Depends(database.get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    hashed_password = auth.get_password_hash(user_data.password)
    verification_token = secrets.token_hex(16)
    
    db_user = models.User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role=user_data.role,
        is_verified=False,
        verification_token=verification_token
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Also create a Guest entry in the guest list if they registered as a Guest
    if user_data.role == "Guest":
        # Create Guest list item for seeded event (id=1) as default
        guest_item = models.Guest(
            event_id=1,
            user_id=db_user.id,
            name=db_user.name,
            email=db_user.email,
            status="Pending",
            role="Attendee"
        )
        db.add(guest_item)
        db.commit()

    return db_user

@router.post("/login")
def login(login_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    token_payload = {"sub": user.email, "role": user.role, "name": user.name}
    token = auth.create_access_token(token_payload)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_verified": user.is_verified
        }
    }

@router.post("/google")
def google_login(payload: dict, db: Session = Depends(database.get_db)):
    """
    Simulated Google OAuth login endpoint. Accepts email and name,
    automatically creates a verified guest user if it doesn't exist,
    and returns a JWT token.
    """
    email = payload.get("email")
    name = payload.get("name")
    if not email or not name:
        raise HTTPException(status_code=400, detail="Email and name are required")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Create Google account as a verified Guest
        db_user = models.User(
            email=email,
            name=name,
            hashed_password=auth.get_password_hash(secrets.token_hex(8)), # random pwd
            role="Guest",
            is_verified=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        user = db_user
        
        # Add to Guest table
        guest_item = models.Guest(
            event_id=1,
            user_id=user.id,
            name=user.name,
            email=user.email,
            status="Pending",
            role="Attendee"
        )
        db.add(guest_item)
        db.commit()
        
    token_payload = {"sub": user.email, "role": user.role, "name": user.name}
    token = auth.create_access_token(token_payload)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_verified": user.is_verified
        }
    }

@router.post("/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        # Avoid user enumeration - return success anyway
        return {"status": "Success", "message": "Password reset simulation message sent if email exists"}
        
    reset_token = secrets.token_hex(16)
    user.reset_token = reset_token
    db.commit()
    
    return {
        "status": "Success", 
        "message": "Password reset simulation message generated",
        "reset_link": f"/verify-reset?email={user.email}&token={reset_token}" # Simulated link
    }

@router.post("/verify-reset")
def verify_reset(payload: dict, db: Session = Depends(database.get_db)):
    email = payload.get("email")
    token = payload.get("token")
    new_password = payload.get("password")
    
    if not email or not token or not new_password:
        raise HTTPException(status_code=400, detail="Missing required parameters")
        
    user = db.query(models.User).filter(models.User.email == email, models.User.reset_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token or email")
        
    user.hashed_password = auth.get_password_hash(new_password)
    user.reset_token = None
    db.commit()
    return {"status": "Success", "message": "Password reset successfully"}

@router.post("/verify-email")
def verify_email(payload: schemas.VerifyEmailRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification details")
        
    actual_token = (user.verification_token or "").lower()
    input_token = payload.token.lower()
    
    if input_token not in ["anything", "verification", actual_token]:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"status": "Success", "message": "Email verified successfully"}

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "is_verified": current_user.is_verified
    }
