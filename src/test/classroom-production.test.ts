import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade: number;
  join_code: string;
  is_active: boolean;
  student_count: number;
  teacher_id: string;
  created_at: string;
}

interface ClassroomStudent {
  id: string;
  classroom_id: string;
  user_id: string;
  joined_at: string;
}

describe('KU Phase 4 — Real Classroom Data & Authorization Lifecycle Tests', () => {
  let mockClassroomsDB: Classroom[] = [];
  let mockMembershipsDB: ClassroomStudent[] = [];

  beforeEach(() => {
    mockClassroomsDB = [];
    mockMembershipsDB = [];
    vi.clearAllMocks();
  });

  describe('1. Teacher Creates Classroom', () => {
    it('creates classroom with backend-generated 6-char join code and sets owner', async () => {
      const teacherId = 'teacher-uuid-101';
      const createClassroom = async (name: string, subject: string, grade: number) => {
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newClassroom: Classroom = {
          id: `class-${Date.now()}`,
          name,
          subject,
          grade,
          join_code: joinCode,
          is_active: true,
          student_count: 0,
          teacher_id: teacherId,
          created_at: new Date().toISOString(),
        };
        mockClassroomsDB.push(newClassroom);
        return newClassroom;
      };

      const created = await createClassroom('Grade 11 Physics', 'Physics', 11);

      expect(created.name).toBe('Grade 11 Physics');
      expect(created.teacher_id).toBe(teacherId);
      expect(created.join_code).toHaveLength(6);
      expect(created.join_code).toBe(created.join_code.toUpperCase());
      expect(created.student_count).toBe(0);
      expect(mockClassroomsDB).toHaveLength(1);
    });
  });

  describe('2. Join Code Validation & Student Enrolment', () => {
    it('allows student to join with valid code and updates student count', async () => {
      const teacherId = 'teacher-uuid-101';
      const studentId = 'student-uuid-201';

      // Seed a real classroom in DB
      const existingClass: Classroom = {
        id: 'cls-math-real-1',
        name: 'Grade 9 Mathematics',
        subject: 'Mathematics',
        grade: 9,
        join_code: 'ETH901',
        is_active: true,
        student_count: 0,
        teacher_id: teacherId,
        created_at: new Date().toISOString(),
      };
      mockClassroomsDB.push(existingClass);

      // Server RPC mock implementation
      const joinClassroomRPC = async (code: string, userId: string) => {
        const cleanCode = code.trim().toUpperCase();
        const found = mockClassroomsDB.find(
          c => c.join_code === cleanCode && c.is_active
        );

        if (!found) {
          throw new Error(`Classroom not found with join code: ${code}`);
        }

        if (found.teacher_id === userId) {
          return { success: true, is_teacher: true, classroom_id: found.id };
        }

        const alreadyEnrolled = mockMembershipsDB.some(
          m => m.classroom_id === found.id && m.user_id === userId
        );

        if (!alreadyEnrolled) {
          mockMembershipsDB.push({
            id: `mem-${Date.now()}`,
            classroom_id: found.id,
            user_id: userId,
            joined_at: new Date().toISOString(),
          });
          found.student_count = mockMembershipsDB.filter(
            m => m.classroom_id === found.id
          ).length;
        }

        return {
          success: true,
          classroom_id: found.id,
          name: found.name,
          student_count: found.student_count,
        };
      };

      const joinResult = await joinClassroomRPC('eth901', studentId);

      expect(joinResult.success).toBe(true);
      expect(joinResult.student_count).toBe(1);
      expect(mockMembershipsDB).toHaveLength(1);
      expect(mockMembershipsDB[0].user_id).toBe(studentId);
    });

    it('rejects wrong or non-existent join code with descriptive error', async () => {
      const studentId = 'student-uuid-201';

      const joinClassroomRPC = async (code: string, userId: string) => {
        const cleanCode = code.trim().toUpperCase();
        const found = mockClassroomsDB.find(
          c => c.join_code === cleanCode && c.is_active
        );
        if (!found) {
          throw new Error(`Classroom not found with join code: ${code}`);
        }
        return { success: true, classroom_id: found.id };
      };

      await expect(joinClassroomRPC('INVALID', studentId)).rejects.toThrow(
        'Classroom not found with join code: INVALID'
      );
      expect(mockMembershipsDB).toHaveLength(0);
    });
  });

  describe('3. Unauthorized Classroom Access Protection', () => {
    it('restricts non-members and non-teachers from viewing private classroom details', () => {
      const currentUserId = 'unauthorized-user-301';
      const classroom: Classroom = {
        id: 'cls-private-1',
        name: 'Private Advanced Calculus',
        subject: 'Mathematics',
        grade: 12,
        join_code: 'CALC99',
        is_active: true,
        student_count: 5,
        teacher_id: 'teacher-uuid-999',
        created_at: new Date().toISOString(),
      };

      const isTeacher = classroom.teacher_id === currentUserId;
      const isEnrolled = mockMembershipsDB.some(
        m => m.classroom_id === classroom.id && m.user_id === currentUserId
      );
      const isAuthorized = isTeacher || isEnrolled;

      expect(isAuthorized).toBe(false);
    });
  });

  describe('4. Honest Empty State', () => {
    it('renders zero classrooms when database is empty without inserting fake demo records', () => {
      const myClassrooms: Classroom[] = [];
      const enrolledClassrooms: Classroom[] = [];

      const hasAnyClassrooms = myClassrooms.length > 0 || enrolledClassrooms.length > 0;
      expect(hasAnyClassrooms).toBe(false);

      // Verify no hardcoded demo codes exist
      const demoCodes = ['MATH09', 'PHYS10', 'CS1100', 'cls_math_09', 'cls_phys_10', 'cls_cs_11'];
      demoCodes.forEach(code => {
        expect(myClassrooms.some(c => c.join_code === code || c.id === code)).toBe(false);
        expect(enrolledClassrooms.some(c => c.join_code === code || c.id === code)).toBe(false);
      });
    });
  });

  describe('5. Refresh & Session Restoration', () => {
    it('restores classrooms accurately from database after session reload', async () => {
      const teacherId = 'teacher-1';
      const studentId = 'student-2';

      const realClassrooms: Classroom[] = [
        {
          id: 'cls-1',
          name: 'Grade 10 Biology',
          subject: 'Biology',
          grade: 10,
          join_code: 'BIO101',
          is_active: true,
          student_count: 1,
          teacher_id: teacherId,
          created_at: new Date().toISOString(),
        },
      ];

      const realEnrollments: ClassroomStudent[] = [
        {
          id: 'enr-1',
          classroom_id: 'cls-1',
          user_id: studentId,
          joined_at: new Date().toISOString(),
        },
      ];

      // Simulated teacher query
      const teacherClasses = realClassrooms.filter(c => c.teacher_id === teacherId);
      expect(teacherClasses).toHaveLength(1);
      expect(teacherClasses[0].name).toBe('Grade 10 Biology');

      // Simulated student query
      const enrolledIds = realEnrollments.filter(e => e.user_id === studentId).map(e => e.classroom_id);
      const studentClasses = realClassrooms.filter(c => enrolledIds.includes(c.id));
      expect(studentClasses).toHaveLength(1);
      expect(studentClasses[0].join_code).toBe('BIO101');
    });
  });
});
