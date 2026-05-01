from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import uuid
import schemas, models, database
from core.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[schemas.NotificationOut])
async def list_notifications(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = (
        select(models.Notification)
        .where(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    count = (await db.execute(
        select(func.count(models.Notification.id)).where(
            models.Notification.user_id == current_user.id,
            models.Notification.is_read == False,
        )
    )).scalar() or 0
    return {"count": count}

@router.put("/{notification_id}/read", response_model=schemas.NotificationOut)
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    result = await db.execute(select(models.Notification).where(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id,
    ))
    notification = result.scalars().first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification

@router.put("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    result = await db.execute(select(models.Notification).where(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False,
    ))
    notifications = result.scalars().all()
    for notification in notifications:
        notification.is_read = True

    await db.commit()
    return {"updated": len(notifications)}
