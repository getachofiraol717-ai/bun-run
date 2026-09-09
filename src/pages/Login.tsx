import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import { Rocket, Eye, EyeOff, Globe, LogIn, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type LoginView = 'login' | 'forgot_password' | 'forgot_sent';

const Login = () => {
  const { t, language, setLanguage } = useLanguage();
  const { login, loginWithGoogle, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [view, setView] = useState<LoginView>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || "Invalid email or password. Please register first if you don't have an account.");
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Will redirect — no navigate needed
    } catch {
      setGoogleLoading(false);
      toast.error('Google sign-in failed. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    const ok = await sendPasswordReset(resetEmail.trim());
    setResetLoading(false);
    if (ok) {
      setView('forgot_sent');
    } else {
      toast.error('Could not send reset email. Please check the address.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 pt-16">
      <GalaxyBackground />
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 neon-glow animate-slide-up">

        {/* ── FORGOT PASSWORD VIEWS ── */}
        {view === 'forgot_password' && (
          <>
            <button onClick={() => setView('login')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-6 font-poppins">
              <ArrowLeft className="h-3 w-3" /> Back to login
            </button>
            <div className="text-center mb-6">
              <Mail className="h-10 w-10 text-primary mx-auto mb-3" />
              <h1 className="font-orbitron text-xl font-bold text-foreground">Reset Password</h1>
              <p className="text-sm text-muted-foreground mt-1 font-poppins">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground font-poppins">{t('email')}</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-poppins"
                />
              </div>
              <button
                type="submit"
                disabled={resetLoading || !resetEmail.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-orbitron font-bold text-sm neon-glow hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50">
                {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        {view === 'forgot_sent' && (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">📧</div>
            <h1 className="font-orbitron text-xl font-bold text-foreground mb-2">Check Your Email</h1>
            <p className="text-sm text-muted-foreground font-poppins mb-6">
              A password reset link has been sent to <span className="text-primary">{resetEmail}</span>.<br />
              Check your inbox and follow the link to reset your password.
            </p>
            <button onClick={() => { setView('login'); setResetEmail(''); }}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm neon-glow">
              Back to Login
            </button>
          </div>
        )}

        {/* ── MAIN LOGIN ── */}
        {view === 'login' && (
          <>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Rocket className="h-8 w-8 text-primary" />
                <span className="font-orbitron text-2xl font-bold text-primary neon-text">KU</span>
              </div>
              <h1 className="font-orbitron text-xl font-bold text-foreground flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" />
                {t('login')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-poppins">{t('subtitle')}</p>
            </div>

            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full py-3 mb-4 rounded-xl glass border border-border hover:border-primary/50 text-foreground font-poppins text-sm font-medium flex items-center justify-center gap-3 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-poppins">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground font-poppins">{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-poppins"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground font-poppins">{t('password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    required
                    className="w-full mt-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-poppins pr-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-muted-foreground hover:text-primary">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive font-poppins">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-border bg-muted text-primary" />
                  <span className="text-xs text-muted-foreground font-poppins">{t('rememberMe')}</span>
                </label>
                <button type="button" onClick={() => setView('forgot_password')} className="text-xs text-primary hover:underline font-poppins">
                  {t('forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-orbitron font-bold text-sm neon-glow hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {loading ? 'Signing in...' : t('signIn')}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-poppins">
                {t('noAccount')}{' '}
                <Link to="/register" className="text-primary hover:underline font-semibold">{t('signUp')}</Link>
              </p>
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-transparent text-xs text-muted-foreground outline-none cursor-pointer"
                >
                  <option value="en">EN</option>
                  <option value="om">OM</option>
                  <option value="am">AM</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
