import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import { LogOut, Rocket, CheckCircle } from 'lucide-react';

const Logout = () => {
  const { logout, isAuthenticated, user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loggedOut, setLoggedOut] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLoggedOut(true);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (!isAuthenticated && !loggedOut) {
      navigate('/login');
    }
  }, [isAuthenticated, loggedOut, navigate]);

  if (loggedOut) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 pt-16">
        <GalaxyBackground />
        <div className="w-full max-w-md glass-strong rounded-2xl p-8 neon-glow animate-slide-up text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4 animate-pulse" />
          <h1 className="font-orbitron text-2xl font-bold text-foreground mb-2">
            Successfully Logged Out
          </h1>
          <p className="text-muted-foreground font-poppins mb-6">
            Thank you for exploring the Knowledge Universe. See you next time, space traveler! 🚀
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-all font-poppins text-sm"
            >
              Go Home
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-orbitron font-bold text-sm neon-glow hover:scale-[1.02] transition-all duration-300"
            >
              Log In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 pt-16">
      <GalaxyBackground />
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 neon-glow animate-slide-up text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Rocket className="h-8 w-8 text-primary" />
          <span className="font-orbitron text-2xl font-bold text-primary neon-text">KU</span>
        </div>

        <LogOut className="h-14 w-14 text-destructive mx-auto mb-4" />

        <h1 className="font-orbitron text-xl font-bold text-foreground mb-2">
          Leaving the Universe?
        </h1>
        <p className="text-muted-foreground font-poppins text-sm mb-2">
          You are currently logged in as:
        </p>
        <div className="glass rounded-xl p-3 mb-6">
          <p className="font-orbitron text-primary text-sm font-bold">{profile?.name || user?.email}</p>
79:           <p className="text-muted-foreground text-xs font-poppins">{user?.email}</p>
80:           <p className="text-xs text-muted-foreground/70 font-poppins capitalize mt-1">
81:             {profile?.subscription || 'free'} plan
82:           </p>
        </div>

        <p className="text-muted-foreground font-poppins text-sm mb-6">
          Are you sure you want to log out? Your progress is saved automatically.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all font-poppins text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-orbitron font-bold text-sm hover:scale-[1.02] transition-all duration-300"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;
