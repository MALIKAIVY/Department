DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

/*
  # Digital Tech-Connect Yearbook (DTCY) Schema - Pure Postgres
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== PROFILES (USERS) TABLE =====
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'alumni', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== STUDENTS TABLE =====
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id TEXT UNIQUE NOT NULL,
    date_of_birth DATE,
    year_of_study INTEGER CHECK (year_of_study BETWEEN 1 AND 6),
    graduation_year INTEGER,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    courses_enrolled TEXT[] DEFAULT '{}',
    linkedin_url TEXT,
    github_url TEXT
);

-- ===== FACULTY TABLE =====
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    faculty_id TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    courses_teaching TEXT[] DEFAULT '{}',
    office_location TEXT,
    office_hours JSONB,
    linkedin_url TEXT,
    research_interest TEXT[]
);

-- ===== ALUMNI TABLE =====
CREATE TABLE IF NOT EXISTS public.alumni (
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
    is_visible BOOLEAN DEFAULT true
);

-- ===== YEARBOOK ENTRIES TABLE =====
CREATE TABLE IF NOT EXISTS public.yearbook_entries (
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
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, academic_year)
);

-- ===== CONNECTIONS TABLE =====
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id),
    CHECK (requester_id != receiver_id)
);

-- ===== ANNOUNCEMENTS TABLE =====
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id),
    target_roles TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== ACTIVITY LOGS TABLE =====
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_students_graduation_year ON public.students(graduation_year);
CREATE INDEX IF NOT EXISTS idx_alumni_graduation_year ON public.alumni(graduation_year);
CREATE INDEX IF NOT EXISTS idx_alumni_industry ON public.alumni(industry);
CREATE INDEX IF NOT EXISTS idx_yearbook_entries_status ON public.yearbook_entries(status);
CREATE INDEX IF NOT EXISTS idx_yearbook_entries_academic_year ON public.yearbook_entries(academic_year);
CREATE INDEX IF NOT EXISTS idx_yearbook_entries_user_id ON public.yearbook_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- ===== TRIGGER FUNCTIONS =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yearbook_entries_updated_at BEFORE UPDATE ON public.yearbook_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
