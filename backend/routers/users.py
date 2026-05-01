from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_, func
from sqlalchemy.orm import joinedload
from typing import List, Optional
import schemas, models, database
from core.security import get_current_user
import uuid
from datetime import datetime
import os

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/public/overview")
async def get_public_overview(db: AsyncSession = Depends(database.get_db)):
    student_count = (await db.execute(
        select(func.count(models.Profile.id)).where(models.Profile.role == "student", models.Profile.is_active == True)
    )).scalar() or 0
    alumni_count = (await db.execute(
        select(func.count(models.Profile.id)).where(models.Profile.role == "alumni", models.Profile.is_active == True)
    )).scalar() or 0
    faculty_count = (await db.execute(
        select(func.count(models.Profile.id)).where(models.Profile.role == "faculty", models.Profile.is_active == True)
    )).scalar() or 0

    faculty_stmt = (
        select(models.Profile)
        .join(models.Faculty)
        .where(models.Profile.role == "faculty", models.Profile.is_active == True)
        .options(joinedload(models.Profile.faculty))
        .order_by(models.Profile.full_name.asc())
        .limit(12)
    )
    faculty_result = await db.execute(faculty_stmt)
    faculty = []
    for member in faculty_result.unique().scalars().all():
        faculty.append({
            "id": member.id,
            "full_name": member.full_name,
            "avatar_url": member.avatar_url,
            "email": member.email,
            "designation": member.faculty.designation if member.faculty else "Faculty Member",
            "department": member.faculty.department if member.faculty else "Department of Technology",
        })

    events_stmt = (
        select(models.PublicEvent)
        .where(models.PublicEvent.is_published == True)
        .order_by(models.PublicEvent.created_at.desc())
        .limit(6)
    )
    events_result = await db.execute(events_stmt)
    events = [
        {
            "id": event.id,
            "title": event.title,
            "date": event.event_date,
            "location": event.location,
            "description": event.description,
        }
        for event in events_result.scalars().all()
    ]

    return {
        "stats": {
            "students": student_count,
            "alumni": alumni_count,
            "faculty": faculty_count,
        },
        "faculty": faculty,
        "events": events,
    }

