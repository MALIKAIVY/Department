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
    consent_given = Column(Boolean, default=False)
    consent_timestamp = Column(DateTime(timezone=True))
    is_first_login = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True))
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    faculty = relationship("Faculty", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    alumni = relationship("Alumni", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    yearbook_entries = relationship("YearbookEntry", back_populates="author", foreign_keys="YearbookEntry.user_id")
    sent_connections = relationship("Connection", foreign_keys="Connection.requester_id", back_populates="requester")
    received_connections = relationship("Connection", foreign_keys="Connection.receiver_id", back_populates="receiver")
    announcements = relationship("Announcement", back_populates="author")

class Student(Base):
    __tablename__ = "students"
    
    id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    student_id = Column(String, unique=True, nullable=False)
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
    mentorship_available = Column(Boolean, default=False)
    mentorship_areas = Column(ARRAY(String), default=[])
    open_to_connections = Column(Boolean, default=True)
    preferred_contact_method = Column(String, default="internal")
    public_contact_email = Column(String)
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
    course = Column(String)
    linkedin_url = Column(String)
    profile_image_url = Column(String)
    media_url = Column(String)
    media_type = Column(String, default="image")
    is_private = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    status = Column(String, default="pending") # pending, approved, rejected
    rejection_reason = Column(String)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("Profile", back_populates="yearbook_entries", foreign_keys=[user_id])

class MemorySubmission(Base):
    __tablename__ = "memory_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    story = Column(Text, nullable=False)
    media_url = Column(String)
    academic_year = Column(String, nullable=False)
    event_name = Column(String)
    location = Column(String)
    status = Column(String, default="pending")
    course = Column(String)
    linkedin_url = Column(String)
    rejection_reason = Column(Text)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    reviewed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    author = relationship("Profile", foreign_keys=[submitted_by])

class Connection(Base):
    __tablename__ = "connections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending")
    message = Column(String)
    response_message = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = relationship("Profile", foreign_keys=[requester_id], back_populates="sent_connections")
    receiver = relationship("Profile", foreign_keys=[receiver_id], back_populates="received_connections")

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

    author = relationship("Profile", back_populates="announcements")

class PublicEvent(Base):
    __tablename__ = "public_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    event_date = Column(String, nullable=False)
    location = Column(String)
    description = Column(Text, nullable=False)
    is_published = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class ModerationLog(Base):
    __tablename__ = "moderation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(UUID(as_uuid=True), ForeignKey("yearbook_entries.id", ondelete="CASCADE"), nullable=False)
    moderator_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"))
    submitter_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"))
    action = Column(String, nullable=False)
    reason = Column(Text)
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
