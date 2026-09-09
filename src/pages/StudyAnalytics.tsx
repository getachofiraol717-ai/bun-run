import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import { BarChart3, BookOpen, Clock, TrendingUp, Trophy, Flame, Star, Brain, Zap } from 'lucide-react';
import { useUserStats } from '@/hooks/useAdminData';

const StudyAnalytics = () => {
  const { user } = useAuth();
  const { data: userStats } = useUserStats();

  const userXP = userStats?.xp || 0;
  const userBooksRead = userStats?.booksRead || 0;
  const userStudyMinutes = userStats?.studyMinutes || 0;
  const userQuizScore = userStats?.quizScore || 0;
  const userStreak = userStats?.streak || 0;
  const quizLevel = userStats?.quizLevel || 1;

  const weeklyData = [
    { day: 'Mon', minutes: 0 },
    { day: 'Tue', minutes: 0 },
    { day: 'Wed', minutes: 0 },
    { day: 'Thu', minutes: 0 },
    { day: 'Fri', minutes: 0 },
    { day: 'Sat', minutes: 0 },
    { day: 'Sun', minutes: 0 },
  ];
  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);

  const subjectProgress = [
    { name: 'Mathematics', progress: 0, grade: '-', color: 'from-primary to-secondary' },
    { name: 'Physics', progress: 0, grade: '-', color: 'from-blue-500 to-cyan-400' },
    { name: 'Biology', progress: 0, grade: '-', color: 'from-green-500 to-emerald-400' },
    { name: 'Chemistry', progress: 0, grade: '-', color: 'from-purple-500 to-pink-400' },
    { name: 'English', progress: 0, grade: '-', color: 'from-orange-500 to-yellow-400' },
    { name: 'History', progress: 0, grade: '-', color: 'from-red-500 to-rose-400' },
  ];

  const stats = [
    { icon: Star, label: 'Total XP', value: userXP, color: 'text-primary' },
    { icon: BookOpen, label: 'Books Read', value: userBooksRead, color: 'text-cyan-400' },
    { icon: Clock, label: 'Study Time', value: userStudyMinutes > 0 ? `${Math.floor(userStudyMinutes / 60)}h ${userStudyMinutes % 60}m` : '0m', color: 'text-secondary' },
    { icon: TrendingUp, label: 'Quiz Score', value: `${userQuizScore}%`, color: 'text-primary' },
    { icon: Zap, label: 'Quiz Level', value: quizLevel, color: 'text-yellow-400' },
    { icon: Flame, label: 'Day Streak', value: userStreak, color: 'text-orange-500' },
  ];

  const achievements = [
    { name: 'Quick Learner', desc: 'Complete 5 quizzes', earned: quizLevel > 5 },
    { name: 'Book Worm', desc: 'Read 10 books', earned: userBooksRead >= 10 },
    { name: 'Quiz Master', desc: 'Score 90%+ on quiz', earned: userQuizScore >= 90 },
    { name: 'Streak Champion', desc: '7-day streak', earned: userStreak >= 7 },
    { name: 'Level 10', desc: 'Reach quiz level 10', earned: quizLevel >= 10 },
    { name: 'Level 50', desc: 'Reach quiz level 50', earned: quizLevel >= 50 },
    { name: 'Century', desc: 'Reach quiz level 100', earned: quizLevel >= 100 },
    { name: 'Legend', desc: 'Reach quiz level 1000', earned: quizLevel >= 1000 },
  ];

  const overallProgress = Math.min(Math.round(
    ((quizLevel / 100) * 25) +
    ((userBooksRead / 50) * 25) +
    ((userQuizScore / 100) * 25) +
    ((userStreak / 30) * 25)
  ), 100);

  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <GalaxyBackground />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-foreground">Study Analytics</h1>
          </div>
          <p className="text-muted-foreground font-poppins text-sm">Track your learning journey across the Knowledge Universe</p>
        </div>

        <div className="glass rounded-2xl p-5 mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-orbitron text-sm font-semibold text-foreground">Overall Progress</h3>
            <span className="font-orbitron text-lg font-bold text-primary">{overallProgress}%</span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000" style={{ width: `${overallProgress}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground font-poppins mt-1">Progress is calculated from quiz levels, books read, scores, and streaks</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {stats.map((s, i) => (
            <div key={s.label} className="glass rounded-2xl p-4 hover:neon-glow transition-all animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <s.icon className={`h-5 w-5 ${s.color} mb-1.5`} />
              <div className="font-orbitron text-xl font-bold text-foreground">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
              <div className="text-[10px] text-muted-foreground font-poppins mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-orbitron text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Weekly Study Time
            </h3>
            <div className="flex items-end gap-2 h-40">
              {weeklyData.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-poppins">{d.minutes}m</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-secondary transition-all duration-1000"
                    style={{ height: `${Math.max((d.minutes / maxMinutes) * 100, 2)}%` }} />
                  <span className="text-[10px] text-muted-foreground font-poppins">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <span className="text-xs text-muted-foreground font-poppins">
                Total: <span className="text-primary font-orbitron">{weeklyData.reduce((a, b) => a + b.minutes, 0)} min</span> this week
              </span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="font-orbitron text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Brain className="h-4 w-4 text-secondary" />
              Subject Progress
            </h3>
            <div className="space-y-3">
              {subjectProgress.map(s => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-poppins">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{s.grade}</span>
                      <span className="text-primary font-orbitron">{s.progress}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${s.color} transition-all duration-1000`} style={{ width: `${s.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-orbitron text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {achievements.map(a => (
              <div key={a.name} className={`rounded-xl p-3 text-center transition-all ${a.earned ? 'glass border border-primary/30' : 'bg-muted/20 border border-border/30 opacity-50'}`}>
                <div className="text-2xl mb-1">{a.earned ? '🏆' : '🔒'}</div>
                <div className="font-orbitron text-xs font-bold text-foreground">{a.name}</div>
                <div className="text-[10px] text-muted-foreground font-poppins mt-0.5">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyAnalytics;
