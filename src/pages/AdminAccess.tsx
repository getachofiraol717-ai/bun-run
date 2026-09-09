import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import { Shield, ArrowRight, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';

const AdminAccess = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 pt-16 pb-12">
      <GalaxyBackground />
      <div className="relative z-10 w-full max-w-md glass-strong rounded-2xl p-8 neon-glow border border-primary/30 animate-slide-up">
        <button
          onClick={() => navigate('/settings')}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 font-poppins transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 mx-auto flex items-center justify-center mb-3 border border-primary/40">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-orbitron text-xl font-bold text-foreground">
            Administrator Gateway
          </h1>
          <p className="text-xs text-muted-foreground font-poppins mt-1">
            Knowledge Universe Production Admin Portal
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="glass rounded-xl p-3.5 text-xs font-poppins text-muted-foreground border border-border/40">
            <p className="text-foreground font-semibold mb-1 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" /> Role-Based Access Control
            </p>
            Access is restricted to verified system administrators with valid role entries in the database.
          </div>

          {isAuthenticated && isAdmin ? (
            <div className="glass rounded-xl p-3.5 text-xs font-poppins text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>You are currently authenticated as an active Administrator.</span>
            </div>
          ) : (
            <div className="glass rounded-xl p-3.5 text-xs font-poppins text-muted-foreground border border-border/40">
              <p className="text-foreground font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-cyan-400" /> Admin Credentials Required
              </p>
              Please authenticate using your verified administrator account to continue.
            </div>
          )}
        </div>

        {isAuthenticated && isAdmin ? (
          <Link
            to="/admin"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm font-semibold neon-glow flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
          >
            Launch Admin Portal <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/admin-login"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm font-semibold neon-glow flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
          >
            Proceed to Admin Login <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default AdminAccess;
