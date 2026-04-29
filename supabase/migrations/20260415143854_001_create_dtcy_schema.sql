/*
  # Digital Tech-Connect Yearbook (DTCY) Schema

  1. Core Tables
    - profiles: Extended user profiles for all roles (student, faculty, alumni, admin)
    - students: Student-specific data (ID, year of study, graduation year, courses)
    - faculty: Faculty-specific data (courses teaching, office hours, research interests)
    - alumni: Alumni-specific data (graduation year, current company, position, industry)
    - yearbook_entries: Yearbook submissions with approval workflow
    - connections: Alumni-student networking requests and relationships
    - announcements: Role-targeted announcements from admins/faculty
    - activity_logs: Admin audit trail for system actions

  2. Security
    - Row Level Security enabled on all tables
    - Policies enforce role-based access control
    - Users can only modify their own data
    - Admin has full access to manage system

  3. Indexes
    - Performance indexes on frequently queried columns
    - Unique constraints on business-critical fields

  4. Triggers
    - Automatic updated_at timestamp maintenance
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== PROFILES TABLE =====
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
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

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ===== PROFILE POLICIES =====
CREATE POLICY "Anyone can view profiles"
    ON public.profiles FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== STUDENTS POLICIES =====
CREATE POLICY "Anyone can view active students"
    ON public.students FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = public.students.id AND is_active = true
        )
    );

CREATE POLICY "Students update own record"
    ON public.students FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage students"
    ON public.students FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== FACULTY POLICIES =====
CREATE POLICY "Anyone can view faculty"
    ON public.faculty FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = public.faculty.id AND is_active = true
        )
    );

CREATE POLICY "Faculty update own record"
    ON public.faculty FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage faculty"
    ON public.faculty FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== ALUMNI POLICIES =====
CREATE POLICY "Anyone can view visible alumni"
    ON public.alumni FOR SELECT
    USING (
        is_visible = true AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = public.alumni.id AND is_active = true
        )
    );

CREATE POLICY "Alumni update own record"
    ON public.alumni FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage alumni"
    ON public.alumni FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== YEARBOOK ENTRY POLICIES =====
CREATE POLICY "View approved yearbook entries"
    ON public.yearbook_entries FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Users view own entries"
    ON public.yearbook_entries FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users create entries"
    ON public.yearbook_entries FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own entries"
    ON public.yearbook_entries FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Faculty can view pending entries for approval"
    ON public.yearbook_entries FOR SELECT
    TO authenticated
    USING (
        status = 'pending' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

CREATE POLICY "Admin manage all entries"
    ON public.yearbook_entries FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== CONNECTION POLICIES =====
CREATE POLICY "Users view own connections"
    ON public.connections FOR SELECT
    TO authenticated
    USING (
        auth.uid() = requester_id OR auth.uid() = receiver_id
    );

CREATE POLICY "Users create connection requests"
    ON public.connections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Receiver accept connection"
    ON public.connections FOR UPDATE
    TO authenticated
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Admins view all connections"
    ON public.connections FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== ANNOUNCEMENTS POLICIES =====
CREATE POLICY "Anyone view published announcements"
    ON public.announcements FOR SELECT
    USING (is_published = true);

CREATE POLICY "Authors view own announcements"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (auth.uid() = author_id);

CREATE POLICY "Faculty and admin create announcements"
    ON public.announcements FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

CREATE POLICY "Authors update own announcements"
    ON public.announcements FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins manage all announcements"
    ON public.announcements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== ACTIVITY LOGS POLICIES =====
CREATE POLICY "Users view own activity"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins view all activity"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System logs activity"
    ON public.activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

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
