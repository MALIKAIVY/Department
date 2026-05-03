from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
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

@router.get("/email/diagnostics")
async def get_email_diagnostics(current_user: models.Profile = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return email_utils.email_diagnostics()

@router.post("/email/test")
async def send_email_test(
    recipient: Optional[EmailStr] = None,
    current_user: models.Profile = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return await email_utils.send_test_email(str(recipient or current_user.email))

def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$%&*"
    return ''.join(secrets.choice(characters) for i in range(length))

async def ensure_unique_student_id(db: AsyncSession, student_id: str):
    result = await db.execute(select(models.Student).where(models.Student.student_id == student_id))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail=f"Student ID '{student_id}' already exists. Use a different student ID.")

async def ensure_unique_faculty_id(db: AsyncSession, faculty_id: str):
    result = await db.execute(select(models.Faculty).where(models.Faculty.faculty_id == faculty_id))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail=f"Faculty ID '{faculty_id}' already exists. Use a different faculty ID.")

async def ensure_unique_alumni_id(db: AsyncSession, alumni_id: str):
    result = await db.execute(select(models.Alumni).where(models.Alumni.alumni_id == alumni_id))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail=f"Alumni ID '{alumni_id}' already exists. Use a different alumni ID.")

async def generate_unique_student_id(db: AsyncSession):
    while True:
        student_id = f"STU-{uuid.uuid4().hex[:8].upper()}"
        result = await db.execute(select(models.Student).where(models.Student.student_id == student_id))
        if not result.scalars().first():
            return student_id

async def generate_unique_faculty_id(db: AsyncSession):
    while True:
        faculty_id = f"FAC-{uuid.uuid4().hex[:8].upper()}"
        result = await db.execute(select(models.Faculty).where(models.Faculty.faculty_id == faculty_id))
        if not result.scalars().first():
            return faculty_id

async def generate_unique_alumni_id(db: AsyncSession):
    while True:
        alumni_id = f"ALM-{uuid.uuid4().hex[:8].upper()}"
        result = await db.execute(select(models.Alumni).where(models.Alumni.alumni_id == alumni_id))
        if not result.scalars().first():
            return alumni_id

async def commit_or_duplicate_error(db: AsyncSession):
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        message = str(exc.orig)
        if "students_student_id_key" in message:
            detail = "That student ID already exists. Leave it blank to auto-generate one, or enter a unique student ID."
        elif "faculty_faculty_id_key" in message:
            detail = "That faculty ID already exists. Leave it blank to auto-generate one, or enter a unique faculty ID."
        elif "alumni_alumni_id_key" in message:
            detail = "That alumni ID already exists. Leave it blank to auto-generate one, or enter a unique alumni ID."
        elif "profiles_email_key" in message:
            detail = "That email address already exists."
        else:
            detail = "A duplicate unique value already exists. Please check the email or member ID and try again."
        raise HTTPException(status_code=400, detail=detail) from exc

@router.post("/students", response_model=List[schemas.ProfileBase])
async def create_students(
    payload: schemas.BulkStudentCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    created_profiles = []
    welcome_emails = []
    seen_student_ids = set()
    
    for student_in in payload.students:
        # Check if user exists
        result = await db.execute(select(models.Profile).filter(models.Profile.email == student_in.email))
        if result.scalars().first():
            continue # Skip existing emails or raise error? Skipping for bulk

        student_id = student_in.student_id or await generate_unique_student_id(db)
        if student_id in seen_student_ids:
            raise HTTPException(status_code=400, detail=f"Student ID '{student_id}' appears more than once in this upload.")
        await ensure_unique_student_id(db, student_id)
        seen_student_ids.add(student_id)
            
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
            student_id=student_id,
            graduation_year=student_in.graduation_year
        )
        db.add(student)
        created_profiles.append(new_profile)
        welcome_emails.append({
            "email": student_in.email,
            "full_name": student_in.full_name,
            "password": password,
            "role": "student",
        })
        
    await commit_or_duplicate_error(db)
    
    # Refresh to get all data
    created_ids = [profile.id for profile in created_profiles]
    if created_ids:
        result = await db.execute(
            select(models.Profile)
            .where(models.Profile.id.in_(created_ids))
            .options(
                joinedload(models.Profile.student),
                joinedload(models.Profile.faculty),
                joinedload(models.Profile.alumni),
            )
        )
        final_profiles = result.unique().scalars().all()
    else:
        final_profiles = []

    await email_utils.send_bulk_creation_emails(welcome_emails)
        
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
    welcome_emails = []
    seen_faculty_ids = set()

    for faculty_in in payload.faculty:
        result = await db.execute(select(models.Profile).filter(models.Profile.email == faculty_in.email))
        if result.scalars().first():
            continue

        faculty_id = faculty_in.faculty_id or await generate_unique_faculty_id(db)
        if faculty_id in seen_faculty_ids:
            raise HTTPException(status_code=400, detail=f"Faculty ID '{faculty_id}' appears more than once in this upload.")
        await ensure_unique_faculty_id(db, faculty_id)
        seen_faculty_ids.add(faculty_id)

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
            faculty_id=faculty_id,
            department=faculty_in.department,
            designation=faculty_in.designation,
        )
        db.add(faculty)
        created_profiles.append(new_profile)
        welcome_emails.append({
            "email": faculty_in.email,
            "full_name": faculty_in.full_name,
            "password": password,
            "role": "faculty",
        })

    await commit_or_duplicate_error(db)

    created_ids = [profile.id for profile in created_profiles]
    if created_ids:
        result = await db.execute(
            select(models.Profile)
            .where(models.Profile.id.in_(created_ids))
            .options(
                joinedload(models.Profile.student),
                joinedload(models.Profile.faculty),
                joinedload(models.Profile.alumni),
            )
        )
        final_profiles = result.unique().scalars().all()
    else:
        final_profiles = []

    await email_utils.send_bulk_creation_emails(welcome_emails)

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
        
    password = user_in.password or generate_random_password()
    hashed_pwd = security.get_password_hash(password)
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
        student_id = user_in.student_id or await generate_unique_student_id(db)
        await ensure_unique_student_id(db, student_id)
        student = models.Student(
            id=user_id,
            student_id=student_id,
            graduation_year=user_in.graduation_year or (datetime.utcnow().year + 4)
        )
        db.add(student)
    elif user_in.role == "faculty":
        faculty_id = user_in.faculty_id or await generate_unique_faculty_id(db)
        await ensure_unique_faculty_id(db, faculty_id)
        faculty = models.Faculty(
            id=user_id,
            faculty_id=faculty_id,
            department=user_in.department or "General Academics",
            designation=user_in.designation or "Lecturer"
        )
        db.add(faculty)
    elif user_in.role == "alumni":
        alumni_id = await generate_unique_alumni_id(db)
        await ensure_unique_alumni_id(db, alumni_id)
        alumni = models.Alumni(
            id=user_id,
            alumni_id=alumni_id,
            graduation_year=user_in.graduation_year or datetime.utcnow().year,
            degree_earned="Standard Degree"
        )
        db.add(alumni)
        
    await commit_or_duplicate_error(db)

    result = await db.execute(
        select(models.Profile)
        .where(models.Profile.id == user_id)
        .options(
            joinedload(models.Profile.student),
            joinedload(models.Profile.faculty),
            joinedload(models.Profile.alumni),
        )
    )
    created_profile = result.unique().scalar_one()

    # Send welcome email
    await email_utils.send_user_creation_email(
        email=user_in.email,
        full_name=user_in.full_name,
        password=password,
        role=user_in.role
    )
    
    return created_profile

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
