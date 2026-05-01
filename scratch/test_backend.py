import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import database
import models
import schemas
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from pydantic import TypeAdapter
from typing import List

async def test_users():
    try:
        async with database.AsyncSessionLocal() as db:
            stmt = select(models.Profile).options(
                joinedload(models.Profile.student),
                joinedload(models.Profile.faculty),
                joinedload(models.Profile.alumni)
            ).limit(10)
            
            result = await db.execute(stmt)
            users = result.unique().scalars().all()
            print(f"Successfully fetched {len(users)} users from DB")
            
            # Test Pydantic serialization
            adapter = TypeAdapter(List[schemas.ProfileOut])
            serialized = adapter.validate_python(users)
            print(f"Successfully serialized {len(serialized)} users to Pydantic")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_users())
