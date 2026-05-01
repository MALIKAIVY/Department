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
    search: Optional[str] = None,
    skip: int = 0, limit: int = 100, 
    db: AsyncSession = Depends(database.get_db)
):
    stmt = select(models.YearbookEntry).where(models.YearbookEntry.status == "approved").options(
        joinedload(models.YearbookEntry.author)
    ).order_by(desc(models.YearbookEntry.created_at)).offset(skip).limit(limit)
    
    if academic_year:
        stmt = stmt.where(models.YearbookEntry.academic_year == academic_year)
    
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.join(models.Profile, models.YearbookEntry.user_id == models.Profile.id).where(
            (models.Profile.full_name.ilike(search_filter)) |
            (models.YearbookEntry.course.ilike(search_filter)) |
            (models.YearbookEntry.favorite_memory.ilike(search_filter))
        )
    
    result = await db.execute(stmt)
    entries = result.unique().scalars().all()
    
    # Enrichment
    out = []
    for entry in entries:
        if role and entry.author.role != role:
            continue
        item = schemas.YearbookEntryOut.model_validate(entry)
        item.submitted_by = entry.user_id
        item.author_name = entry.author.full_name
        item.author_role = entry.author.role
        item.profile_image_url = entry.profile_image_url or entry.author.avatar_url
        out.append(item)
    return out

