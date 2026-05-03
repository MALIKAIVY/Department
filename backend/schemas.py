from pydantic import BaseModel, EmailStr, Field, HttpUrl, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime, date
import uuid

# Token & Auth
class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    user: Optional[Dict[str, Any]] = None

class TokenData(BaseModel):
    user_id: Optional[uuid.UUID] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"
    student_id: Optional[str] = None
    year_of_study: Optional[int] = None
    graduation_year: Optional[int] = None
    faculty_id: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    alumni_id: Optional[str] = None
    degree_earned: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# Profile & Users
class StudentProfile(BaseModel):
    student_id: str
    year_of_study: Optional[int] = None
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class FacultyProfile(BaseModel):
    faculty_id: str
    designation: Optional[str] = None
    department: Optional[str] = None
    office_location: Optional[str] = None
    research_interests: Optional[List[str]] = []

class AlumniProfile(BaseModel):
    alumni_id: str
    graduation_year: int
    degree_earned: Optional[str] = None
    current_position: Optional[str] = None
    current_job_title: Optional[str] = None
    current_company: Optional[str] = None
    industry: Optional[str] = None
    mentorship_available: bool = False
    mentorship_areas: Optional[List[str]] = []
    open_to_connections: bool = True
    preferred_contact_method: Optional[str] = "internal"
    public_contact_email: Optional[str] = None
    is_visible: bool = True
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class ProfileBase(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    is_onboarded: bool = False
    created_at: datetime
    
    student: Optional[StudentProfile] = None
    faculty: Optional[FacultyProfile] = None
    alumni: Optional[AlumniProfile] = None

    class Config:
        from_attributes = True

class ProfileCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    full_name: str
    role: str
    student_id: Optional[str] = None
    faculty_id: Optional[str] = None
    graduation_year: Optional[int] = None
    department: Optional[str] = None
    designation: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    student: Optional[Dict[str, Any]] = None
    faculty: Optional[Dict[str, Any]] = None
    alumni: Optional[Dict[str, Any]] = None

class ProfileOut(ProfileBase):
    pass

class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    student_id: str
    year_of_study: int
    major: str

class FacultyCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    faculty_id: str
    department: str
    designation: str

class BulkStudentItem(BaseModel):
    email: EmailStr
    full_name: str
    student_id: Optional[str] = None
    graduation_year: int
    password: Optional[str] = None

class BulkStudentCreate(BaseModel):
    students: List[BulkStudentItem]

class BulkFacultyItem(BaseModel):
    email: EmailStr
    full_name: str
    faculty_id: Optional[str] = None
    department: str
    designation: str
    password: Optional[str] = None

class BulkFacultyCreate(BaseModel):
    faculty: List[BulkFacultyItem]

class RoleUpdate(BaseModel):
    role: str

# Yearbook
class YearbookEntryBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    yearbook_quote: Optional[str] = None
    favorite_memory: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = "image"
    is_private: bool = False
    academic_year: Optional[str] = None
    course: Optional[str] = None
    linkedin_url: Optional[str] = None
    profile_image_url: Optional[str] = None

class YearbookCreate(YearbookEntryBase):
    pass

class YearbookEntryCreate(YearbookCreate):
    pass

class YearbookEntryOut(YearbookEntryBase):
    id: uuid.UUID
    user_id: uuid.UUID
    submitted_by: Optional[uuid.UUID] = None
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    profile_image_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class YearbookStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

# Memories & Connections
class MemorySubmission(BaseModel):
    title: str
    content: str
    media_url: Optional[str] = None
    category: Optional[str] = "general"

class MemoryCreate(BaseModel):
    title: str
    story: str
    media_url: Optional[str] = None
    academic_year: str
    event_name: Optional[str] = None
    location: Optional[str] = None

class MemoryOut(BaseModel):
    id: uuid.UUID
    submitted_by: uuid.UUID
    title: str
    story: str
    media_url: Optional[str] = None
    academic_year: str
    event_name: Optional[str] = None
    location: Optional[str] = None
    status: str
    created_at: datetime
    author_name: Optional[str] = None
    author_role: Optional[str] = None

    class Config:
        from_attributes = True

class ConnectionBase(BaseModel):
    status: str
    message: Optional[str] = None

class ConnectionCreate(BaseModel):
    receiver_id: uuid.UUID
    message: Optional[str] = None

class ConnectionOut(ConnectionBase):
    id: uuid.UUID
    requester_id: uuid.UUID
    receiver_id: uuid.UUID
    created_at: datetime
    other_user: Optional[Dict[str, Any]] = None
    is_requester: bool = False

    class Config:
        from_attributes = True

# Announcements
class AnnouncementBase(BaseModel):
    title: str
    content: str
    target_roles: List[str] = []
    media_url: Optional[str] = None
    is_published: bool = False

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementOut(AnnouncementBase):
    id: uuid.UUID
    author_id: uuid.UUID
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    author_name: Optional[str] = None

    class Config:
        from_attributes = True

# Notifications
class NotificationOut(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Administrative & Stats
class DashboardStats(BaseModel):
    totalUsers: int
    studentCount: int
    facultyCount: int
    alumniCount: int
    adminCount: int
    totalYearbookEntries: int
    pendingEntries: int
    pendingMemories: int
    userConnections: int

class GraduationRequest(BaseModel):
    year_of_study: Optional[int] = None
    graduation_year: Optional[int] = None

class GraduationResult(BaseModel):
    transitioned: int
    advanced: int
    graduation_year: int

class PublicEventCreate(BaseModel):
    title: str
    event_date: str
    location: Optional[str] = None
    description: str
    is_published: bool = True

class PublicEventOut(PublicEventCreate):
    id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