@router.get("/me", response_model=schemas.ProfileBase)
async def get_my_profile(
    current_user: models.Profile = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    stmt = select(models.Profile).where(models.Profile.id == current_user.id).options(
        joinedload(models.Profile.student),
        joinedload(models.Profile.faculty),
        joinedload(models.Profile.alumni)
    )
    result = await db.execute(stmt)
    return result.unique().scalars().first()

@router.put("/me", response_model=schemas.ProfileBase)
async def update_my_profile(
    updates: schemas.ProfileUpdate,
    current_user: models.Profile = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    # Update base profile fields
    if updates.full_name:
        current_user.full_name = updates.full_name
    if updates.bio:
        current_user.bio = updates.bio
    if updates.phone:
        current_user.phone = updates.phone
    if updates.avatar_url:
        current_user.avatar_url = updates.avatar_url
        
    # Update role-specific fields
    if current_user.role == "student" and updates.student:
        stmt = select(models.Student).where(models.Student.id == current_user.id)
        res = await db.execute(stmt)
        student = res.scalars().first()
        if student:
            for k, v in updates.student.items():
                if hasattr(student, k):
                    setattr(student, k, v)
                    
    elif current_user.role == "faculty" and updates.faculty:
        stmt = select(models.Faculty).where(models.Faculty.id == current_user.id)
        res = await db.execute(stmt)
        faculty = res.scalars().first()
        if faculty:
            for k, v in updates.faculty.items():
                if hasattr(faculty, k):
                    setattr(faculty, k, v)
                    
    elif current_user.role == "alumni" and updates.alumni:
        stmt = select(models.Alumni).where(models.Alumni.id == current_user.id)
        res = await db.execute(stmt)
        alumni = res.scalars().first()
        if alumni:
            for k, v in updates.alumni.items():
                if hasattr(alumni, k):
                    setattr(alumni, k, v)
                    
    await db.commit()
    
    # Reload with relations
    stmt = select(models.Profile).where(models.Profile.id == current_user.id).options(
        joinedload(models.Profile.student),
        joinedload(models.Profile.faculty),
        joinedload(models.Profile.alumni)
    )
    result = await db.execute(stmt)
    return result.unique().scalars().first()

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.Profile = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images allowed")
    
    # Validate file size (5MB)
    MAX_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (Max 5MB)")
    
    # Save locally
    upload_dir = "uploads/avatars"
    os.makedirs(upload_dir, exist_ok=True)
    file_ext = file.filename.split(".")[-1]
    file_name = f"{current_user.id}.{file_ext}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    # Update DB
    url = f"/uploads/avatars/{file_name}"
    current_user.avatar_url = url
    await db.commit()
    
    return {"url": url}

@router.get("/search", response_model=List[schemas.ProfileBase])
async def search_profiles(
    q: str,
    role: Optional[str] = None,
    db: AsyncSession = Depends(database.get_db)
):
    stmt = select(models.Profile).where(
        or_(
            models.Profile.full_name.ilike(f"%{q}%"),
            models.Profile.email.ilike(f"%{q}%")
        ),
        models.Profile.is_active == True
    ).options(
        joinedload(models.Profile.student),
        joinedload(models.Profile.faculty),
        joinedload(models.Profile.alumni)
    )
    
    if role:
        stmt = stmt.where(models.Profile.role == role)
        
    result = await db.execute(stmt)
    return result.unique().scalars().all()

@router.get("/stats", response_model=schemas.DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    # Total Users
    total_users_stmt = select(func.count(models.Profile.id))
    total_users = (await db.execute(total_users_stmt)).scalar() or 0
    
    # Role counts
    student_count_stmt = select(func.count(models.Profile.id)).where(models.Profile.role == "student")
    student_count = (await db.execute(student_count_stmt)).scalar() or 0
    
    faculty_count_stmt = select(func.count(models.Profile.id)).where(models.Profile.role == "faculty")
    faculty_count = (await db.execute(faculty_count_stmt)).scalar() or 0
    
    alumni_count_stmt = select(func.count(models.Profile.id)).where(models.Profile.role == "alumni")
    alumni_count = (await db.execute(alumni_count_stmt)).scalar() or 0
    
    admin_count_stmt = select(func.count(models.Profile.id)).where(models.Profile.role == "admin")
    admin_count = (await db.execute(admin_count_stmt)).scalar() or 0
    
    # Total Yearbook Entries
    total_entries_stmt = select(func.count(models.YearbookEntry.id))
    total_entries = (await db.execute(total_entries_stmt)).scalar() or 0
    
    # Pending Entries
    pending_entries_stmt = select(func.count(models.YearbookEntry.id)).where(models.YearbookEntry.status == "pending")
    pending_entries = (await db.execute(pending_entries_stmt)).scalar() or 0
    
    # Pending Memories
    pending_memories_stmt = select(func.count(models.MemorySubmission.id)).where(models.MemorySubmission.status == "pending")
    pending_memories = (await db.execute(pending_memories_stmt)).scalar() or 0
    
    # Active Connections
    active_conn_stmt = select(func.count(models.Connection.id)).where(models.Connection.status == "accepted")
    active_connections = (await db.execute(active_conn_stmt)).scalar() or 0
    
    return {
        "totalUsers": total_users,
        "studentCount": student_count,
        "facultyCount": faculty_count,
        "alumniCount": alumni_count,
        "adminCount": admin_count,
        "totalYearbookEntries": total_entries,
        "pendingEntries": pending_entries,
        "pendingMemories": pending_memories,
        "userConnections": active_connections
    }

@router.get("/alumni", response_model=List[schemas.ProfileBase])
async def list_alumni(
    graduation_year: Optional[int] = None,
    industry: Optional[str] = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = (
        select(models.Profile)
        .join(models.Alumni)
        .where(
            models.Profile.role == "alumni",
            models.Profile.is_active == True,
            models.Alumni.is_visible == True,
        )
        .options(
            joinedload(models.Profile.student),
            joinedload(models.Profile.faculty),
            joinedload(models.Profile.alumni),
        )
        .order_by(models.Profile.full_name.asc())
    )

    if graduation_year:
        stmt = stmt.where(models.Alumni.graduation_year == graduation_year)
    if industry:
        stmt = stmt.where(models.Alumni.industry == industry)

    result = await db.execute(stmt)
    return result.unique().scalars().all()

@router.post("/graduate", response_model=schemas.GraduationResult)
async def graduate_students(
    payload: schemas.GraduationRequest,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    graduation_year = datetime.utcnow().year

    final_year_stmt = (
        select(models.Student)
        .join(models.Profile)
        .where(
            models.Profile.role == "student",
            models.Profile.is_active == True,
        )
    )

    if payload.year_of_study is not None:
        final_year_stmt = final_year_stmt.where(models.Student.year_of_study == payload.year_of_study)
    elif payload.graduation_year is not None:
        final_year_stmt = final_year_stmt.where(models.Student.graduation_year == payload.graduation_year)
    else:
        raise HTTPException(status_code=400, detail="Either year_of_study or graduation_year must be provided")

    final_year_stmt = final_year_stmt.options(joinedload(models.Student.profile))
    final_year_result = await db.execute(final_year_stmt)
    final_year_students = final_year_result.unique().scalars().all()

    transitioned = 0
    for student in final_year_students:
        profile = student.profile
        if not profile:
            continue

        alumni_result = await db.execute(select(models.Alumni).where(models.Alumni.id == profile.id))
        alumni = alumni_result.scalars().first()
        if not alumni:
            alumni = models.Alumni(
                id=profile.id,
                alumni_id=f"ALM-{student.student_id}",
                graduation_year=student.graduation_year or graduation_year,
                degree_earned="BSc Technology",
                linkedin_url=student.linkedin_url,
                github_url=student.github_url,
                portfolio_url=student.portfolio_url,
            )
            db.add(alumni)
        else:
            alumni.graduation_year = alumni.graduation_year or student.graduation_year or graduation_year

        profile.role = "alumni"
        transitioned += 1

    # Advance students
    advance_stmt = (
        select(models.Student)
        .join(models.Profile)
        .where(
            models.Profile.role == "student",
            models.Profile.is_active == True,
            models.Student.year_of_study.is_not(None),
        )
    )

    # If we have a year of study to graduate, advance everyone below it
    if payload.year_of_study is not None:
        advance_stmt = advance_stmt.where(models.Student.year_of_study < payload.year_of_study)
    
    advance_result = await db.execute(advance_stmt)
    continuing_students = advance_result.unique().scalars().all()

    advanced = 0
    for student in continuing_students:
        student.year_of_study += 1
        advanced += 1

    db.add(models.ActivityLog(
        user_id=current_user.id,
        action="academic_year_transition",
        entity_type="student",
        entity_id=current_user.id,
    ))
    await db.commit()

    return {
        "transitioned": transitioned,
        "advanced": advanced,
        "graduation_year": graduation_year,
    }

@router.get("/{user_id}", response_model=schemas.ProfileBase)
async def get_public_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db)
):
    stmt = select(models.Profile).where(
        models.Profile.id == user_id,
        models.Profile.is_active == True
    ).options(
        joinedload(models.Profile.student),
        joinedload(models.Profile.faculty),
        joinedload(models.Profile.alumni)
    )
    result = await db.execute(stmt)
    user = result.unique().scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
