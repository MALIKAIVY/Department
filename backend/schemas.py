from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import uuid

# --- Base Schemas ---

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    user_id: Optional[str] = None
    type: Optional[str] = None

# --- Auth Schemas ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    role: str = Field(..., pattern='^(student|faculty|alumni|admin)$')
    
    # Student specific (Optional during reg)
    student_id: Optional[str] = None
    graduation_year: Optional[int] = None
    
    # Faculty specific
    faculty_id: Optional[str] = None
    department: Optional[str] = None
    
    # Alumni specific
    alumni_id: Optional[str] = None

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Profile Schemas ---

class StudentProfile(BaseModel):
    student_id: str
    year_of_study: Optional[int] = Field(None, ge=1, le=6)
    graduation_year: Optional[int] = None
    courses_enrolled: List[str] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class FacultyProfile(BaseModel):
    faculty_id: str
    department: str
    designation: str
    courses_teaching: List[str] = []
    office_location: Optional[str] = None
    office_hours: Optional[Dict[str, Any]] = None
    linkedin_url: Optional[str] = None
    research_interest: List[str] = []

class AlumniProfile(BaseModel):
    alumni_id: str
    graduation_year: int
    degree_earned: str
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    industry: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    is_visible: bool = True

class ProfileBase(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    
    # Nested role data
    student: Optional[StudentProfile] = None
    faculty: Optional[FacultyProfile] = None
    alumni: Optional[AlumniProfile] = None

    model_config = ConfigDict(from_attributes=True)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    
    # Role specific updates (handled by same endpoint)
    student: Optional[Dict[str, Any]] = None
    faculty: Optional[Dict[str, Any]] = None
    alumni: Optional[Dict[str, Any]] = None

# --- Yearbook Schemas ---

class YearbookCreate(BaseModel):
    academic_year: str = Field(..., pattern='^20[2-9][0-9]-20[2-9][0-9]$')
    yearbook_quote: str = Field(..., max_length=200)
    favorite_memory: Optional[str] = None
    future_plans: Optional[str] = None
    profile_image_url: Optional[str] = None

class YearbookEntryOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    academic_year: str
    yearbook_quote: str
    favorite_memory: Optional[str] = None
    profile_image_url: Optional[str] = None
    status: str
    created_at: datetime
    author_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class YearbookStatusUpdate(BaseModel):
    status: str = Field(..., pattern='^(approved|rejected)$')
    rejection_reason: Optional[str] = None

# --- Announcement Schemas ---

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_roles: List[str] = []
    is_published: bool = True

class AnnouncementOut(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    author_id: uuid.UUID
    target_roles: List[str]
    created_at: datetime
    author_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    totalUsers: int
    totalYearbookEntries: int
    pendingEntries: int
    userConnections: int
