from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import schemas, models, database
from core import security
from core.security import get_current_user
import uuid
import secrets
import string
from typing import List

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
            role="student"
        )
        db.add(new_profile)
        
        student = models.Student(
            id=user_id,
            student_id=student_in.student_id,
            graduation_year=student_in.graduation_year
        )
        db.add(student)
        created_profiles.append(new_profile)
        
    await db.commit()
    
    # Refresh to get all data
    final_profiles = []
    for p in created_profiles:
        await db.refresh(p)
        final_profiles.append(p)
        
    return final_profiles
