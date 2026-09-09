import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ColorPreset } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import GalaxyBackground from '@/components/GalaxyBackground';
import developerImg from '@/assets/developer.jpg';
import { User, Palette, Info, Phone, Mail, Camera, Sun, Moon, Save, ArrowLeft, Github, Globe, Code, Sparkles, Eye, Shield, Lock, CheckCircle2, ArrowRight, ExternalLink, Activity, BookOpen, Key, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { StudentAccessibilityCenter } from '@/components/accessibility/StudentAccessibilityCenter';

const PRESET_COLORS: { id: ColorPreset; label: string; preview: string }[] = [
  { id: 'cyan', label: 'Neon Cyan', preview: 'hsl(199 100% 50%)' },
  { id: 'purple', label: 'Cosmic Purple', preview: 'hsl(270 80% 60%)' },
  { id: 'emerald', label: 'Emerald', preview: 'hsl(160 80% 45%)' },
  { id: 'rose', label: 'Rose', preview: 'hsl(340 85% 58%)' },
  { id: 'amber', label: 'Amber', preview: 'hsl(38 95% 55%)' },
];

const Settings = () => {
  const [searchParams] = useSearchParams();
  const { user, profile, isAuthenticated, isAdmin } = useAuth();
  const { theme, setTheme, colorPreset, setColorPreset, customPrimary, setCustomPrimary } = useTheme();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const initialTab = (searchParams.get('tab') as any) || 'user';
  const [tab, setTab] = useState<'user' | 'app' | 'accessibility' | 'admin' | 'about' | 'contact' | 'developer'>(
    ['user', 'app', 'accessibility', 'admin', 'about', 'contact', 'developer'].includes(initialTab) ? initialTab : 'user'
  );

  useEffect(() => {
    const requested = searchParams.get('tab');
    if (requested && ['user', 'app', 'accessibility', 'admin', 'about', 'contact', 'developer'].includes(requested)) {
      setTab(requested as any);
    }
  }, [searchParams]);

  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState((profile as any)?.phone || '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 pt-16">
        <GalaxyBackground />
        <div className="glass-strong rounded-2xl p-8 max-w-md text-center neon-glow">
          <h2 className="font-orbitron text-xl font-bold mb-2">Login Required</h2>
          <p className="text-sm text-muted-foreground mb-4 font-poppins">Sign in to access settings.</p>
          <Link to="/login" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm neon-glow inline-block">Login</Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ name, phone } as any).eq('user_id', user.id);
    setSaving(false);
    if (error) toast.error('Failed to save'); else toast.success('Profile updated');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload failed'); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('user_id', user.id);
    toast.success('Avatar updated');
  };

  const tabs = [
    { id: 'user' as const, label: 'Profile', icon: User },
    { id: 'app' as const, label: 'Appearance', icon: Palette },
    { id: 'accessibility' as const, label: 'Accessibility', icon: Sparkles },
    { id: 'admin' as const, label: 'Admin Portal', icon: Shield },
    { id: 'about' as const, label: 'About', icon: Info },
    { id: 'contact' as const, label: 'Contact', icon: Mail },
    { id: 'developer' as const, label: 'Developer', icon: Code },
  ];

  return (
    <div className="min-h-screen relative pt-20 pb-12 px-4">
      <GalaxyBackground />
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg glass hover:bg-primary/10"><ArrowLeft className="h-4 w-4" /></button>
          <h1 className="font-orbitron text-2xl font-bold neon-text">Settings</h1>
        </div>

        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          {/* Sidebar */}
          <div className="glass-strong rounded-2xl p-3 space-y-1 h-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-poppins transition-all ${
                  tab === id
                    ? 'bg-primary text-primary-foreground neon-glow font-medium'
                    : id === 'admin' && isAdmin
                      ? 'text-emerald-400 hover:bg-emerald-500/15'
                      : 'text-muted-foreground hover:bg-primary/10'
                }`}
              >
                <Icon className={`h-4 w-4 ${id === 'admin' && isAdmin ? 'text-emerald-400' : ''}`} />
                <span>{label}</span>
                {id === 'admin' && isAdmin && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            ))}

            {isAdmin && (
              <div className="pt-2 mt-2 border-t border-border/40">
                <Link
                  to="/admin"
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-orbitron text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    Launch Admin
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="glass-strong rounded-2xl p-6 neon-glow">
            {tab === 'user' && (
              <div className="space-y-5">
                <h2 className="font-orbitron text-lg font-bold">User Profile</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/30">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile Avatar"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== window.location.origin + '/placeholder.svg') {
                              target.src = '/placeholder.svg';
                            }
                          }}
                        />
                      ) : (
                        <User className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground neon-glow"><Camera className="h-3 w-3" /></button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
                  </div>
                  <div>
                    <p className="font-orbitron text-sm">{profile?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground font-poppins">{user?.email}</p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-orbitron font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Shield className="h-3 w-3" /> Administrator
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-poppins">Username</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary outline-none font-poppins" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-poppins flex items-center gap-1"><Mail className="h-3 w-3" /> Email (read-only)</label>
                  <input value={user?.email || ''} disabled className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border opacity-60 font-poppins" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-poppins flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 ..." className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary outline-none font-poppins" />
                </div>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm neon-glow flex items-center gap-2 disabled:opacity-50">
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {tab === 'app' && (
              <div className="space-y-6">
                <h2 className="font-orbitron text-lg font-bold">Appearance</h2>
                <div>
                  <p className="text-xs text-muted-foreground font-poppins mb-2">Mode</p>
                  <div className="flex gap-2">
                    <button onClick={() => setTheme('dark')} className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-primary text-primary-foreground neon-glow' : 'glass'}`}><Moon className="h-4 w-4" /> Dark</button>
                    <button onClick={() => setTheme('light')} className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-primary text-primary-foreground neon-glow' : 'glass'}`}><Sun className="h-4 w-4" /> Light</button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-poppins mb-2">Color Theme</p>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_COLORS.map(c => (
                      <button key={c.id} onClick={() => setColorPreset(c.id)} className={`aspect-square rounded-xl border-2 transition-all ${colorPreset === c.id ? 'border-primary scale-110' : 'border-border'}`} style={{ background: c.preview }} title={c.label} />
                    ))}
                  </div>
                  <button onClick={() => setColorPreset('custom')} className={`mt-3 w-full px-4 py-2.5 rounded-xl text-sm font-poppins flex items-center gap-2 transition-all ${colorPreset === 'custom' ? 'bg-primary text-primary-foreground' : 'glass'}`}>
                    <Sparkles className="h-4 w-4" /> Custom
                  </button>
                  {colorPreset === 'custom' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground font-poppins">HSL value (e.g. <code>199 100% 50%</code>)</p>
                      <input value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary outline-none font-mono text-sm" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-poppins mb-2">Language</p>
                  <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary outline-none font-poppins">
                    <option value="en">English</option>
                    <option value="am">አማርኛ (Amharic)</option>
                    <option value="om">Afaan Oromoo</option>
                  </select>
                </div>
              </div>
            )}

            {tab === 'accessibility' && (
              <StudentAccessibilityCenter />
            )}

            {tab === 'admin' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-orbitron text-lg font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Admin Portal & Management
                  </h2>
                  <p className="text-xs text-muted-foreground font-poppins mt-1">
                    Manage platform content, system health, security roles, and learning modules.
                  </p>
                </div>

                {isAdmin ? (
                  <div className="space-y-4">
                    <div className="glass rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-orbitron font-bold text-emerald-300">
                          Active Administrator Access
                        </p>
                        <p className="text-xs text-muted-foreground font-poppins mt-0.5">
                          Authenticated as <span className="text-foreground font-medium">{user?.email}</span> with database-verified admin privileges.
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/admin"
                      className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm font-semibold neon-glow flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-lg"
                    >
                      <Shield className="h-4 w-4" /> Launch Admin Portal <ArrowRight className="h-4 w-4" />
                    </Link>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <Link
                        to="/admin"
                        className="glass rounded-xl p-3.5 hover:bg-primary/10 border border-border/40 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Compass className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-orbitron font-bold text-foreground">Navigation & Menus</p>
                          <p className="text-[10px] text-muted-foreground font-poppins">Manage routes and visibility</p>
                        </div>
                      </Link>

                      <Link
                        to="/admin"
                        className="glass rounded-xl p-3.5 hover:bg-primary/10 border border-border/40 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-orbitron font-bold text-foreground">Curriculum & Quizzes</p>
                          <p className="text-[10px] text-muted-foreground font-poppins">Question bank and library</p>
                        </div>
                      </Link>

                      <Link
                        to="/admin"
                        className="glass rounded-xl p-3.5 hover:bg-primary/10 border border-border/40 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-orbitron font-bold text-foreground">System Health & Logs</p>
                          <p className="text-[10px] text-muted-foreground font-poppins">Telemetry & DB monitoring</p>
                        </div>
                      </Link>

                      <Link
                        to="/admin"
                        className="glass rounded-xl p-3.5 hover:bg-primary/10 border border-border/40 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Key className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-orbitron font-bold text-foreground">Security & RBAC</p>
                          <p className="text-[10px] text-muted-foreground font-poppins">Roles and permissions</p>
                        </div>
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs font-poppins text-muted-foreground">
                      <span>Need to sign in with a different admin credential?</span>
                      <Link to="/admin-login" className="text-primary hover:underline font-medium">
                        Admin Login Portal
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="glass rounded-xl p-4 border border-border/50 space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                        <Lock className="h-4 w-4 text-primary" /> Administrator Privileges Required
                      </div>
                      <p className="text-xs text-muted-foreground font-poppins leading-relaxed">
                        The central control plane requires an account with verified administrator role entries in the database.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        to="/admin-login"
                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs font-semibold neon-glow flex items-center justify-center gap-2 hover:scale-[1.01] transition-all text-center"
                      >
                        <Shield className="h-4 w-4" /> Sign In as Admin
                      </Link>

                      <Link
                        to="/admin-access"
                        className="flex-1 py-3 rounded-xl glass border border-border text-foreground font-poppins text-xs font-medium flex items-center justify-center gap-2 hover:bg-primary/10 transition-all text-center"
                      >
                        Admin Gateway Overview <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'about' && (
              <div className="space-y-4">
                <h2 className="font-orbitron text-lg font-bold">About Knowledge Universe</h2>
                <p className="text-sm text-muted-foreground font-poppins leading-relaxed">
                  Knowledge Universe (KU) is an ultra-futuristic AI-powered learning platform that turns the entire galaxy into a knowledge map. Every star and every planet becomes a subject — biology, physics, history, languages, philosophy and beyond.
                </p>
                <p className="text-sm text-muted-foreground font-poppins leading-relaxed">
                  Built for Grade 1–12 students, teachers and schools, KU combines a real AI tutor (English, Amharic, Afan Oromo), an infinite procedural galaxy explorer, eye-care PDF reading, quizzes, and a real backend powered by Lovable Cloud.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="glass rounded-xl p-3 text-center"><p className="font-orbitron text-2xl text-primary">v2.0</p><p className="text-[10px] text-muted-foreground font-poppins">Version</p></div>
                  <div className="glass rounded-xl p-3 text-center"><p className="font-orbitron text-2xl text-primary">200⁺</p><p className="text-[10px] text-muted-foreground font-poppins">Sextillion subjects</p></div>
                </div>
              </div>
            )}

            {tab === 'contact' && (
              <div className="space-y-4">
                <h2 className="font-orbitron text-lg font-bold">Contact Us</h2>
                <div className="space-y-3">
                  <a href="mailto:support@knowledgeuniverse.app" className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-primary/10 transition-all">
                    <Mail className="h-5 w-5 text-primary" />
                    <div><p className="text-sm font-poppins">support@knowledgeuniverse.app</p><p className="text-xs text-muted-foreground">Email support</p></div>
                  </a>
                  <a href="tel:+251000000000" className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-primary/10 transition-all">
                    <Phone className="h-5 w-5 text-primary" />
                    <div><p className="text-sm font-poppins">+251 000 000 000</p><p className="text-xs text-muted-foreground">Phone support</p></div>
                  </a>
                  <Link to="/contact" className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-primary/10 transition-all">
                    <Globe className="h-5 w-5 text-primary" />
                    <div><p className="text-sm font-poppins">Contact form</p><p className="text-xs text-muted-foreground">Send us a message</p></div>
                  </Link>
                </div>
              </div>
            )}

            {tab === 'developer' && (
              <div className="space-y-4">
                <h2 className="font-orbitron text-lg font-bold">Developer</h2>
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <img
                      src={developerImg}
                      alt="Developer"
                      className="w-32 h-32 rounded-2xl object-cover border-2 border-primary/30 neon-glow"
                    />
                  </div>
                  <p className="font-orbitron text-base font-bold mt-3">Firee Getacho</p>
                  <p className="text-xs text-muted-foreground font-poppins">Founder & Lead Developer</p>
                  <p className="text-sm text-muted-foreground font-poppins mt-3 max-w-sm">
                    Building Knowledge Universe to make Earth-rooted education accessible across every star in the galaxy.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg glass hover:bg-primary/10"><Github className="h-4 w-4" /></a>
                    <a href="mailto:dev@knowledgeuniverse.app" className="p-2 rounded-lg glass hover:bg-primary/10"><Mail className="h-4 w-4" /></a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
