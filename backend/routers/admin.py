from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
import schemas, models, database
from core import security, email as email_utils
from core.security import get_current_user
import uuid
import secrets
import string
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/admin", tags=["admin"])

def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(characters) for i in range(length))

@router.post("/students", response_model=List[schemas.ProfileBase])
async def create_students(
    payload: schemas.BulkStudentCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    created_profiles = []
    
    for student_in in payload.students:
        # Check if user exists
        result = await db.execute(select(models.Profile).filter(models.Profile.email == student_in.email))
        if result.scalars().first():
            continue # Skip existing emails or raise error? Skipping for bulk
            
        password = student_in.password or generate_random_password()
        hashed_pwd = security.get_password_hash(password)
        user_id = uuid.uuid4()
        
        new_profile = models.Profile(
            id=user_id,
            email=student_in.email,
            hashed_password=hashed_pwd,
            full_name=student_in.full_name,
            role="student",
            consent_given=False,
            is_first_login=True,
        )
        db.add(new_profile)
        
        student = models.Student(
            id=user_id,
            student_id=student_in.student_id,
            graduation_year=student_in.graduation_year
        )
        db.add(student)
        created_profiles.append(new_profile)
        
        # Send welcome email
        await email_utils.send_user_creation_email(
            email=student_in.email,
            full_name=student_in.full_name,
            password=student_in.password,
            role="student"
        )
        
    await db.commit()
    
    # Refresh to get all data
    final_profiles = []
    for p in created_profiles:
        await db.refresh(p)
        final_profiles.append(p)
        
    return final_profiles

@router.post("/faculty", response_model=List[schemas.ProfileBase])
async def create_faculty(
    payload: schemas.BulkFacultyCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    created_profiles = []

    for faculty_in in payload.faculty:
        result = await db.execute(select(models.Profile).filter(models.Profile.email == faculty_in.email))
        if result.scalars().first():
            continue

        password = faculty_in.password or generate_random_password()
        hashed_pwd = security.get_password_hash(password)
        user_id = uuid.uuid4()

        new_profile = models.Profile(
            id=user_id,
            email=faculty_in.email,
            hashed_password=hashed_pwd,
            full_name=faculty_in.full_name,
            role="faculty",
            consent_given=False,
            is_first_login=True,
        )
        db.add(new_profile)

        faculty = models.Faculty(
            id=user_id,
            faculty_id=faculty_in.faculty_id,
            department=faculty_in.department,
            designation=faculty_in.designation,
        )
        db.add(faculty)
        created_profiles.append(new_profile)

        # Send welcome email
        await email_utils.send_user_creation_email(
            email=faculty_in.email,
            full_name=faculty_in.full_name,
            password=faculty_in.password,
            role="faculty"
        )

    await db.commit()

    final_profiles = []
    for profile in created_profiles:
        await db.refresh(profile)
        final_profiles.append(profile)

    return final_profiles

@router.post("/users", response_model=schemas.ProfileOut)
async def create_user(
    user_in: schemas.ProfileCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Check for existing user
    result = await db.execute(select(models.Profile).where(models.Profile.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail=f"User with email '{user_in.email}' already exists.")
        
    if not user_in.password:
        raise HTTPException(status_code=400, detail="Password is required for manual account creation.")
        
    hashed_pwd = security.get_password_hash(user_in.password)
    user_id = uuid.uuid4()
    
    new_profile = models.Profile(
        id=user_id,
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role,
        consent_given=False,
        is_first_login=True,
    )
    db.add(new_profile)
    
    if user_in.role == "student":
        student_id = user_in.student_id or f"STU-{uuid.uuid4().hex[:6].upper()}"
        student = models.Student(
            id=user_id,
            student_id=student_id,
            graduation_year=user_in.graduation_year or (datetime.utcnow().year + 4)
        )
        db.add(student)
    elif user_in.role == "faculty":
        faculty_id = user_in.faculty_id or f"FAC-{uuid.uuid4().hex[:6].upper()}"
        faculty = models.Faculty(
            id=user_id,
            faculty_id=faculty_id,
            department=user_in.department or "General Academics",
            designation=user_in.designation or "Lecturer"
        )
        db.add(faculty)
    elif user_in.role == "alumni":
        alumni_id = f"ALM-{uuid.uuid4().hex[:6].upper()}"
        alumni = models.Alumni(
            id=user_id,
            alumni_id=alumni_id,
            graduation_year=user_in.graduation_year or datetime.utcnow().year,
            degree_earned="Standard Degree"
        )
        db.add(alumni)
        
    await db.commit()
    await db.refresh(new_profile)

    # Send welcome email
    await email_utils.send_user_creation_email(
        email=user_in.email,
        full_name=user_in.full_name,
        password=user_in.password,
        role=user_in.role
    )
    
    return new_profile

@router.post("/events", response_model=schemas.PublicEventOut)
async def create_public_event(
    payload: schemas.PublicEventCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    event = models.PublicEvent(
        id=uuid.uuid4(),
        title=payload.title,
        event_date=payload.event_date,
        location=payload.location,
        description=payload.description,
        is_published=payload.is_published,
        created_by=current_user.id,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event

@router.get("/users", response_model=List[schemas.ProfileOut])
async def get_all_users(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    stmt = select(models.Profile).options(
        joinedload(models.Profile.student),
        joinedload(models.Profile.faculty),
        joinedload(models.Profile.alumni)
    ).order_by(models.Profile.created_at.desc())
    
    result = await db.execute(stmt)
    return result.unique().scalars().all()

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    result = await db.execute(select(models.Profile).filter(models.Profile.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user)
    await db.commit()
    return {"detail": "User deleted"}

@router.patch("/users/{user_id}/role", response_model=schemas.ProfileOut)
async def update_user_role(
    user_id: uuid.UUID,
    role_update: schemas.RoleUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(models.Profile).filter(models.Profile.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = role_update.role
    await db.commit()
    await db.refresh(user)
    return user
