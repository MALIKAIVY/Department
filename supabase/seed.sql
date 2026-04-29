-- Seed Test Accounts for DTCY (Supabase Local Dev)
-- These accounts will be populated during testing

-- 1. Create auth users
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data)
VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'student@dtcy.com', crypt('Student@123', gen_salt('bf')), NOW(), 'authenticated', '{"provider":"email","providers":["email"]}'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'faculty@dtcy.com', crypt('Faculty@123', gen_salt('bf')), NOW(), 'authenticated', '{"provider":"email","providers":["email"]}'),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'alumni@dtcy.com', crypt('Alumni@123', gen_salt('bf')), NOW(), 'authenticated', '{"provider":"email","providers":["email"]}'),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'admin@dtcy.com', crypt('Admin@123', gen_salt('bf')), NOW(), 'authenticated', '{"provider":"email","providers":["email"]}');

-- 2. Insert into profiles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'student@dtcy.com', 'Test Student', 'student'),
    ('00000000-0000-0000-0000-000000000002', 'faculty@dtcy.com', 'Test Faculty', 'faculty'),
    ('00000000-0000-0000-0000-000000000003', 'alumni@dtcy.com', 'Test Alumni', 'alumni'),
    ('00000000-0000-0000-0000-000000000004', 'admin@dtcy.com', 'Test Admin', 'admin');

-- 3. Insert into role specific tables
INSERT INTO public.students (id, student_id, year_of_study)
VALUES ('00000000-0000-0000-0000-000000000001', 'STU-001', 4);

INSERT INTO public.faculty (id, faculty_id, department, designation)
VALUES ('00000000-0000-0000-0000-000000000002', 'FAC-001', 'Computer Science', 'Professor');

INSERT INTO public.alumni (id, alumni_id, graduation_year, degree_earned, current_company)
VALUES ('00000000-0000-0000-0000-000000000003', 'ALU-001', 2023, 'BSc Computer Science', 'Tech Innovators Inc.');
