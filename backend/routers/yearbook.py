from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, desc
from sqlalchemy.orm import joinedload
from typing import List, Optional
import datetime
import schemas, models, database
from core.security import get_current_user
import uuid
import os

router = APIRouter(prefix="/yearbook", tags=["yearbook"])

ALLOWED_MEDIA_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}
MAX_MEDIA_SIZE = 50 * 1024 * 1024

@router.get("/", response_model=List[schemas.YearbookEntryOut])
async def get_yearbook_entries(
    academic_year: Optional[str] = None,
    role: Optional[str] = None,
    skip: int = 0, limit: int = 100, 
    db: AsyncSession = Depends(database.get_db)
):
    stmt = select(models.YearbookEntry).where(models.YearbookEntry.status == "approved").options(
        joinedload(models.YearbookEntry.author)
    ).order_by(desc(models.YearbookEntry.created_at)).offset(skip).limit(limit)
    
    if academic_year:
        stmt = stmt.where(models.YearbookEntry.academic_year == academic_year)
    
    result = await db.execute(stmt)
    entries = result.unique().scalars().all()
    
    # Enrichment
    out = []
    for entry in entries:
        if role and entry.author.role != role:
            continue
        item = schemas.YearbookEntryOut.model_validate(entry)
        item.author_name = entry.author.full_name
        item.profile_image_url = entry.profile_image_url or entry.author.avatar_url
        out.append(item)
    return out

@router.get("/pending", response_model=List[schemas.YearbookEntryOut])
async def get_pending_entries(
    skip: int = 0, limit: int = 20, 
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Faculty/Admin only")
        
    stmt = select(models.YearbookEntry).where(models.YearbookEntry.status == "pending").options(
        joinedload(models.YearbookEntry.author)
    ).order_by(desc(models.YearbookEntry.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    entries = result.unique().scalars().all()
    
    out = []
    for entry in entries:
        item = schemas.YearbookEntryOut.model_validate(entry)
        item.author_name = entry.author.full_name
        out.append(item)
    return out

@router.get("/me", response_model=Optional[schemas.YearbookEntryOut])
async def get_my_entry(
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = select(models.YearbookEntry).where(models.YearbookEntry.user_id == current_user.id)
    result = await db.execute(stmt)
    entry = result.scalars().first()
    if entry:
        return schemas.YearbookEntryOut.model_validate(entry)
    return None

@router.post("/media")
async def upload_yearbook_media(
    file: UploadFile = File(...),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")

    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WebP, MP4, WebM, or MOV files are allowed")

    content = await file.read()
    if len(content) > MAX_MEDIA_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB")

    upload_dir = os.path.join("uploads", "yearbook")
    os.makedirs(upload_dir, exist_ok=True)

    extension = ALLOWED_MEDIA_TYPES[file.content_type]
    file_name = f"{current_user.id}-{uuid.uuid4()}{extension}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as media_file:
        media_file.write(content)

    return {
        "url": f"/uploads/yearbook/{file_name}",
        "media_type": "video" if file.content_type.startswith("video/") else "image",
    }

@router.post("/", response_model=schemas.YearbookEntryOut)
async def submit_yearbook(
    entry_in: schemas.YearbookCreate,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    # Check for existing entry for this academic year
    stmt = select(models.YearbookEntry).where(
        and_(
            models.YearbookEntry.user_id == current_user.id,
            models.YearbookEntry.academic_year == entry_in.academic_year
        )
    )
    result = await db.execute(stmt)
    if result.scalars().first():
        # Feature 23: Allow editing if still pending? 
        # The requirements say "Student can edit their own pending entry"
        raise HTTPException(status_code=400, detail="Entry for this year already exists. Use PUT to edit.")
        
    new_entry = models.YearbookEntry(
        user_id=current_user.id,
        academic_year=entry_in.academic_year,
        yearbook_quote=entry_in.yearbook_quote,
        favorite_memory=entry_in.favorite_memory,
        future_plans=entry_in.future_plans,
        profile_image_url=entry_in.profile_image_url,
        status="pending"
    )
    db.add(new_entry)
    await db.commit()
    return schemas.YearbookEntryOut.model_validate(new_entry)

@router.put("/{entry_id}", response_model=schemas.YearbookEntryOut)
async def edit_my_entry(
    entry_id: uuid.UUID,
    entry_in: schemas.YearbookCreate,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = select(models.YearbookEntry).where(models.YearbookEntry.id == entry_id)
    result = await db.execute(stmt)
    entry = result.scalars().first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if entry.status != "pending":
        raise HTTPException(status_code=400, detail="Cannot edit approved/rejected entry")
        
    entry.academic_year = entry_in.academic_year
    entry.yearbook_quote = entry_in.yearbook_quote
    entry.favorite_memory = entry_in.favorite_memory
    entry.future_plans = entry_in.future_plans
    entry.profile_image_url = entry_in.profile_image_url
    
    await db.commit()
    return schemas.YearbookEntryOut.model_validate(entry)

@router.delete("/{entry_id}")
async def delete_my_entry(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = select(models.YearbookEntry).where(models.YearbookEntry.id == entry_id)
    result = await db.execute(stmt)
    entry = result.scalars().first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if entry.status != "pending":
        raise HTTPException(status_code=400, detail="Cannot delete approved/rejected entry")
        
    await db.delete(entry)
    await db.commit()
    return {"detail": "Entry deleted"}

@router.put("/{entry_id}/status", response_model=schemas.YearbookEntryOut)
async def update_entry_status(
    entry_id: uuid.UUID,
    update_in: schemas.YearbookStatusUpdate,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    stmt = select(models.YearbookEntry).where(models.YearbookEntry.id == entry_id)
    result = await db.execute(stmt)
    entry = result.scalars().first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    entry.status = update_in.status
    if update_in.status == "rejected":
        entry.rejection_reason = update_in.rejection_reason
    elif update_in.status == "approved":
        entry.approved_by = current_user.id
        entry.approved_at = datetime.datetime.utcnow()
        
    await db.commit()
    return schemas.YearbookEntryOut.model_validate(entry)

