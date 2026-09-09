-- ============================================================
-- KU PHASE 4: SECURE CLASSROOM MEMBERSHIP & JOIN ENGINE
-- ============================================================

-- Function to securely join a classroom using a 6-character join code
CREATE OR REPLACE FUNCTION public.join_classroom(p_join_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_classroom RECORD;
  v_already_joined BOOLEAN;
  v_student_count INTEGER;
BEGIN
  -- 1. Enforce authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to join a classroom';
  END IF;

  -- 2. Validate join code format
  IF p_join_code IS NULL OR length(trim(p_join_code)) = 0 THEN
    RAISE EXCEPTION 'Please provide a valid join code';
  END IF;

  -- 3. Lookup active classroom
  SELECT id, name, subject, grade, join_code, teacher_id, is_active
  INTO v_classroom
  FROM public.classrooms
  WHERE upper(trim(join_code)) = upper(trim(p_join_code))
    AND is_active = true;

  IF v_classroom.id IS NULL THEN
    RAISE EXCEPTION 'Classroom not found with join code: %', p_join_code;
  END IF;

  -- 4. If user is the creator/teacher of the classroom
  IF v_classroom.teacher_id = v_user_id THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_teacher', true,
      'classroom_id', v_classroom.id,
      'name', v_classroom.name,
      'subject', v_classroom.subject,
      'grade', v_classroom.grade,
      'join_code', v_classroom.join_code,
      'message', 'You are the teacher of this classroom'
    );
  END IF;

  -- 5. Check existing enrolment
  SELECT EXISTS (
    SELECT 1 FROM public.classroom_students
    WHERE classroom_id = v_classroom.id AND user_id = v_user_id
  ) INTO v_already_joined;

  IF NOT v_already_joined THEN
    INSERT INTO public.classroom_students (classroom_id, user_id, joined_at)
    VALUES (v_classroom.id, v_user_id, now())
    ON CONFLICT (classroom_id, user_id) DO NOTHING;
  END IF;

  -- 6. Recalculate real student count from membership table
  SELECT count(*)::int INTO v_student_count
  FROM public.classroom_students
  WHERE classroom_id = v_classroom.id;

  UPDATE public.classrooms
  SET student_count = v_student_count
  WHERE id = v_classroom.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_joined', v_already_joined,
    'classroom_id', v_classroom.id,
    'name', v_classroom.name,
    'subject', v_classroom.subject,
    'grade', v_classroom.grade,
    'join_code', v_classroom.join_code,
    'student_count', v_student_count,
    'message', CASE WHEN v_already_joined THEN 'Already enrolled in this classroom' ELSE 'Successfully enrolled in classroom' END
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.join_classroom(TEXT) TO authenticated;

-- Trigger to keep classrooms.student_count strictly synchronized with classroom_students
CREATE OR REPLACE FUNCTION public.sync_classroom_student_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.classrooms
    SET student_count = (SELECT count(*)::int FROM public.classroom_students WHERE classroom_id = NEW.classroom_id)
    WHERE id = NEW.classroom_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.classrooms
    SET student_count = (SELECT count(*)::int FROM public.classroom_students WHERE classroom_id = OLD.classroom_id)
    WHERE id = OLD.classroom_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_classroom_student_count ON public.classroom_students;
CREATE TRIGGER trigger_sync_classroom_student_count
AFTER INSERT OR DELETE ON public.classroom_students
FOR EACH ROW
EXECUTE FUNCTION public.sync_classroom_student_count();
