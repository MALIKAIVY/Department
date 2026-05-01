from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Update to asyncpg driver
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://postgres:Pass1234@localhost/dtcy"
).replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def ensure_security_columns():
    """
    Ensures that all necessary security and activity tracking tables/columns exist.
    This is called at application startup.
    """
    async with engine.begin() as conn:
        # Check for activity_logs table
        res = await conn.execute(text("SELECT to_regclass('public.activity_logs')"))
        if not res.scalar():
            logger.info("Creating activity_logs table...")
            await conn.execute(text("""
                CREATE TABLE activity_logs (
                    id UUID PRIMARY KEY,
                    user_id UUID REFERENCES profiles(id),
                    action VARCHAR NOT NULL,
                    entity_type VARCHAR,
                    entity_id UUID,
                    ip_address INET,
                    user_agent VARCHAR,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            
        # Check for moderation_logs table
        res = await conn.execute(text("SELECT to_regclass('public.moderation_logs')"))
        if not res.scalar():
            logger.info("Creating moderation_logs table...")
            await conn.execute(text("""
                CREATE TABLE moderation_logs (
                    id UUID PRIMARY KEY,
                    entry_id UUID REFERENCES yearbook_entries(id) ON DELETE CASCADE,
                    moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
                    submitter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
                    action VARCHAR NOT NULL,
                    reason TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))

        # Add onboarding/security columns to profiles if missing
        await conn.execute(text("ALTER TABLE yearbook_entries ADD COLUMN IF NOT EXISTS course TEXT"))
        await conn.execute(text("ALTER TABLE yearbook_entries ADD COLUMN IF NOT EXISTS linkedin_url TEXT"))
        await conn.execute(text("ALTER TABLE yearbook_entries ADD COLUMN IF NOT EXISTS favorite_memory TEXT"))
        await conn.execute(text("ALTER TABLE yearbook_entries ADD COLUMN IF NOT EXISTS media_url TEXT"))
        await conn.execute(text("ALTER TABLE yearbook_entries ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image'"))
        await conn.execute(text("ALTER TABLE yearbook_entries ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE"))
        await conn.execute(text("ALTER TABLE yearbook_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE"))
    logger.info("System schema verification complete.")
