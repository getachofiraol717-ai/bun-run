import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNav } from '@/contexts/NavContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Menu, X, Globe, LogOut, Rocket, Sun, Moon, Settings as SettingsIcon, Shield } from 'lucide-react';
import kuAppIcon from '@/assets/images/ku_app_icon_1787216080921.jpg';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated, isAdmin } = useAuth();
  const { navItems } = useNav();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const visibleItems = navItems
    .filter(item => item.visible)
    .filter(item => !item.authRequired || isAuthenticated)
    .sort((a, b) => a.order - b.order);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-primary/40 shadow-sm group-hover:border-primary group-hover:shadow-primary/30 transition-all flex items-center justify-center bg-primary/10">
              <img src={kuAppIcon} alt="Knowledge Universe Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-orbitron text-lg font-bold text-primary neon-text">KU</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {visibleItems.map(item => (
              <NavLink
                key={item.id}
                to={item.to}
                className="px-3 py-2 rounded-lg text-sm font-poppins transition-all duration-300 text-muted-foreground hover:text-primary hover:bg-primary/5"
                activeClassName="text-primary neon-text bg-primary/10"
              >
                {item.label}
              </NavLink>
            ))}

            {isAuthenticated && isAdmin && (
              <NavLink
                to="/admin"
                className="px-3 py-1.5 rounded-lg text-xs font-orbitron font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center gap-1.5 ml-1"
                activeClassName="text-emerald-300 bg-emerald-500/25 border-emerald-400 shadow-sm shadow-emerald-500/20"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </NavLink>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-muted text-foreground text-xs rounded-lg px-2 py-1.5 border border-border focus:border-primary outline-none"
            >
              <option value="en">EN</option>
              <option value="om">OM</option>
              <option value="am">AM</option>
            </select>

            {/* Settings Quick Link (Authenticated only) */}
            {isAuthenticated && (
              <Link
                to="/settings"
                className={`p-2 rounded-lg transition-all ${
                  isActive('/settings')
                    ? 'text-primary bg-primary/10 neon-glow'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                }`}
                title="Settings"
              >
                <SettingsIcon className="h-4 w-4" />
              </Link>
            )}

            {isAuthenticated ? (
              <Link to="/logout" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                <LogOut className="h-4 w-4" />
                <span className="font-poppins">Logout</span>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="px-4 py-2 text-sm rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-all font-poppins">
                  {t('login')}
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all neon-glow font-poppins">
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-all"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-foreground">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden glass-strong border-t border-border animate-slide-up">
          <div className="px-4 py-4 space-y-2">
            {visibleItems.map(item => (
              <Link
                key={item.id}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive(item.to) ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-orbitron font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 ${
                  isActive('/admin') ? 'bg-emerald-500/25 border-emerald-400' : ''
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            )}

            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-muted text-foreground text-xs rounded px-2 py-1 border border-border"
                >
                  <option value="en">English</option>
                  <option value="om">Afaan Oromoo</option>
                  <option value="am">አማርኛ</option>
                </select>
              </div>
            </div>
            {isAuthenticated ? (
              <Link to="/logout" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-primary">
                <LogOut className="h-4 w-4" />
                <span className="font-poppins">Logout</span>
              </Link>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1 text-center px-4 py-2 text-sm rounded-lg border border-primary/30 text-primary">
                  {t('login')}
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="flex-1 text-center px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground neon-glow">
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
