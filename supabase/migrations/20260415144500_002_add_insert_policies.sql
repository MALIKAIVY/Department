-- ===== ADD INSERT POLICIES =====
-- These policies are required to allow users to create their profiles
-- and role-specific records during the sign-up process.

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Students can insert own record"
    ON public.students FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Faculty can insert own record"
    ON public.faculty FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Alumni can insert own record"
    ON public.alumni FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
