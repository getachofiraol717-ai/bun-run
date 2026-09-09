import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import SEO from '@/components/SEO';
import { Rocket, BookOpen, Bot, Star, Trophy, Zap, Shield, ArrowRight } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const features = [
    { icon: BookOpen, title: 'Digital Library', desc: 'Grade 1-12 books with interactive PDF reader, dark mode, and offline access.' },
    { icon: Bot, title: 'AI Tutor', desc: '24/7 AI-powered study assistant that explains lessons and solves homework.' },
    { icon: Zap, title: 'Smart Quizzes', desc: 'Adaptive quizzes with instant feedback, timers, and score tracking.' },
    { icon: Trophy, title: 'Gamification', desc: 'Earn XP, badges, and compete on leaderboards with fellow students.' },
    { icon: Star, title: '3D Galaxy Explorer', desc: 'Navigate subjects through an interactive 3D solar system.' },
    { icon: Shield, title: 'Study Analytics', desc: 'Track study time, books read, quiz scores, and daily streaks.' },
  ];

  return (
    <div className="min-h-screen relative">
      <SEO
        title="Knowledge Universe — AI-Powered Digital Learning for K–12"
        description="AI-powered digital learning platform for Grade 1–12 students, teachers, and schools. Read, learn, track, and grow."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Knowledge Universe",
          url: "/",
          potentialAction: {
            "@type": "SearchAction",
            target: "/library?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <GalaxyBackground />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 neon-glow">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-sm font-poppins text-primary">The Future of Digital Learning</span>
          </div>

          <h1 className="font-orbitron text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">{t('welcome').split('Knowledge')[0]}</span>
            <span className="text-primary neon-text">Knowledge</span>
            <br />
            <span className="text-secondary neon-text-purple">Universe</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground font-poppins mb-4 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>

          <p className="text-sm text-primary font-orbitron tracking-[0.3em] mb-10">
            {t('tagline')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="group px-8 py-4 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm font-bold neon-glow hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <Rocket className="h-5 w-5 group-hover:animate-bounce" />
                  Dashboard
                </Link>
                <Link
                  to="/library"
                  className="px-8 py-4 rounded-xl glass border border-primary/30 text-primary font-orbitron text-sm font-bold hover:bg-primary/10 transition-all duration-300 flex items-center gap-2"
                >
                  <BookOpen className="h-5 w-5" />
                  {t('exploreBooks')}
                </Link>
                <Link
                  to="/galaxy"
                  className="px-8 py-4 rounded-xl glass border border-secondary/30 text-secondary font-orbitron text-sm font-bold hover:bg-secondary/10 transition-all duration-300 flex items-center gap-2"
                >
                  <Star className="h-5 w-5" />
                  {t('galaxy')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group px-8 py-4 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm font-bold neon-glow hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <Rocket className="h-5 w-5 group-hover:animate-bounce" />
                  {t('startLearning')}
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 rounded-xl glass border border-primary/30 text-primary font-orbitron text-sm font-bold hover:bg-primary/10 transition-all duration-300 flex items-center gap-2"
                >
                  {t('login')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-orbitron text-3xl sm:text-4xl font-bold text-center mb-4">
            <span className="text-primary neon-text">Explore</span>{' '}
            <span className="text-foreground">The Universe</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 font-poppins max-w-xl mx-auto">
            Everything you need to master your education journey
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 hover:neon-glow transition-all duration-500 hover:-translate-y-2 group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-orbitron text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground font-poppins">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-8 sm:p-12 neon-glow">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Students' },
              { value: '500+', label: 'Books' },
              { value: '1000+', label: 'Quizzes' },
              { value: '12', label: 'Grades' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-orbitron text-3xl sm:text-4xl font-bold text-primary neon-text">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1 font-poppins">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-orbitron text-primary font-bold">Knowledge Universe</span>
          </div>
          <p className="text-sm text-muted-foreground font-poppins">
            Built by Firee Getacho • Empowering students through digital education
          </p>
          <p className="text-xs text-muted-foreground/50 mt-2">© 2026 Knowledge Universe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
