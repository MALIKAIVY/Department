from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import schemas, models, database
from core import security
from core.security import get_current_user
import uuid
from datetime import datetime
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.Token)
async def register(user_in: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    # Check if user exists
    result = await db.execute(select(models.Profile).filter(models.Profile.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = security.get_password_hash(user_in.password)
    user_id = uuid.uuid4()
    
    try:
        new_profile = models.Profile(
            id=user_id,
            email=user_in.email,
            hashed_password=hashed_pwd,
            full_name=user_in.full_name,
            role=user_in.role
        )
        db.add(new_profile)
        
        if user_in.role == "student":
            student = models.Student(
                id=user_id,
                student_id=user_in.student_id or f"STU-{str(user_id)[:8].upper()}",
                graduation_year=user_in.graduation_year or (datetime.now().year + 4)
            )
            db.add(student)
        elif user_in.role == "faculty":
            faculty = models.Faculty(
                id=user_id,
                faculty_id=user_in.faculty_id or f"FAC-{str(user_id)[:8].upper()}",
                department=user_in.department or "Technology Department",
                designation="Faculty Member"
            )
            db.add(faculty)
        elif user_in.role == "alumni":
            alumni = models.Alumni(
                id=user_id,
                alumni_id=user_in.alumni_id or f"ALM-{str(user_id)[:8].upper()}",
                graduation_year=user_in.graduation_year or datetime.now().year,
                degree_earned="BSc Technology"
            )
            db.add(alumni)
            
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    access_token = security.create_access_token(data={"sub": str(user_id), "role": user_in.role})
    refresh_token = security.create_refresh_token(data={"sub": str(user_id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user_id),
            "email": user_in.email,
            "role": user_in.role,
            "full_name": user_in.full_name
        }
    }

@router.post("/login", response_model=schemas.Token)
async def login(user_in: schemas.UserLogin, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Profile).filter(models.Profile.email == user_in.email))
    user = result.scalars().first()
    
    if not user or not security.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is suspended")
        
    access_token = security.create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    }

@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(database.get_db)):
    try:
        payload = jwt.decode(refresh_token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
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
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    }

@router.get("/me", response_model=schemas.ProfileBase)
async def read_users_me(current_user: models.Profile = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout():
    # In JWT, logout is usually handled on frontend by clearing tokens.
    # We could implement a blacklist here if needed.
    return {"detail": "Successfully logged out"}

