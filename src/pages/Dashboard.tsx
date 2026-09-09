import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ColorPreset } from '@/contexts/ThemeContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import SEO from '@/components/SEO';
import { BookOpen, Globe, Zap, BarChart3, Flame, Trophy, Clock, Star, Award, TrendingUp, Sun, Moon, Palette, Check } from 'lucide-react';
import { useUserStats, useReadingProgress, useAnalyticsStats } from '@/hooks/useAdminData';
import { ETHIOPIA_GRADE_9_LIBRARY_ITEMS } from '@/data/defaultLibraryItems';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const COLOR_PRESETS: Array<{ id: ColorPreset; label: string; bg: string }> = [
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
];

const Dashboard = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { theme, toggleTheme, colorPreset, setColorPreset } = useTheme();
  const { data: userStats } = useUserStats();
  const { data: readingProgressData } = useReadingProgress();
  const { data: platformStats } = useAnalyticsStats();

  // Real leaderboard from profiles + analytics
  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('user_id, name, subscription');
      if (!profiles) return [];
      
      // Get events per user for XP computation
      const { data: events } = await supabase.from('analytics_events').select('user_id, event_type, event_data');
      const { data: sessions } = await (supabase as any).from('user_sessions').select('user_id, duration_minutes');
      const { data: progress } = await supabase.from('reading_progress').select('user_id, progress_percent');
      
      return profiles.map(p => {
        const userEvents = (events || []).filter(e => e.user_id === p.user_id);
        const quizAttempts = userEvents.filter(e => e.event_type === 'quiz_attempt').length;
        const bookEvents = userEvents.filter(e => e.event_type === 'book_read').length;
        const aiQ = userEvents.filter(e => e.event_type === 'ai_question').length;
        const userSessions = (sessions || []).filter(s => s.user_id === p.user_id);
        const studyMin = Math.round(userSessions.reduce((a, s) => a + Number(s.duration_minutes || 0), 0));
        const completed = (progress || []).filter(r => r.user_id === p.user_id && Number(r.progress_percent) >= 100).length;
        const xp = (quizAttempts * 50) + (bookEvents * 30) + (aiQ * 5) + (completed * 100) + Math.floor(studyMin / 10);
        return { name: p.name || 'Anonymous', xp, userId: p.user_id };
      }).sort((a, b) => b.xp - a.xp).slice(0, 5);
    },
  });

  const xp = userStats?.xp || 0;
  const booksRead = userStats?.booksRead || 0;
  const studyMinutes = userStats?.studyMinutes || 0;
  const quizScore = userStats?.quizScore || 0;
  const streak = userStats?.streak || 0;

  const stats = [
    { icon: Star, label: t('xpPoints'), value: xp, color: 'text-primary' },
    { icon: BookOpen, label: t('booksRead'), value: booksRead, color: 'text-neon-cyan' },
    { icon: Clock, label: t('studyTime'), value: studyMinutes > 0 ? `${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m` : '0h 0m', color: 'text-secondary' },
    { icon: TrendingUp, label: t('quizScore'), value: `${quizScore}%`, color: 'text-primary' },
  ];

  const quickActions = [
    { icon: BookOpen, label: t('continueReading'), to: '/library', desc: 'Continue where you left off' },
    { icon: Globe, label: 'Galaxy Explorer', to: '/galaxy', desc: 'Explore 3D universe' },
    { icon: Zap, label: t('startQuiz'), to: '/quiz', desc: 'Test your knowledge' },
    { icon: BarChart3, label: t('studyAnalytics'), to: '/analytics', desc: 'View progress' },
  ];

  const universeFeatures = [
    { emoji: '🌍', label: 'Learning Worlds', to: '/worlds', desc: 'Enter immersive subject worlds', color: '#10b981' },
    { emoji: '⚔️', label: 'Quiz Battles', to: '/battles', desc: '1v1 real-time duels', color: '#ef4444' },
    { emoji: '🛡️', label: 'Study Guilds', to: '/guilds', desc: 'Join a knowledge guild', color: '#8b5cf6' },
    { emoji: '🌐', label: 'Study Rooms', to: '/rooms', desc: 'Collaborative study sessions', color: '#3b82f6' },
    { emoji: '🗺️', label: 'Galaxy Pathways', to: '/pathways', desc: 'Your adaptive learning route', color: '#f59e0b' },
    { emoji: '🎓', label: 'Classroom', to: '/classroom', desc: 'Teachers & students', color: '#ec4899' },
  ];

  const leaderboard = (leaderboardData || []).map((l, i) => ({
    name: l.userId === user?.id ? (profile?.name || 'You') : l.name,
    xp: l.xp,
    rank: i + 1,
    isMe: l.userId === user?.id,
  }));

  // If current user not in top 5, add them
  if (user && leaderboard.length > 0 && !leaderboard.find(l => l.isMe)) {
    leaderboard.push({ name: profile?.name || 'You', xp, rank: leaderboard.length + 1, isMe: true });
  }

  // Ensure at least something shows
  if (leaderboard.length === 0) {
    leaderboard.push({ name: profile?.name || 'You', xp, rank: 1, isMe: true });
  }

  const recentBooks = (readingProgressData || []).slice(0, 3).map(rp => {
    const defaultBook = ETHIOPIA_GRADE_9_LIBRARY_ITEMS.find(item => item.id === rp.content_item_id);
    const title = rp.title || defaultBook?.title || `Book ${rp.content_item_id.slice(0, 8)}`;
    return {
      title,
      progress: Number(rp.progress_percent) || 0,
    };
  });

  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4 transition-colors duration-300">
      <SEO
        title="Dashboard — Your Learning Progress | Knowledge Universe"
        description="Personal learning dashboard: track XP, streaks, quiz scores, reading progress, and leaderboard rank."
        path="/dashboard"
      />
      <GalaxyBackground />
      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="sr-only">Dashboard overview</h2>
        
        {/* Header with Theme Switcher */}
        <div className="mb-8 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-foreground">
              Welcome back, <span className="text-primary neon-text">{profile?.name || 'Explorer'}</span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-sm text-muted-foreground font-poppins">
                <Flame className="h-4 w-4 text-orange-500" />
                {streak} day streak
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground font-poppins">
                <Award className="h-4 w-4 text-primary" />
                {xp > 500 ? Math.floor(xp / 500) : 0} badges
              </span>
            </div>
          </div>

          {/* Theme Quick Controls */}
          <div className="glass rounded-2xl p-2.5 flex items-center gap-3 self-start sm:self-auto border border-border/80 shadow-md">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-orbitron font-semibold transition-all"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-purple-600" />}
              <span className="capitalize">{theme} Theme</span>
            </button>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setColorPreset(p.id)}
                  className={`w-5 h-5 rounded-full ${p.bg} transition-transform flex items-center justify-center ${colorPreset === p.id ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100'}`}
                  title={`${p.label} theme color`}
                >
                  {colorPreset === p.id && <Check className="h-3 w-3 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={s.label} className="glass rounded-2xl p-5 hover:neon-glow transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <s.icon className={`h-6 w-6 ${s.color} mb-2`} />
              <div className="font-orbitron text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground font-poppins mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions + Streak */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((a, i) => (
              <Link key={a.label} to={a.to}
                className="glass rounded-2xl p-5 hover:neon-glow transition-all duration-300 group hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${i * 0.1 + 0.4}s` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <a.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-sm font-semibold text-foreground">{a.label}</h3>
                    <p className="text-xs text-muted-foreground font-poppins">{a.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Universe Hub ── */}
          <div className="glass-strong rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.45s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-sm font-semibold text-foreground flex items-center gap-2">
                <span>🌌</span> Knowledge Universe
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase">
                {theme} Mode Active
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {universeFeatures.map((f, i) => (
                <Link key={f.to} to={f.to}
                  className="glass rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-all border border-transparent hover:border-opacity-40 hover:shadow-md group"
                  style={{ animationDelay: `${i * 0.06}s`, borderColor: `${f.color}40` }}>
                  <span className="text-2xl group-hover:scale-110 transition-transform">{f.emoji}</span>
                  <p className="font-orbitron text-xs font-bold text-foreground">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground font-poppins leading-tight">{f.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Daily Streak Calendar */}
          <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h3 className="font-orbitron text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              {t('dailyStreak')}
            </h3>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-md ${i < streak ? 'bg-primary/40' : 'bg-muted/40'} ${i === streak ? 'ring-2 ring-primary' : ''}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-poppins">{streak} days strong! 🔥</p>
          </div>
        </div>

        {/* Leaderboard + Recent Books */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <h3 className="font-orbitron text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              {t('leaderboard')}
            </h3>
            <div className="space-y-3">
              {leaderboard.map((l) => (
                <div key={l.rank} className={`flex items-center gap-3 p-2 rounded-xl ${l.isMe ? 'bg-primary/10 border border-primary/20' : ''}`}>
                  <span className={`font-orbitron text-sm font-bold w-6 text-center ${l.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {l.rank <= 3 ? ['🥇', '🥈', '🥉'][l.rank - 1] : `#${l.rank}`}
                  </span>
                  <span className="text-sm text-foreground font-poppins flex-1">{l.name}</span>
                  <span className="text-sm text-primary font-orbitron">{l.xp} XP</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <h3 className="font-orbitron text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-neon-cyan" />
              {t('recentBooks')}
            </h3>
            <div className="space-y-4">
              {recentBooks.length > 0 ? recentBooks.map((b) => (
                <div key={b.title}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground font-poppins">{b.title}</span>
                    <span className="text-primary font-orbitron text-xs">{b.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-neon-cyan transition-all duration-1000" style={{ width: `${b.progress}%` }} />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground font-poppins text-center py-4">No books read yet. Visit the Library to start reading!</p>
              )}
            </div>
            <Link to="/library" className="block mt-4 text-sm text-primary hover:underline font-poppins text-center">
              View All Books →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

