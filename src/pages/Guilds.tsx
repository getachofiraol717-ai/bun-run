import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import GalaxyBackground from '@/components/GalaxyBackground';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Star, Trophy, Send, Plus, ArrowLeft,
  Crown, Zap, MessageSquare, Shield, Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface Guild {
  id: string; name: string; subject: string; description: string;
  emoji: string; color: string; member_count: number;
  total_xp: number; weekly_xp: number; is_public: boolean; created_by: string;
}
interface GuildMessage {
  id: string; sender_name: string; content: string;
  created_at: string; user_id: string;
}
interface GuildMember {
  user_id: string; role: string; xp_contributed: number;
}

const PRESET_GUILDS = [
  { name: 'Physics Guild', subject: 'Physics', emoji: '⚛️', color: '#3b82f6', description: 'For those who seek to understand the fundamental forces of the universe.' },
  { name: 'Math Wizards', subject: 'Mathematics', emoji: '∑', color: '#6366f1', description: 'Conquer equations, theorems, and the beauty of pure mathematics.' },
  { name: 'Bio Explorers', subject: 'Biology', emoji: '🧬', color: '#10b981', description: 'Decode life itself — from cells to ecosystems.' },
  { name: 'Code Collective', subject: 'Computer Science', emoji: '💻', color: '#f59e0b', description: 'Build the future through algorithms and elegant code.' },
  { name: 'AI Researchers', subject: 'Artificial Intelligence', emoji: '🤖', color: '#ec4899', description: 'Pioneer the age of intelligent machines.' },
  { name: 'Language Guild', subject: 'English', emoji: '📖', color: '#f97316', description: 'Master the art of communication and literature.' },
];

