from sqlalchemy import Column, String, Boolean, Integer, Date, ForeignKey, JSON, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB, INET
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    avatar_url = Column(String)
    phone = Column(String)
    bio = Column(String)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    faculty = relationship("Faculty", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    alumni = relationship("Alumni", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    yearbook_entries = relationship("YearbookEntry", back_populates="author", foreign_keys="YearbookEntry.user_id")

class Student(Base):
    __tablename__ = "students"
    
    id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    student_id = Column(String, unique=True, nullable=False)
    date_of_birth = Column(Date)
    year_of_study = Column(Integer)
    graduation_year = Column(Integer)
    enrollment_date = Column(Date, default=datetime.utcnow().date)
    courses_enrolled = Column(ARRAY(String), default=[])
    linkedin_url = Column(String)
    github_url = Column(String)
    portfolio_url = Column(String)

    profile = relationship("Profile", back_populates="student")

class Faculty(Base):
    __tablename__ = "faculty"
    
    id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    faculty_id = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    courses_teaching = Column(ARRAY(String), default=[])
    office_location = Column(String)
    office_hours = Column(JSONB)
    linkedin_url = Column(String)
    research_interest = Column(ARRAY(String))
    join_date = Column(Date, default=datetime.utcnow().date)

    profile = relationship("Profile", back_populates="faculty")

class Alumni(Base):
    __tablename__ = "alumni"
    
    id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    alumni_id = Column(String, unique=True, nullable=False)
    graduation_year = Column(Integer, nullable=False)
    degree_earned = Column(String, nullable=False)
    current_company = Column(String)
    current_position = Column(String)
    industry = Column(String)
    linkedin_url = Column(String)
    github_url = Column(String)
    portfolio_url = Column(String)
    is_visible = Column(Boolean, default=True)
    last_active = Column(DateTime(timezone=True), default=datetime.utcnow)

    profile = relationship("Profile", back_populates="alumni")

class YearbookEntry(Base):
    __tablename__ = "yearbook_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String, nullable=False)
    yearbook_quote = Column(String, nullable=False)
    favorite_memory = Column(String)
    future_plans = Column(String)
    profile_image_url = Column(String)
    is_featured = Column(Boolean, default=False)
    status = Column(String, default="pending") # pending, approved, rejected
    rejection_reason = Column(String)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("Profile", back_populates="yearbook_entries", foreign_keys=[user_id])

class Connection(Base):
    __tablename__ = "connections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending")
    message = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    target_roles = Column(ARRAY(String), default=[])
    media_url = Column(String)
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    action = Column(String, nullable=False)
    entity_type = Column(String)
    entity_id = Column(UUID(as_uuid=True))
    ip_address = Column(INET)
    user_agent = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

