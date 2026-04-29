import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, update
import os
from passlib.context import CryptContext
from models import Profile
from database import SQLALCHEMY_DATABASE_URL

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

test_accounts = [
    {"email": "student@dtcy.com", "password": "Student@123"},
    {"email": "faculty@dtcy.com", "password": "Faculty@123"},
    {"email": "alumni@dtcy.com", "password": "Alumni@123"},
    {"email": "admin@dtcy.com", "password": "Admin@123"},
]

async def setup():
    engine = create_async_engine(SQLALCHEMY_DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        for account in test_accounts:
            hashed = pwd_context.hash(account["password"])
            stmt = update(Profile).where(Profile.email == account["email"]).values(hashed_password=hashed)
            await session.execute(stmt)
        await session.commit()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(setup())
    print("Test accounts updated with correct hashed passwords.")
