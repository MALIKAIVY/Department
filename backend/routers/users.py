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

