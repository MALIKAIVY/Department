from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import schemas, models, database
from core import security
from core.security import get_current_user
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_FAILED_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 30

def auth_user_payload(user: models.Profile):
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "is_active": user.is_active,
        "consent_given": bool(user.consent_given),
        "consent_timestamp": user.consent_timestamp,
        "is_first_login": bool(user.is_first_login),
        "last_login": user.last_login,
        "created_at": user.created_at,
    }

@router.post("/register", response_model=schemas.Token)
async def register(user_in: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    # Check if user exists
    result = await db.execute(select(models.Profile).filter(models.Profile.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = security.get_password_hash(user_in.password)
    user_id = uuid.uuid4()
    
    user = models.Profile(
        id=user_id,
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role,
        is_first_login=True
    )
    db.add(user)
    
    if user_in.role == "student":
        student = models.Student(
            id=user_id,
            student_id=user_in.student_id or str(uuid.uuid4())[:8],
            year_of_study=user_in.year_of_study,
            graduation_year=user_in.graduation_year
        )
        db.add(student)
    elif user_in.role == "faculty":
        faculty = models.Faculty(
            id=user_id,
            faculty_id=user_in.faculty_id or str(uuid.uuid4())[:8],
            department=user_in.department or "General",
            designation=user_in.designation or "Lecturer"
        )
        db.add(faculty)
    elif user_in.role == "alumni":
        alumni = models.Alumni(
            id=user_id,
            alumni_id=user_in.alumni_id or str(uuid.uuid4())[:8],
            graduation_year=user_in.graduation_year or datetime.now().year,
            degree_earned=user_in.degree_earned or "Degree"
        )
        db.add(alumni)
        
    await db.commit()
    await db.refresh(user)
    
    access_token = security.create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": auth_user_payload(user)
    }

@router.post("/login", response_model=schemas.Token)
async def login(user_in: schemas.UserLogin, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Profile).filter(models.Profile.email == user_in.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User is inactive")
        
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(status_code=400, detail="Account is locked. Try again later.")
        
    if not security.verify_password(user_in.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
        await db.commit()
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    await db.commit()
    
    access_token = security.create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": auth_user_payload(user)
    }

@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(payload_in: schemas.RefreshRequest, db: AsyncSession = Depends(database.get_db)):
    try:
        payload = jwt.decode(payload_in.refresh_token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    result = await db.execute(select(models.Profile).filter(models.Profile.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
        
    access_token = security.create_access_token(data={"sub": str(user.id), "role": user.role})
    new_refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": auth_user_payload(user)
    }

@router.get("/me", response_model=schemas.ProfileOut)
async def read_users_me(current_user: models.Profile = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
async def change_password(
    payload: schemas.PasswordChange,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if not security.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = security.get_password_hash(payload.new_password)
    current_user.is_first_login = False
    await db.commit()
    return {"detail": "Password updated"}

@router.post("/logout")
async def logout():
    return {"detail": "Successfully logged out"}
