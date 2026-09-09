import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import GalaxyBackground from '@/components/GalaxyBackground';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap, Plus, Users, BookOpen, ClipboardList,
  ArrowLeft, Copy, CheckCircle2, Star, Zap, ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade: number;
  join_code: string;
  is_active: boolean;
  student_count: number;
  teacher_id: string;
  created_at?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_xp: number;
  created_at: string;
}

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography'];

const ClassroomMode = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<'list' | 'join'>('list');
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newGrade, setNewGrade] = useState(9);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');

  const isTeacher = (profile as any)?.role === 'teacher' || (profile as any)?.subscription === 'premium' || (profile as any)?.role === 'admin';

  // 1. My classrooms (as creator / teacher)
  const { data: myClassrooms = [], isLoading: loadingMyClasses } = useQuery<Classroom[]>({
    queryKey: ['my_classrooms', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('classrooms')
        .select('*')
        .eq('teacher_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teacher classrooms:', error);
        return [];
      }
      return data || [];
    },
  });

  // 2. Enrolled classrooms (as student)
  const { data: enrolledClassrooms = [], isLoading: loadingEnrolled } = useQuery<Classroom[]>({
    queryKey: ['enrolled_classrooms', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: enrollments, error: enrollErr } = await (supabase as any)
        .from('classroom_students')
        .select('classroom_id')
        .eq('user_id', user!.id);

      if (enrollErr || !enrollments?.length) return [];
      const ids = enrollments.map((r: any) => r.classroom_id);
      
      const { data: classes, error: classErr } = await (supabase as any)
        .from('classrooms')
        .select('*')
        .in('id', ids)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (classErr) {
        console.error('Error fetching enrolled classrooms:', classErr);
        return [];
      }
      return classes || [];
    },
  });

  // 3. Assignments for selected classroom
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<Assignment[]>({
    queryKey: ['assignments', selectedClass?.id],
    enabled: !!selectedClass?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('classroom_assignments')
        .select('*')
        .eq('classroom_id', selectedClass!.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching classroom assignments:', error);
        return [];
      }
      return data || [];
    },
  });

  // Create classroom mutation
  const createClassroom = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('You must be signed in to create a classroom');
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await (supabase as any).from('classrooms').insert({
        name: newName.trim(),
        subject: newSubject,
        grade: newGrade,
        teacher_id: user.id,
        join_code: generatedCode,
        is_active: true,
        student_count: 0,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my_classrooms'] });
      setCreating(false);
      setNewName('');
      toast.success(`🎓 Classroom "${data?.name || 'New Class'}" created! Join code: ${data?.join_code}`);
    },
    onError: (e: any) => toast.error(e.message || 'Failed to create classroom'),
  });

  // Join classroom via server-side RPC
  const joinClassroom = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Please sign in to join a classroom');
      const cleanCode = joinCode.trim().toUpperCase();
      if (!cleanCode || cleanCode.length < 6) {
        throw new Error('Please enter a valid 6-character join code');
      }

      const { data, error } = await (supabase as any).rpc('join_classroom', {
        p_join_code: cleanCode,
      });

      if (error) {
        throw new Error(error.message || 'Could not join classroom. Please check your join code.');
      }
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['enrolled_classrooms'] });
      qc.invalidateQueries({ queryKey: ['my_classrooms'] });
      setJoinCode('');
      setView('list');
      toast.success(data?.message || '✅ Successfully enrolled in classroom!');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not join classroom'),
  });

  // Add assignment mutation
  const addAssignment = useMutation({
    mutationFn: async () => {
      if (!selectedClass) throw new Error('No classroom selected');
      if (!newAssignTitle.trim()) throw new Error('Assignment title is required');

      const { error } = await (supabase as any).from('classroom_assignments').insert({
        classroom_id: selectedClass.id,
        title: newAssignTitle.trim(),
        description: newAssignDesc.trim() || null,
        max_xp: 100,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', selectedClass?.id] });
      setNewAssignTitle('');
      setNewAssignDesc('');
      toast.success('📋 Assignment added successfully!');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to add assignment'),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success('Join code copied to clipboard!');
  };

  const isSelectedClassTeacher = selectedClass?.teacher_id === user?.id;
  const isSelectedClassEnrolled = enrolledClassrooms.some(c => c.id === selectedClass?.id);
  const isAuthorizedForSelected = isSelectedClassTeacher || isSelectedClassEnrolled;

  // ── Classroom detail view ──────────────────────────────────
  if (selectedClass) {
    if (!isAuthorizedForSelected) {
      return (
        <div className="min-h-screen relative pt-20 pb-10 px-4">
          <GalaxyBackground />
          <div className="max-w-md mx-auto relative z-10 glass-strong rounded-2xl p-6 text-center border border-red-500/30">
            <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h2 className="font-orbitron text-lg font-bold text-foreground mb-2">Access Restricted</h2>
            <p className="text-xs text-muted-foreground font-poppins mb-5">
              You are not enrolled in or managing this classroom. Please enter the classroom join code to participate.
            </p>
            <button
              onClick={() => setSelectedClass(null)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs"
            >
              Back to Classrooms
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen relative pt-20 pb-10 px-4">
        <GalaxyBackground />
        <div className="max-w-3xl mx-auto relative z-10">
          <button
            onClick={() => setSelectedClass(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-poppins mb-5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Classrooms
          </button>

          <div className="glass-strong rounded-2xl p-6 mb-5 border border-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-orbitron text-xl font-bold text-foreground">{selectedClass.name}</h2>
                <p className="text-sm text-muted-foreground font-poppins">{selectedClass.subject} · Grade {selectedClass.grade}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-primary/30">
                  <span className="font-orbitron text-base font-bold text-primary tracking-widest">{selectedClass.join_code}</span>
                  <button onClick={() => copyCode(selectedClass.join_code)} className="text-muted-foreground hover:text-primary transition-colors" title="Copy Code">
                    {copiedCode ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground font-poppins mt-1">Share join code</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-poppins text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {selectedClass.student_count || 0} enrolled {selectedClass.student_count === 1 ? 'student' : 'students'}
              </span>
              <Link
                to={`/library?subject=${encodeURIComponent(selectedClass.subject)}`}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <BookOpen className="h-3 w-3" /> Class Textbooks
              </Link>
            </div>
          </div>

          {/* Assignments */}
          <div className="glass rounded-2xl p-5 mb-4">
            <h3 className="font-orbitron text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Assignments ({assignments.length})
            </h3>
            <div className="space-y-2 mb-4">
              {assignments.map((a) => (
                <div key={a.id} className="glass rounded-xl p-3 border border-border/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-poppins text-sm font-semibold text-foreground">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground font-poppins mt-0.5">{a.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-poppins shrink-0">
                      <Star className="h-3 w-3" /> {a.max_xp} XP
                    </div>
                  </div>
                  {a.due_date && (
                    <p className="text-[10px] text-muted-foreground font-poppins mt-1">
                      Due: {new Date(a.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-sm text-muted-foreground font-poppins text-center py-4">No assignments yet.</p>
              )}
            </div>

            {isSelectedClassTeacher && (
              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs font-orbitron text-muted-foreground">Add Assignment</p>
                <input
                  value={newAssignTitle}
                  onChange={(e) => setNewAssignTitle(e.target.value)}
                  placeholder="Assignment title..."
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none"
                />
                <input
                  value={newAssignDesc}
                  onChange={(e) => setNewAssignDesc(e.target.value)}
                  placeholder="Description (optional)..."
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none"
                />
                <button
                  onClick={() => addAssignment.mutate()}
                  disabled={!newAssignTitle.trim() || addAssignment.isPending}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Assignment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const hasAnyClassrooms = myClassrooms.length > 0 || enrolledClassrooms.length > 0;
  const isLoading = loadingMyClasses || loadingEnrolled;

  // ── Main classroom list ────────────────────────────────────
  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <GalaxyBackground />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-primary neon-text flex items-center gap-3">
              <GraduationCap className="h-8 w-8" /> Classroom
            </h1>
            <p className="text-muted-foreground font-poppins text-sm mt-1">
              AI-assisted classrooms for teachers and students across Ethiopia.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView(view === 'join' ? 'list' : 'join')}
              className="px-4 py-2.5 rounded-xl glass border border-border font-orbitron text-xs hover:bg-muted/40 transition-all"
            >
              {view === 'join' ? 'Close' : 'Join Room'}
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow hover:scale-105 transition-all"
            >
              <Plus className="h-4 w-4" /> Create Class
            </button>
          </div>
        </div>

        {/* Join classroom input (inline) */}
        {view === 'join' && (
          <div className="glass-strong rounded-2xl p-5 mb-5 border border-primary/20 animate-slide-up">
            <h3 className="font-orbitron text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Enter Classroom Join Code
            </h3>
            <p className="text-xs text-muted-foreground font-poppins mb-3">
              Ask your teacher or school instructor for the 6-character classroom code.
            </p>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-char code..."
                maxLength={6}
                className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none uppercase tracking-widest font-mono"
              />
              <button
                onClick={() => joinClassroom.mutate()}
                disabled={joinCode.trim().length < 6 || joinClassroom.isPending}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow disabled:opacity-50 font-bold"
              >
                {joinClassroom.isPending ? 'Joining...' : 'Join'}
              </button>
              <button
                onClick={() => { setView('list'); setJoinCode(''); }}
                className="px-3 py-2.5 rounded-xl glass text-xs font-poppins text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Teacher's created classrooms */}
        {myClassrooms.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-muted-foreground font-poppins uppercase tracking-widest mb-3">
              My Created Classrooms ({myClassrooms.length})
            </p>
            <div className="space-y-3">
              {myClassrooms.map((cls, i) => (
                <div
                  key={cls.id}
                  className="glass-strong rounded-2xl p-4 flex items-center justify-between border border-primary/15 hover:border-primary/30 transition-all animate-slide-up"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-orbitron text-sm font-bold text-foreground">{cls.name}</p>
                      <p className="text-[10px] text-muted-foreground font-poppins">
                        {cls.subject} · Grade {cls.grade} · {cls.student_count || 0} {cls.student_count === 1 ? 'student' : 'students'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-orbitron text-xs text-primary tracking-widest font-mono bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                      {cls.join_code}
                    </span>
                    <button
                      onClick={() => setSelectedClass(cls)}
                      className="px-3 py-1.5 rounded-xl glass border border-border text-xs font-poppins text-foreground hover:bg-muted/40 transition-all"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student's enrolled classrooms */}
        {enrolledClassrooms.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-muted-foreground font-poppins uppercase tracking-widest mb-3">
              Enrolled Classrooms ({enrolledClassrooms.length})
            </p>
            <div className="space-y-3">
              {enrolledClassrooms.map((cls, i) => (
                <div
                  key={cls.id}
                  className="glass-strong rounded-2xl p-4 flex items-center justify-between border border-border/30 hover:border-primary/20 transition-all animate-slide-up"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-orbitron text-sm font-bold text-foreground">{cls.name}</p>
                      <p className="text-[10px] text-muted-foreground font-poppins">{cls.subject} · Grade {cls.grade}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClass(cls)}
                    className="px-3 py-1.5 rounded-xl glass border border-border text-xs font-poppins hover:bg-muted/40 transition-all"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Honest Empty State when no classrooms exist */}
        {!isLoading && !hasAnyClassrooms && (
          <div className="space-y-6">
            <div className="glass-strong rounded-2xl p-8 text-center border border-primary/20">
              <GraduationCap className="h-12 w-12 text-primary mx-auto mb-3" />
              <h2 className="font-orbitron text-lg font-bold text-foreground mb-1">No Classrooms Yet</h2>
              <p className="text-muted-foreground font-poppins text-xs mb-6 max-w-md mx-auto">
                {isTeacher
                  ? 'Create your first classroom and share the 6-character join code with your students to assign missions and track learning progress.'
                  : 'You are not enrolled in any classrooms yet. Enter a join code provided by your teacher to access your class curriculum and assignments.'}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setView('join')}
                  className="px-4 py-2 rounded-xl glass border border-primary/40 text-primary font-orbitron text-xs hover:bg-primary/10 transition-colors"
                >
                  Enter Join Code
                </button>
                <button
                  onClick={() => setCreating(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow hover:scale-105 transition-all"
                >
                  Create Classroom
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create classroom modal */}
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
            <div className="glass-strong rounded-2xl p-6 max-w-sm w-full neon-glow animate-slide-up border border-primary/30">
              <h3 className="font-orbitron text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> New Classroom
              </h3>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-[10px] text-muted-foreground font-poppins mb-1 block">Classroom Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Grade 11 Physics Section A"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-poppins mb-1 block">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-poppins mb-1 block">Grade Level</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCreating(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-orbitron text-xs hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createClassroom.mutate()}
                  disabled={!newName.trim() || createClassroom.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow disabled:opacity-50 font-bold"
                >
                  {createClassroom.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomMode;

