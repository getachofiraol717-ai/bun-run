import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import { Shield, Eye, EyeOff, LogIn, ArrowLeft, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { isDesignatedAdminEmail, ensureAdminRoleInDatabase } from '@/lib/adminAuth';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, logout, isAdmin, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in and verified as admin, redirect to panel
  React.useEffect(() => {
    if (user && (isAdmin || isDesignatedAdminEmail(user.email))) {
      navigate('/admin');
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Authenticate with Supabase Auth
      const res = await login(cleanEmail, password);

      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email and password.');
        setLoading(false);
        return;
      }

      // 2. Query Supabase for authoritative user_roles
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setErrorMessage('Authentication session could not be established.');
        setLoading(false);
        return;
      }

      const isOwner = isDesignatedAdminEmail(cleanEmail) || isDesignatedAdminEmail(authUser.email);

      if (isOwner) {
        // Self-heal admin role in DB
        await ensureAdminRoleInDatabase(supabase, authUser.id);
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id);

      const hasAdminRole = isOwner || (!roleError && roleData?.some((r: { role: string }) => r.role === 'admin'));

      if (!hasAdminRole) {
        await logout();
        setErrorMessage('Access Denied: This account does not have administrator privileges.');
        toast.error('Access Denied: Administrator role required.');
        setLoading(false);
        return;
      }

      toast.success('Administrator authenticated. Welcome to the Control Plane.');
      navigate('/admin');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred during administrator authentication.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 pt-16 pb-12">
      <GalaxyBackground />
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="glass-strong rounded-2xl p-8 neon-glow border border-primary/30">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-poppins transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[10px] font-orbitron font-semibold uppercase tracking-wider flex items-center gap-1">
              <Shield className="h-3 w-3" /> Secure Portal
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/40 mx-auto flex items-center justify-center mb-3">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-orbitron text-xl font-bold text-foreground">
              Administrator Login
            </h1>
            <p className="text-xs text-muted-foreground font-poppins mt-1">
              Sign in with your verified system administrator account
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-poppins flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground font-poppins block mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-muted/70 border border-border focus:border-primary outline-none font-poppins text-sm text-foreground transition-all"
                placeholder="admin@knowledgeuniverse.app"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground font-poppins block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl bg-muted/70 border border-border focus:border-primary outline-none font-poppins text-sm text-foreground pr-10 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm font-semibold neon-glow flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Authenticate & Enter</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground font-poppins">
              Not an administrator?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Standard Student / Teacher Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
