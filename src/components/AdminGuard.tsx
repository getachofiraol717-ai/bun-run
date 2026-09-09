import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import { isDesignatedAdminEmail } from '@/lib/adminAuth';

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const effectiveAdmin = isAdmin || isDesignatedAdminEmail(user?.email);

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <GalaxyBackground />
        <div className="font-orbitron text-primary neon-text animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  if (!effectiveAdmin) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 pt-16 pb-12">
        <GalaxyBackground />
        <div className="glass-strong rounded-2xl p-8 max-w-md text-center neon-glow border border-primary/30 relative z-10 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/30 mx-auto flex items-center justify-center mb-4 text-2xl">
            🔒
          </div>
          <h2 className="font-orbitron text-xl font-bold text-foreground mb-2">Administrator Access Required</h2>
          <p className="text-sm text-muted-foreground font-poppins mb-6">
            Your current account does not have administrator privileges assigned in the database.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href="/admin-login"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs font-semibold neon-glow inline-flex items-center justify-center"
            >
              Sign in as Admin
            </a>
            <a
              href="/dashboard"
              className="flex-1 py-2.5 rounded-xl glass border border-border text-foreground font-poppins text-xs font-medium inline-flex items-center justify-center hover:bg-primary/10"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
