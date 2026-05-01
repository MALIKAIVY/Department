from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_, and_, desc
from sqlalchemy.orm import joinedload
from typing import List, Optional
import schemas, models, database
from core.security import get_current_user
import uuid

router = APIRouter(prefix="/connections", tags=["connections"])

async def profile_avatar_url(db: AsyncSession, profile: models.Profile):
    if profile.avatar_url:
        return profile.avatar_url

    result = await db.execute(
        select(models.YearbookEntry.profile_image_url)
        .where(
            models.YearbookEntry.user_id == profile.id,
            models.YearbookEntry.profile_image_url.is_not(None),
            models.YearbookEntry.profile_image_url != "",
            or_(
                models.YearbookEntry.media_type.is_(None),
                models.YearbookEntry.media_type == "image",
            ),
        )
        .order_by(desc(models.YearbookEntry.created_at))
        .limit(1)
    )
    return result.scalar()

@router.get("/", response_model=List[dict])
async def get_connections(
    status: Optional[str] = None,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = select(models.Connection).where(
        or_(
            models.Connection.requester_id == current_user.id,
            models.Connection.receiver_id == current_user.id
        )
    ).options(
        joinedload(models.Connection.requester),
        joinedload(models.Connection.receiver)
    )
    
    if status:
        stmt = stmt.where(models.Connection.status == status)
        
    result = await db.execute(stmt)
    connections = result.unique().scalars().all()
    
    out = []
    for conn in connections:
        is_requester = (conn.requester_id == current_user.id)
        other_user = conn.receiver if is_requester else conn.requester
        other_avatar_url = await profile_avatar_url(db, other_user)
        
        out.append({
            "id": conn.id,
            "requester_id": conn.requester_id,
            "receiver_id": conn.receiver_id,
            "status": conn.status,
            "message": conn.message,
            "response_message": conn.response_message,
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "avatar_url": other_avatar_url,
                "role": other_user.role
            },
            "is_requester": is_requester,
            "created_at": conn.created_at
        })
    return out

@router.get("/status/{other_id}")
async def get_connection_status(
    other_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = select(models.Connection).where(
        or_(
            and_(models.Connection.requester_id == current_user.id, models.Connection.receiver_id == other_id),
            and_(models.Connection.requester_id == other_id, models.Connection.receiver_id == current_user.id)
        )
    ).options(
        joinedload(models.Connection.requester),
        joinedload(models.Connection.receiver)
    )
    result = await db.execute(stmt)
    conn = result.unique().scalars().first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    is_requester = conn.requester_id == current_user.id
    other_user = conn.receiver if is_requester else conn.requester
    other_avatar_url = await profile_avatar_url(db, other_user)
    return {
        "id": conn.id,
        "requester_id": conn.requester_id,
        "receiver_id": conn.receiver_id,
        "status": conn.status,
        "message": conn.message,
        "response_message": conn.response_message,
        "other_user": {
            "id": other_user.id,
            "full_name": other_user.full_name,
            "avatar_url": other_avatar_url,
            "role": other_user.role,
        },
        "is_requester": is_requester,
        "created_at": conn.created_at,
    }

@router.post("/{receiver_id}")
async def request_connection(
    receiver_id: uuid.UUID,
    message: Optional[str] = None,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    if current_user.id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")
        
    # Check if user exists
    res = await db.execute(select(models.Profile).where(models.Profile.id == receiver_id))
    receiver = res.scalars().first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == "student" and receiver.role == "alumni":
        alumni_res = await db.execute(select(models.Alumni).where(models.Alumni.id == receiver_id))
        alumni = alumni_res.scalars().first()
        if alumni and not alumni.open_to_connections:
            raise HTTPException(status_code=400, detail="This alumni is not currently open to student connection requests")
        
    # Check existing
    stmt = select(models.Connection).where(
        or_(
            and_(models.Connection.requester_id == current_user.id, models.Connection.receiver_id == receiver_id),
            and_(models.Connection.requester_id == receiver_id, models.Connection.receiver_id == current_user.id)
        )
    )
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Connection already exists or is pending")
        
    new_conn = models.Connection(
        requester_id=current_user.id,
        receiver_id=receiver_id,
        message=message,
        status="pending"
    )
    db.add(new_conn)
    db.add(models.Notification(
        user_id=receiver_id,
        type="connection_request",
        title="New connection request",
        message=f"{current_user.full_name} wants to connect with you.",
        link=f"/profile/{current_user.id}",
    ))
    await db.commit()
    return {"detail": "Connection request sent"}

@router.put("/{connection_id}/accept")
async def accept_connection(
    connection_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = select(models.Connection).where(models.Connection.id == connection_id)
    result = await db.execute(stmt)
    conn = result.scalars().first()
    
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    if conn.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the receiver can accept")
    if conn.status != "pending":
        raise HTTPException(status_code=400, detail="Connection not in pending state")
        
    conn.status = "accepted"
    db.add(models.Notification(
        user_id=conn.requester_id,
        type="connection_accepted",
        title="Connection accepted",
        message=f"{current_user.full_name} accepted your connection request.",
        link=f"/profile/{current_user.id}",
    ))
    await db.commit()
    return {"detail": "Connection accepted"}

@router.put("/{connection_id}/status")
async def update_connection_status(
    connection_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    status_value = payload.get("status")
    if status_value not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be accepted or rejected")

    stmt = select(models.Connection).where(models.Connection.id == connection_id)
    result = await db.execute(stmt)
    conn = result.scalars().first()

    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    if conn.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the receiver can respond")
    if conn.status != "pending":
        raise HTTPException(status_code=400, detail="Connection not in pending state")

    conn.status = status_value
    response_message = (payload.get("response_message") or "").strip()
    conn.response_message = response_message or None
    notification_message = f"{current_user.full_name} {status_value} your connection request."
    if response_message:
        notification_message = f"{notification_message} Reply: {response_message}"

    db.add(models.Notification(
        user_id=conn.requester_id,
        type=f"connection_{status_value}",
        title=f"Connection {status_value}",
        message=notification_message,
        link=f"/profile/{current_user.id}",
    ))
    await db.commit()
    return {"detail": f"Connection {status_value}"}

@router.delete("/{connection_id}")
async def remove_connection(
    connection_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    stmt = select(models.Connection).where(
        models.Connection.id == connection_id,
        or_(models.Connection.requester_id == current_user.id, models.Connection.receiver_id == current_user.id)
    )
    result = await db.execute(stmt)
    conn = result.scalars().first()
    
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    await db.delete(conn)
    await db.commit()
    return {"detail": "Connection removed"}

@router.post("/block/{user_id}")
async def block_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db), 
    current_user: models.Profile = Depends(get_current_user)
):
    # Remove existing connections
    stmt = delete(models.Connection).where(
        or_(
            and_(models.Connection.requester_id == current_user.id, models.Connection.receiver_id == user_id),
            and_(models.Connection.requester_id == user_id, models.Connection.receiver_id == current_user.id)
        )
    )
    await db.execute(stmt)
    
    # Store block - assuming we have a Bloch table or just connection status "blocked"
    # The SQL schema doesn't have a Block table, we should use a status if we want to stick to the tables
    # But Feature #31-32 specify "Blocked Contacts". Let's assume a status "blocked" in Connection table
    # but where the blocker is the "receiver" or similar.
    # Actually, a separate table is better for production. 
    # But since I'm strict on the provided SQL, I'll use the Connection table with status='blocked'
    
    new_block = models.Connection(
        requester_id=current_user.id,
        receiver_id=user_id,
        status="blocked"
    )
    db.add(new_block)
    await db.commit()
    return {"detail": "User blocked"}

