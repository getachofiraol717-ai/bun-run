import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import GalaxyBackground from '@/components/GalaxyBackground';
import SEO from '@/components/SEO';
import { KeyRound, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Record<string, string>>({});
  const [showDiag, setShowDiag] = useState(false);

  useEffect(() => {
    // Recovery links arrive as #access_token=...&type=recovery (or ?code=... for PKCE).
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    const hashError = hashParams.get('error_description');
    if (hashError) setError(hashError);

    const diag: Record<string, string> = {
      'Link type': hashParams.get('type') || params.get('type') || 'none',
      'Access token in link': hashParams.has('access_token') ? 'yes' : 'no',
      'PKCE code in link': params.has('code') ? 'yes' : 'no',
      'Link error': hashParams.get('error') || params.get('error') || 'none',
      'Link error detail': hashError || params.get('error_description') || 'none',
      'Opened at': new Date().toLocaleString(),
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setDiagnostics(d => ({ ...d, 'Auth event': event, 'Recovery session': session ? 'active' : 'none' }));
      if (event === 'PASSWORD_RECOVERY' || session) {
        setValidLink(true);
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const looksLikeRecovery = hash.includes('type=recovery') || params.has('code');
      setValidLink(!!session || looksLikeRecovery);
      setDiagnostics({
        ...diag,
        'Recovery session': session ? 'active' : 'none',
        'Session user': session?.user?.email ?? 'none',
        'Session expires': session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'n/a',
      });
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updErr) {
      setError(`${updErr.message}${(updErr as { status?: number }).status ? ` (code ${(updErr as { status?: number }).status})` : ''}`);
      return;
    }
    setDone(true);
    toast.success('Password updated. You can sign in now.');
    setTimeout(() => navigate('/login'), 1800);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 pt-16">
      <SEO
        title="Reset Password | Knowledge Universe"
        description="Set a new password for your Knowledge Universe account."
        path="/reset-password"
      />
      <GalaxyBackground />
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 neon-glow animate-slide-up">
        <button onClick={() => navigate('/login')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-6 font-poppins">
          <ArrowLeft className="h-3 w-3" /> Back to login
        </button>

        <div className="text-center mb-6">
          <KeyRound className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="font-orbitron text-xl font-bold text-foreground">New Password</h1>
          <p className="text-sm text-muted-foreground mt-1 font-poppins">Choose a new password for your account</p>
        </div>

        {!ready && (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        )}

        {ready && done && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm text-muted-foreground font-poppins">Password updated. Redirecting to login…</p>
          </div>
        )}

        {ready && !done && !validLink && (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm text-muted-foreground font-poppins">
              This reset link is invalid or has expired. Request a new one from the login page.
            </p>
            {error && <p className="text-xs text-destructive font-poppins">{error}</p>}
            <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm neon-glow">
              Back to Login
            </button>
            <div className="text-left">
              <button
                type="button"
                onClick={() => setShowDiag(v => !v)}
                className="text-xs text-primary hover:underline font-poppins"
              >
                {showDiag ? 'Hide link diagnostics' : 'Show link diagnostics'}
              </button>
              {showDiag && (
                <div className="mt-2 p-3 rounded-xl bg-muted border border-border space-y-1">
                  {Object.entries(diagnostics).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 text-[11px] font-poppins">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-foreground text-right break-all">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {ready && !done && validLink && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground font-poppins">New password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  placeholder="••••••••"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-poppins pr-10"
                />
                <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-muted-foreground hover:text-primary">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground font-poppins">Confirm password</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                required
                placeholder="••••••••"
                className="w-full mt-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-poppins"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive font-poppins">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-orbitron font-bold text-sm neon-glow hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
