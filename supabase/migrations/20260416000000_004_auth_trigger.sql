-- Simple Auth System Trigger Migration
-- Handles automatic profile and role-table instantiation on signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_meta JSONB;
BEGIN
  v_meta := NEW.raw_user_meta_data;
  v_role := COALESCE(v_meta->>'role', 'student');

  -- 1. Insert baseline Profile
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_meta->>'full_name', 'New User'),
    v_role,
    true
  );

  -- 2. Insert into sub-table based on chosen role natively
  IF v_role = 'student' THEN
    INSERT INTO public.students (id, student_id, year_of_study, courses_enrolled)
    VALUES (
      NEW.id, 
      'STU-' || substr(NEW.id::text, 1, 8), 
      COALESCE((v_meta->>'year_of_study')::int, 1), 
      ARRAY[COALESCE(v_meta->>'course', 'Computer Science')]
    );
  ELSIF v_role = 'faculty' THEN
    INSERT INTO public.faculty (id, faculty_id, department, designation)
    VALUES (
      NEW.id, 
      'FAC-' || substr(NEW.id::text, 1, 8), 
      COALESCE(v_meta->>'department', 'Computer Science'), 
      COALESCE(v_meta->>'position', 'Faculty')
    );
  ELSIF v_role = 'alumni' THEN
    INSERT INTO public.alumni (id, alumni_id, graduation_year, current_position, degree_earned)
    VALUES (
      NEW.id, 
      'ALU-' || substr(NEW.id::text, 1, 8), 
      COALESCE((v_meta->>'graduation_year')::int, extract(year from current_date)), 
      COALESCE(v_meta->>'current_position', 'Alumni'), 
      'Not specified'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map event listener
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
