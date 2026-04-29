from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.orm import joinedload
from typing import List, Optional
import schemas, models, database
from core.security import get_current_user
import uuid
from datetime import datetime
import os

router = APIRouter(prefix="/announcements", tags=["announcements"])

@router.get("/", response_model=List[schemas.AnnouncementOut])
async def get_announcements(
    skip: int = 0, 
    limit: int = 20, 
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    # Role-based visibility
    # Announcements target specific roles (or all if empty)
    # Admin/Faculty can see all (including drafts they authored or all if published)
    
    stmt = select(models.Announcement).options(joinedload(models.Announcement.author)).order_by(models.Announcement.created_at.desc())
    
    if current_user.role in ["admin", "faculty"]:
        # See all published, or drafts where author is self
        stmt = stmt.where(
            or_(
                models.Announcement.is_published == True,
                models.Announcement.author_id == current_user.id
            )
        )
    else:
        # Students/Alumni see only published ones targeting their role or all roles
        stmt = stmt.where(
            and_(
                models.Announcement.is_published == True,
                or_(
                    models.Announcement.target_roles == [],
                    models.Announcement.target_roles.contains([current_user.role])
                )
            )
        )
        
    result = await db.execute(stmt.offset(skip).limit(limit))
    announcements = result.unique().scalars().all()
    
    out = []
    for ann in announcements:
        item = schemas.AnnouncementOut.model_validate(ann)
        item.author_name = ann.author.full_name
        out.append(item)
    return out

ALLOWED_MEDIA_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}
MAX_MEDIA_SIZE = 50 * 1024 * 1024

@router.post("/media")
async def upload_announcement_media(
    file: UploadFile = File(...),
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WebP, MP4, WebM, or MOV files are allowed")

    content = await file.read()
    if len(content) > MAX_MEDIA_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB")

    upload_dir = os.path.join("uploads", "announcements")
    os.makedirs(upload_dir, exist_ok=True)

    extension = ALLOWED_MEDIA_TYPES[file.content_type]
    file_name = f"{current_user.id}-{uuid.uuid4()}{extension}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as media_file:
        media_file.write(content)

    return {
        "url": f"/uploads/announcements/{file_name}",
        "media_type": "video" if file.content_type.startswith("video/") else "image",
    }

@router.post("/", response_model=schemas.AnnouncementOut)
async def create_announcement(
    ann_in: schemas.AnnouncementCreate,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    new_ann = models.Announcement(
        id=uuid.uuid4(),
        title=ann_in.title,
        content=ann_in.content,
        target_roles=ann_in.target_roles,
        media_url=ann_in.media_url,
        is_published=ann_in.is_published,
        author_id=current_user.id,
        published_at=datetime.utcnow() if ann_in.is_published else None
    )
    db.add(new_ann)
    await db.commit()
    await db.refresh(new_ann)
    
    # Reload for joinedload
    stmt = select(models.Announcement).where(models.Announcement.id == new_ann.id).options(joinedload(models.Announcement.author))
    res = await db.execute(stmt)
    ann = res.scalars().first()
    
    item = schemas.AnnouncementOut.model_validate(ann)
    item.author_name = ann.author.full_name
    return item

@router.delete("/{ann_id}")
async def delete_announcement(
    ann_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = select(models.Announcement).where(models.Announcement.id == ann_id)
    result = await db.execute(stmt)
    ann = result.scalars().first()
    
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    if current_user.role != "admin" and ann.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    await db.delete(ann)
    await db.commit()
    return {"detail": "Announcement deleted"}


