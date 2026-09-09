import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import PhoneInput from '@/components/PhoneInput';
import { Rocket, Eye, EyeOff, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const { t, language, setLanguage } = useLanguage();
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      const fullPhone = phone.trim() ? phone.trim() : undefined;
      await register(name, email, password, fullPhone);
      toast.success('Account created! Welcome to Knowledge Universe.');
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      setGoogleLoading(false);
      toast.error('Google sign-up failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 pt-16 pb-8">
      <GalaxyBackground />
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 neon-glow animate-slide-up">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
            <span className="font-orbitron text-2xl font-bold text-primary neon-text">KU</span>
          </div>
          <h1 className="font-orbitron text-xl font-bold text-foreground">{t('register')}</h1>
        </div>

        {/* Google Sign-Up */}
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
          {googleLoading ? 'Connecting...' : 'Sign up with Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-poppins">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground font-poppins">{t('name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:border-primary outline-none transition-all font-poppins" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-poppins">{t('email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:border-primary outline-none transition-all font-poppins" />
          </div>

          {/* Phone Number Field */}
          <PhoneInput
            value={phone}
            onChange={setPhone}
            optional
            label="Phone Number"
          />
          <div>
            <label className="text-sm text-muted-foreground font-poppins">{t('password')}</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:border-primary outline-none transition-all font-poppins pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-poppins">{t('confirmPassword')}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:border-primary outline-none transition-all font-poppins" />
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select value={language} onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-muted text-foreground text-sm rounded-lg px-3 py-2 border border-border flex-1 outline-none font-poppins">
              <option value="en">English</option>
              <option value="om">Afaan Oromoo</option>
              <option value="am">አማርኛ</option>
            </select>
          </div>
          {error && <p className="text-destructive text-sm font-poppins">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-orbitron font-bold text-sm neon-glow hover:scale-[1.02] transition-all duration-300 mt-2 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Creating Account...' : t('signUp')}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-muted-foreground font-poppins">
          {t('haveAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
