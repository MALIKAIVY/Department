-- =========================================================================
-- DTCY PURE POSTGRESQL INITIALIZATION SCRIPT
-- =========================================================================
-- This script completely drops the existing "public" schema and recreates it.
-- It establishes a pristine, production-ready schema for the DTCY application,
-- untethered from any Supabase magic, utilizing raw PostgreSQL constraints
-- and triggers to ensure massive data integrity.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable UUID extension natively
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. BASE USERS TABLE (PROFILES)
-- =========================================================================
-- Acts as the singular source of truth for authentication and identity.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL, -- Managed securely via FastAPI (bcrypt)
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'alumni', 'admin')),
    is_active BOOLEAN DEFAULT true,
    consent_given BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMPTZ,
    is_first_login BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- =========================================================================
-- 2. ROLE-SPECIFIC TABLES (1:1 with Profiles)
-- =========================================================================

CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id TEXT UNIQUE NOT NULL,
    year_of_study INTEGER CHECK (year_of_study BETWEEN 1 AND 6),
    graduation_year INTEGER,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    courses_enrolled TEXT[] DEFAULT '{}',
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_students_grad_year ON public.students(graduation_year);

CREATE TABLE public.faculty (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    faculty_id TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    courses_teaching TEXT[] DEFAULT '{}',
    office_location TEXT,
    office_hours JSONB,
    linkedin_url TEXT,
    research_interest TEXT[],
    join_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE public.alumni (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    alumni_id TEXT UNIQUE NOT NULL,
    graduation_year INTEGER NOT NULL,
    degree_earned TEXT NOT NULL,
    current_company TEXT,
    current_position TEXT,
    industry TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    is_visible BOOLEAN DEFAULT true,
    last_active TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alumni_industry ON public.alumni(industry);
CREATE INDEX idx_alumni_grad_year ON public.alumni(graduation_year);

-- =========================================================================
-- 3. DOMAIN TABLES
-- =========================================================================

CREATE TABLE public.yearbook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    yearbook_quote TEXT,
    favorite_memory TEXT,
    future_plans TEXT,
    profile_image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, academic_year)
);
CREATE INDEX idx_yearbook_status ON public.yearbook_entries(status);
CREATE INDEX idx_yearbook_user ON public.yearbook_entries(user_id);

CREATE TABLE public.memory_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    story TEXT NOT NULL,
    media_url TEXT,
    academic_year TEXT NOT NULL,
    event_name TEXT,
    location TEXT,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, receiver_id),
    CHECK (requester_id != receiver_id) -- A user cannot connect with themselves
);
CREATE INDEX idx_conn_requester ON public.connections(requester_id);
CREATE INDEX idx_conn_receiver ON public.connections(receiver_id);

CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_roles TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.public_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    location TEXT,
    description TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES public.yearbook_entries(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_announcements_published ON public.announcements(is_published);

CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_activity_created ON public.activity_logs(created_at);

-- =========================================================================
-- 4. UTILITY TRIGGERS 
-- =========================================================================
-- This trigger globally automatically updates the `updated_at` column whenever 
-- a row in any significant table receives an UPDATE event.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_yearbook
    BEFORE UPDATE ON public.yearbook_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_connections
    BEFORE UPDATE ON public.connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- 5. INITIAL SEED DATA (MOCK USERS)
-- =========================================================================
-- The hashed password here is for "password123" processed by bcrypt.
-- You can log in using `admin@dtcy.com` / `password123` right away!

INSERT INTO public.profiles (id, email, hashed_password, full_name, role)
VALUES 
    (uuid_generate_v4(), 'admin@dtcy.com', '$2b$12$9I/HgN9q38Bo6nXfaI9URuVGYSRZSiH4j8LHaioCS4cUghhogkNv.', 'System Admin', 'admin'),
    (uuid_generate_v4(), 'faculty@dtcy.com', '$2b$12$9I/HgN9q38Bo6nXfaI9URuVGYSRZSiH4j8LHaioCS4cUghhogkNv.', 'Dr. Smith', 'faculty'),
    (uuid_generate_v4(), 'student@dtcy.com', '$2b$12$9I/HgN9q38Bo6nXfaI9URuVGYSRZSiH4j8LHaioCS4cUghhogkNv.', 'Jane Doe', 'student');


-- Insert corresponding Faculty record
INSERT INTO public.faculty (id, faculty_id, department, designation)
SELECT id, 'FAC-001', 'Computer Science', 'Lead Instructor' FROM public.profiles WHERE email = 'faculty@dtcy.com';

-- Insert corresponding Student record
INSERT INTO public.students (id, student_id, year_of_study, graduation_year)
SELECT id, 'STU-001', 3, 2026 FROM public.profiles WHERE email = 'student@dtcy.com';