@router.get("/pending", response_model=List[schemas.YearbookEntryOut])
async def get_pending_entries(
    skip: int = 0, limit: int = 20, 
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
        
    stmt = select(models.YearbookEntry).where(models.YearbookEntry.status == "pending").options(
        joinedload(models.YearbookEntry.author)
    ).order_by(desc(models.YearbookEntry.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    entries = result.unique().scalars().all()
    
    out = []
    for entry in entries:
        item = schemas.YearbookEntryOut.model_validate(entry)
        item.submitted_by = entry.user_id
        item.author_name = entry.author.full_name
        item.author_role = entry.author.role
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
        item = schemas.YearbookEntryOut.model_validate(entry)
        item.submitted_by = entry.user_id
        return item
    return None

@router.post("/media")
async def upload_yearbook_media(
    file: UploadFile = File(...),
    current_user: models.Profile = Depends(get_current_user)
):

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

@router.post("/memories/media")
async def upload_memory_media(
    file: UploadFile = File(...),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role not in ["student", "faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Students, faculty and admins only")

    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WebP, MP4, WebM, or MOV files are allowed")

    content = await file.read()
    if len(content) > MAX_MEDIA_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB")

    upload_dir = os.path.join("uploads", "memories")
    os.makedirs(upload_dir, exist_ok=True)

    extension = ALLOWED_MEDIA_TYPES[file.content_type]
    file_name = f"{current_user.id}-{uuid.uuid4()}{extension}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as media_file:
        media_file.write(content)

    return {
        "url": f"/uploads/memories/{file_name}",
        "media_type": "video" if file.content_type.startswith("video/") else "image",
    }

@router.get("/memories", response_model=List[schemas.MemoryOut])
async def get_memories(
    academic_year: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(database.get_db)
):
    stmt = select(models.MemorySubmission).where(models.MemorySubmission.status == "approved").options(
        joinedload(models.MemorySubmission.author)
    ).order_by(desc(models.MemorySubmission.created_at)).offset(skip).limit(limit)

    if academic_year:
        stmt = stmt.where(models.MemorySubmission.academic_year == academic_year)

    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            (models.MemorySubmission.title.ilike(search_filter)) |
            (models.MemorySubmission.story.ilike(search_filter))
        )

    result = await db.execute(stmt)
    memories = result.unique().scalars().all()
    out = []
    for memory in memories:
        item = schemas.MemoryOut.model_validate(memory)
        item.author_name = memory.author.full_name if memory.author else None
        item.author_role = memory.author.role if memory.author else None
        out.append(item)
    return out

@router.get("/memories/pending", response_model=List[schemas.MemoryOut])
async def get_pending_memories(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    stmt = select(models.MemorySubmission).where(models.MemorySubmission.status == "pending").options(
        joinedload(models.MemorySubmission.author)
    ).order_by(desc(models.MemorySubmission.created_at)).offset(skip).limit(limit)

    result = await db.execute(stmt)
    memories = result.unique().scalars().all()
    out = []
    for memory in memories:
        item = schemas.MemoryOut.model_validate(memory)
        item.author_name = memory.author.full_name if memory.author else None
        item.author_role = memory.author.role if memory.author else None
        out.append(item)
    return out

@router.post("/memories", response_model=schemas.MemoryOut)
async def submit_memory(
    payload: schemas.MemoryCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role not in ["student", "faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Students, faculty and admins only")

    memory = models.MemorySubmission(
        submitted_by=current_user.id,
        title=payload.title,
        story=payload.story,
        media_url=payload.media_url,
        academic_year=payload.academic_year,
        event_name=payload.event_name,
        location=payload.location,
        status="pending",
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    item = schemas.MemoryOut.model_validate(memory)
    item.author_name = current_user.full_name
    item.author_role = current_user.role
    return item

@router.put("/memories/{memory_id}/status", response_model=schemas.MemoryOut)
async def update_memory_status(
    memory_id: uuid.UUID,
    update_in: schemas.YearbookStatusUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(select(models.MemorySubmission).where(models.MemorySubmission.id == memory_id).options(
        joinedload(models.MemorySubmission.author)
    ))
    memory = result.unique().scalars().first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    memory.status = update_in.status
    memory.rejection_reason = update_in.rejection_reason if update_in.status == "rejected" else None
    memory.reviewed_by = current_user.id
    memory.reviewed_at = datetime.datetime.utcnow()

    db.add(models.Notification(
        user_id=memory.submitted_by,
        type=f"memory_{update_in.status}",
        title=f"Memory {update_in.status}",
        message=(
            "Your shared memory has been approved and is now visible in the yearbook."
            if update_in.status == "approved"
            else f"Your shared memory was rejected. Reason: {update_in.rejection_reason or 'No reason provided.'}"
        ),
        link="/yearbook",
    ))

    await db.commit()
    item = schemas.MemoryOut.model_validate(memory)
    item.author_name = memory.author.full_name if memory.author else None
    item.author_role = memory.author.role if memory.author else None
    return item

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
        raise HTTPException(status_code=400, detail="Entry for this year already exists. Use PUT to edit.")
        
    new_entry = models.YearbookEntry(
        user_id=current_user.id,
        academic_year=entry_in.academic_year,
        yearbook_quote=entry_in.yearbook_quote,
        course=entry_in.course,
        linkedin_url=entry_in.linkedin_url,
        profile_image_url=entry_in.profile_image_url,
        status="pending"
    )
    db.add(new_entry)
    await db.commit()
    item = schemas.YearbookEntryOut.model_validate(new_entry)
    item.submitted_by = new_entry.user_id
    return item

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
    entry.course = entry_in.course
    entry.linkedin_url = entry_in.linkedin_url
    entry.profile_image_url = entry_in.profile_image_url
    
    await db.commit()
    item = schemas.YearbookEntryOut.model_validate(entry)
    item.submitted_by = entry.user_id
    return item

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
    if current_user.role != "admin":
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

    db.add(models.ModerationLog(
        entry_id=entry.id,
        moderator_id=current_user.id,
        submitter_id=entry.user_id,
        action=update_in.status,
        reason=update_in.rejection_reason,
    ))

    if update_in.status == "approved":
        db.add(models.Notification(
            user_id=entry.user_id,
            type="submission_approved",
            title="Yearbook entry approved",
            message="Your yearbook entry has been approved and is now visible in the yearbook.",
            link="/yearbook",
        ))
    else:
        db.add(models.Notification(
            user_id=entry.user_id,
            type="submission_rejected",
            title="Yearbook entry needs changes",
            message=f"Your yearbook entry was rejected. Reason: {update_in.rejection_reason or 'No reason provided.'}",
            link="/yearbook",
        ))

    await db.commit()
    item = schemas.YearbookEntryOut.model_validate(entry)
    item.submitted_by = entry.user_id
    return item