const Guilds = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newDesc, setNewDesc] = useState('');
  const [newEmoji, setNewEmoji] = useState('⭐');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Data fetching ────────────────────────────────────────
  const { data: guilds = [] } = useQuery<Guild[]>({
    queryKey: ['guilds'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('guilds').select('*').eq('is_public', true).order('total_xp', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const { data: myMemberships = [] } = useQuery<{ guild_id: string; role: string }[]>({
    queryKey: ['my_guild_memberships', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase as any).from('guild_members').select('guild_id, role').eq('user_id', user!.id);
      return data || [];
    },
  });

  const { data: guildMessages = [] } = useQuery<GuildMessage[]>({
    queryKey: ['guild_messages', selectedGuild?.id],
    enabled: !!selectedGuild?.id,
    queryFn: async () => {
      const { data } = await (supabase as any).from('guild_messages').select('*').eq('guild_id', selectedGuild!.id).order('created_at', { ascending: true }).limit(60);
      return data || [];
    },
    refetchInterval: 5000,
  });

  const { data: guildMembers = [] } = useQuery<GuildMember[]>({
    queryKey: ['guild_members', selectedGuild?.id],
    enabled: !!selectedGuild?.id,
    queryFn: async () => {
      const { data } = await (supabase as any).from('guild_members').select('user_id, role, xp_contributed').eq('guild_id', selectedGuild!.id).order('xp_contributed', { ascending: false });
      return data || [];
    },
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [guildMessages.length]);

  // ── Mutations ─────────────────────────────────────────────
  const joinGuild = useMutation({
    mutationFn: async (guildId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await (supabase as any).from('guild_members').insert({ guild_id: guildId, user_id: user.id, role: 'member' });
      if (error) throw error;
      await (supabase as any).from('guilds').update({ member_count: (guilds.find(g => g.id === guildId)?.member_count ?? 0) + 1 }).eq('id', guildId);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guilds'] }); qc.invalidateQueries({ queryKey: ['my_guild_memberships'] }); toast.success('⚔️ Joined guild!'); },
    onError: () => toast.error('Already a member or guild is full'),
  });

  const leaveGuild = useMutation({
    mutationFn: async (guildId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await (supabase as any).from('guild_members').delete().eq('guild_id', guildId).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guilds'] }); qc.invalidateQueries({ queryKey: ['my_guild_memberships'] }); setSelectedGuild(null); toast.message('Left guild'); },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !selectedGuild) throw new Error();
      const { error } = await (supabase as any).from('guild_messages').insert({ guild_id: selectedGuild.id, user_id: user.id, sender_name: (profile as any)?.name || 'Explorer', content });
      if (error) throw error;
    },
    onSuccess: () => { setChatInput(''); qc.invalidateQueries({ queryKey: ['guild_messages', selectedGuild?.id] }); },
  });

  const createGuild = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await (supabase as any).from('guilds').insert({ name: newName, subject: newSubject, description: newDesc, emoji: newEmoji, created_by: user.id, color: '#8b5cf6' }).select().single();
      if (error) throw error;
      await (supabase as any).from('guild_members').insert({ guild_id: data.id, user_id: user.id, role: 'leader' });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guilds'] }); qc.invalidateQueries({ queryKey: ['my_guild_memberships'] }); setCreating(false); setNewName(''); toast.success('⚔️ Guild founded!'); },
    onError: () => toast.error('Failed to create guild'),
  });

  const isMember = (guildId: string) => myMemberships.some(m => m.guild_id === guildId);
  const myRole   = (guildId: string) => myMemberships.find(m => m.guild_id === guildId)?.role;

  // ── GUILD CHAT VIEW ───────────────────────────────────────
  if (selectedGuild) {
    const amMember = isMember(selectedGuild.id);
    return (
      <div className="min-h-screen relative pt-16">
        <GalaxyBackground />
        <div className="relative z-10 h-[calc(100vh-4rem)] flex flex-col max-w-4xl mx-auto px-4">
          {/* Guild header */}
          <div className="py-3 flex items-center gap-3 border-b border-border">
            <button onClick={() => setSelectedGuild(null)} className="p-1.5 rounded-lg glass hover:bg-muted/40 transition-colors"><ArrowLeft className="h-4 w-4" /></button>
            <div className="text-2xl">{selectedGuild.emoji}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-orbitron text-sm font-bold text-foreground">{selectedGuild.name}</h2>
              <p className="text-[10px] text-muted-foreground font-poppins">{selectedGuild.member_count} members · {selectedGuild.subject}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-poppins">
              <span className="flex items-center gap-1 text-yellow-400"><Star className="h-3 w-3" />{selectedGuild.total_xp.toLocaleString()} XP</span>
            </div>
            {amMember && myRole(selectedGuild.id) !== 'leader' && (
              <button onClick={() => leaveGuild.mutate(selectedGuild.id)} className="text-[10px] text-muted-foreground hover:text-red-400 font-poppins transition-colors">Leave</button>
            )}
          </div>

          <div className="flex flex-1 gap-3 overflow-hidden py-3">
            {/* Chat */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {guildMessages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.user_id === user?.id ? 'justify-end' : ''}`}>
                    {msg.user_id !== user?.id && (
                      <div className="w-7 h-7 rounded-lg glass flex items-center justify-center text-xs font-bold shrink-0" style={{ color: selectedGuild.color }}>{msg.sender_name[0]?.toUpperCase()}</div>
                    )}
                    <div className={`max-w-[78%] px-3 py-2 rounded-xl text-sm font-poppins ${msg.user_id === user?.id ? 'glass-strong rounded-br-md' : 'glass rounded-bl-md'}`}>
                      {msg.user_id !== user?.id && <p className="text-[10px] font-orbitron mb-0.5" style={{ color: selectedGuild.color }}>{msg.sender_name}</p>}
                      <p className="text-foreground leading-snug">{msg.content}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                {guildMessages.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground font-poppins text-sm">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No messages yet. Start the conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {amMember ? (
                <div className="flex gap-2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { sendMessage.mutate(chatInput.trim()); } }}
                    placeholder={`Message ${selectedGuild.name}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none" />
                  <button onClick={() => { if (chatInput.trim()) sendMessage.mutate(chatInput.trim()); }}
                    disabled={!chatInput.trim() || sendMessage.isPending}
                    className="p-2.5 rounded-xl text-white transition-all disabled:opacity-50"
                    style={{ backgroundColor: selectedGuild.color }}>
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => joinGuild.mutate(selectedGuild.id)}
                  className="w-full py-3 rounded-xl text-white font-orbitron text-sm font-bold hover:scale-[1.02] transition-all"
                  style={{ backgroundColor: selectedGuild.color, boxShadow: `0 0 16px ${selectedGuild.color}60` }}>
                  ⚔️ Join Guild to Chat
                </button>
              )}
            </div>

            {/* Members sidebar */}
            <div className="w-36 shrink-0 space-y-1">
              <p className="text-[10px] text-muted-foreground font-poppins mb-2 uppercase tracking-wide">Members ({guildMembers.length})</p>
              {guildMembers.slice(0, 12).map((m, i) => (
                <div key={m.user_id} className="flex items-center gap-1.5 text-[10px] font-poppins">
                  <div className="w-5 h-5 rounded-md glass flex items-center justify-center font-bold text-[8px]" style={{ color: selectedGuild.color }}>{i + 1}</div>
                  <span className="text-muted-foreground truncate">{m.role === 'leader' ? '👑' : '⚔️'} {m.xp_contributed > 0 ? `${m.xp_contributed} XP` : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── GUILD LIST VIEW ────────────────────────────────────────
  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <GalaxyBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-primary neon-text flex items-center gap-3">
              <Shield className="h-8 w-8" /> Study Guilds
            </h1>
            <p className="text-muted-foreground font-poppins text-sm mt-1">Join a guild. Study together. Rise in the rankings.</p>
          </div>
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow hover:scale-105 transition-all">
            <Plus className="h-4 w-4" /> Found Guild
          </button>
        </div>

        {/* My guilds strip */}
        {myMemberships.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-muted-foreground font-poppins uppercase tracking-widest mb-2">My Guilds</p>
            <div className="flex gap-2 flex-wrap">
              {guilds.filter(g => isMember(g.id)).map(g => (
                <button key={g.id} onClick={() => setSelectedGuild(g)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass border text-xs font-poppins hover:scale-105 transition-all"
                  style={{ borderColor: `${g.color}40`, color: g.color }}>
                  {g.emoji} {g.name}
                  {myRole(g.id) === 'leader' && <Crown className="h-3 w-3 text-yellow-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guild grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.map((guild, i) => (
            <div key={guild.id} className="glass-strong rounded-2xl p-5 border-2 hover:-translate-y-1 transition-all duration-300 animate-slide-up"
              style={{ borderColor: `${guild.color}30`, animationDelay: `${i * 0.07}s`, boxShadow: `0 0 16px ${guild.color}10` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{guild.emoji}</div>
                <div className="flex items-center gap-1 text-[9px] font-poppins px-2 py-0.5 rounded-full" style={{ backgroundColor: `${guild.color}15`, color: guild.color }}>
                  <Users className="h-2.5 w-2.5" /> {guild.member_count}
                </div>
              </div>
              <h3 className="font-orbitron text-sm font-bold text-foreground mb-0.5">{guild.name}</h3>
              <p className="text-[10px] font-poppins mb-2" style={{ color: guild.color }}>{guild.subject}</p>
              <p className="text-[11px] text-muted-foreground font-poppins mb-3 line-clamp-2">{guild.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] font-poppins text-yellow-400">
                  <Trophy className="h-3 w-3" /> {guild.total_xp.toLocaleString()} XP
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setSelectedGuild(guild)} className="px-2.5 py-1 rounded-lg text-[10px] font-poppins glass border hover:bg-muted/30 transition-all" style={{ borderColor: `${guild.color}40`, color: guild.color }}>
                    View
                  </button>
                  {!isMember(guild.id) ? (
                    <button onClick={() => joinGuild.mutate(guild.id)} disabled={joinGuild.isPending}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                      style={{ backgroundColor: guild.color }}>
                      Join
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-poppins bg-green-500/20 text-green-400">✓ Joined</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Preset guild cards if DB empty */}
          {guilds.length === 0 && PRESET_GUILDS.map((g, i) => (
            <div key={i} className="glass-strong rounded-2xl p-5 border-2 opacity-60 animate-slide-up"
              style={{ borderColor: `${g.color}30`, animationDelay: `${i * 0.07}s` }}>
              <div className="text-3xl mb-2">{g.emoji}</div>
              <h3 className="font-orbitron text-sm font-bold text-foreground mb-0.5">{g.name}</h3>
              <p className="text-[10px] mb-2" style={{ color: g.color }}>{g.subject}</p>
              <p className="text-[11px] text-muted-foreground font-poppins mb-3 line-clamp-2">{g.description}</p>
              <button onClick={() => { setNewName(g.name); setNewSubject(g.subject); setNewDesc(g.description); setNewEmoji(g.emoji); setCreating(true); }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-orbitron text-white w-full transition-all hover:scale-105"
                style={{ backgroundColor: g.color }}>
                Found This Guild
              </button>
            </div>
          ))}
        </div>

        {/* Create guild modal */}
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
            <div className="glass-strong rounded-2xl p-6 max-w-sm w-full neon-glow animate-slide-up">
              <h3 className="font-orbitron text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Found a Guild
              </h3>
              <div className="space-y-3 mb-5">
                <div className="flex gap-2">
                  <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} maxLength={2} placeholder="⭐"
                    className="w-14 text-center px-2 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none" />
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Guild name"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none" />
                </div>
                <select value={newSubject} onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none">
                  {['Mathematics','Physics','Chemistry','Biology','Computer Science','English','History','Geography','Artificial Intelligence','Amharic','Afaan Oromo'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Guild description..." rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCreating(false)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-orbitron text-xs">Cancel</button>
                <button onClick={() => createGuild.mutate()} disabled={!newName.trim() || createGuild.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow disabled:opacity-50">
                  {createGuild.isPending ? 'Creating...' : 'Found Guild'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Guilds;
