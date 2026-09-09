import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import GalaxyBackground from '@/components/GalaxyBackground';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Send, Plus, ArrowLeft, Bot, Zap, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Room {
  id: string; name: string; subject: string; host_id: string;
  host_name: string; participant_count: number; max_participants: number;
  is_active: boolean; current_topic: string | null;
}
interface RoomMessage {
  id: string; sender_name: string; content: string;
  message_type: string; created_at: string; user_id: string;
}

const DEFAULT_ROOMS: Room[] = [
  {
    id: 'room_global_math',
    name: 'Global Calculus & Algebra Lab',
    subject: 'Mathematics',
    host_id: 'system_host_1',
    host_name: 'Professor Cosmo',
    participant_count: 8,
    max_participants: 25,
    is_active: true,
    current_topic: 'Derivatives & Integrals',
  },
  {
    id: 'room_global_physics',
    name: 'Quantum Physics Discussion',
    subject: 'Physics',
    host_id: 'system_host_2',
    host_name: 'Dr. Tesla',
    participant_count: 12,
    max_participants: 30,
    is_active: true,
    current_topic: 'Wave Optics & Electromagnetism',
  },
  {
    id: 'room_global_cs',
    name: 'AI & Algorithmic Problem Solving',
    subject: 'Computer Science',
    host_id: 'system_host_3',
    host_name: 'Ada Lovelace AI',
    participant_count: 15,
    max_participants: 50,
    is_active: true,
    current_topic: 'Data Structures & Big-O Complexity',
  },
];

const SUBJECTS = ['General','Mathematics','Physics','Chemistry','Biology','Computer Science','English','History'];

const StudyRooms = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myName = (profile as any)?.name || 'Explorer';

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['study_rooms'],
    queryFn: async () => {
      try {
        const { data } = await (supabase as any).from('study_rooms').select('*').eq('is_active', true).order('last_activity_at', { ascending: false }).limit(20);
        if (!data || data.length === 0) return DEFAULT_ROOMS;
        return data;
      } catch {
        return DEFAULT_ROOMS;
      }
    },
    refetchInterval: 10000,
  });

  const { data: roomMessages = [] } = useQuery<RoomMessage[]>({
    queryKey: ['room_messages', activeRoom?.id],
    enabled: !!activeRoom?.id,
    queryFn: async () => {
      const { data } = await (supabase as any).from('study_room_messages').select('*').eq('room_id', activeRoom!.id).order('created_at', { ascending: true }).limit(80);
      return data || [];
    },
    refetchInterval: 3000,
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [roomMessages.length]);

  const createRoom = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: room, error } = await (supabase as any).from('study_rooms').insert({
        name: newName, subject: newSubject, host_id: user.id, host_name: myName,
      }).select().single();
      if (error) throw error;
      await (supabase as any).from('study_room_participants').insert({ room_id: room.id, user_id: user.id, user_name: myName });
      return room;
    },
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['study_rooms'] }); setActiveRoom(room); setCreating(false);
      toast.success('🌌 Study room created!');
    },
    onError: () => toast.error('Failed to create room'),
  });

  const joinRoom = useMutation({
    mutationFn: async (room: Room) => {
      if (!user?.id) throw new Error();
      await (supabase as any).from('study_room_participants').upsert({ room_id: room.id, user_id: user.id, user_name: myName, is_active: true }, { onConflict: 'room_id,user_id' });
      await (supabase as any).from('study_room_messages').insert({ room_id: room.id, user_id: user.id, sender_name: 'System', content: `${myName} joined the room.`, message_type: 'system' });
      return room;
    },
    onSuccess: (room) => { setActiveRoom(room); qc.invalidateQueries({ queryKey: ['study_rooms'] }); },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !activeRoom) throw new Error();
      await (supabase as any).from('study_room_messages').insert({ room_id: activeRoom.id, user_id: user.id, sender_name: myName, content, message_type: 'chat' });
      await (supabase as any).from('study_rooms').update({ last_activity_at: new Date().toISOString() }).eq('id', activeRoom.id);
    },
    onSuccess: () => { setChatInput(''); qc.invalidateQueries({ queryKey: ['room_messages', activeRoom?.id] }); },
  });

  const askSharedAI = async () => {
    if (!activeRoom || !chatInput.trim() || !user) return;
    const question = chatInput.trim();
    setChatInput(''); setAiLoading(true);
    // Post user question
    await (supabase as any).from('study_room_messages').insert({ room_id: activeRoom.id, user_id: user.id, sender_name: myName, content: question, message_type: 'chat' });
    // Post AI loading indicator
    const { data: aiMsgRow } = await (supabase as any).from('study_room_messages').insert({ room_id: activeRoom.id, user_id: user.id, sender_name: `🤖 KU AI (${activeRoom.subject})`, content: '...thinking...', message_type: 'ai' }).select().single();
    qc.invalidateQueries({ queryKey: ['room_messages', activeRoom?.id] });

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;
      const resp = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ messages: [{ role: 'user', content: question }], language: 'en', mode: 'instant', provider: 'gemini', subject: activeRoom.subject }),
      });
      let aiText = '';
      if (resp.ok && resp.body) {
        const reader = resp.body.getReader(); const dec = new TextDecoder();
        let buf = '', done = false;
        while (!done) {
          const { done: d, value } = await reader.read(); if (d) break;
          buf += dec.decode(value, { stream: true }); let nl: number;
          while ((nl = buf.indexOf('\n')) !== -1) {
            let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const j = line.slice(6).trim(); if (j === '[DONE]') { done = true; break; }
            try { const p = JSON.parse(j); const delta = p.choices?.[0]?.delta?.content; if (delta) aiText += delta; } catch { /* skip */ }
          }
        }
      }
      if (aiMsgRow?.id) await (supabase as any).from('study_room_messages').update({ content: aiText || '⚠️ No response.' }).eq('id', aiMsgRow.id);
    } catch { if (aiMsgRow?.id) await (supabase as any).from('study_room_messages').update({ content: '⚠️ AI error. Try again.' }).eq('id', aiMsgRow.id); }
    finally { setAiLoading(false); qc.invalidateQueries({ queryKey: ['room_messages', activeRoom?.id] }); }
  };

  // ── ACTIVE ROOM VIEW ───────────────────────────────────────
  if (activeRoom) {
    return (
      <div className="min-h-screen relative pt-16">
        <GalaxyBackground />
        <div className="relative z-10 h-[calc(100vh-4rem)] flex flex-col max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="py-3 flex items-center gap-3 border-b border-border">
            <button onClick={() => setActiveRoom(null)} className="p-1.5 rounded-lg glass hover:bg-muted/40 transition-colors"><ArrowLeft className="h-4 w-4" /></button>
            <Globe className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <h2 className="font-orbitron text-sm font-bold truncate">{activeRoom.name}</h2>
              <p className="text-[10px] text-muted-foreground font-poppins">{activeRoom.subject} · {activeRoom.participant_count} studying</p>
            </div>
            <Link to={`/library?subject=${encodeURIComponent(activeRoom.subject)}`}
              className="px-3 py-1.5 rounded-xl text-xs font-poppins glass border border-primary/30 text-primary hover:bg-primary/10 transition-all flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> Subject Library
            </Link>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-2 py-3">
            {roomMessages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.user_id === user?.id && msg.message_type === 'chat' ? 'justify-end' : ''}`}>
                {(msg.user_id !== user?.id || msg.message_type !== 'chat') && (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${msg.message_type === 'ai' ? 'bg-primary/20 text-primary' : msg.message_type === 'system' ? 'bg-muted' : 'glass'}`}>
                    {msg.message_type === 'ai' ? '🤖' : msg.message_type === 'system' ? '⚙️' : msg.sender_name[0]?.toUpperCase()}
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm font-poppins ${
                  msg.message_type === 'ai' ? 'glass-strong border border-primary/20' :
                  msg.message_type === 'system' ? 'bg-muted/50 text-muted-foreground text-center text-xs w-full' :
                  msg.user_id === user?.id ? 'glass-strong rounded-br-md' : 'glass rounded-bl-md'
                }`}>
                  {msg.message_type !== 'system' && msg.user_id !== user?.id && (
                    <p className="text-[9px] font-orbitron mb-0.5 text-primary">{msg.sender_name}</p>
                  )}
                  <p className="text-foreground leading-snug whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {roomMessages.length === 0 && (
              <div className="text-center py-10 text-muted-foreground font-poppins text-sm">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" /> Room is quiet. Start studying together!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="pb-3 flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage.mutate(chatInput.trim()); } }}
              placeholder={`Chat in ${activeRoom.name}...`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none" />
            <button onClick={() => { if (chatInput.trim()) sendMessage.mutate(chatInput.trim()); }}
              disabled={!chatInput.trim()} className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 transition-all">
              <Send className="h-4 w-4" />
            </button>
            <button onClick={askSharedAI} disabled={!chatInput.trim() || aiLoading}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground neon-glow hover:scale-105 transition-all disabled:opacity-50" title="Ask shared AI tutor">
              {aiLoading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Bot className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ROOM LIST VIEW ─────────────────────────────────────────
  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <GalaxyBackground />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-primary neon-text flex items-center gap-3">
              <Users className="h-8 w-8" /> Study Rooms
            </h1>
            <p className="text-muted-foreground font-poppins text-sm mt-1">Study together. Share AI tutoring. Learn faster.</p>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow hover:scale-105 transition-all">
            <Plus className="h-4 w-4" /> New Room
          </button>
        </div>

        <div className="space-y-3">
          {rooms.map((room, i) => (
            <div key={room.id} className="glass-strong rounded-2xl p-5 border border-border/30 hover:border-primary/30 transition-all animate-slide-up"
              style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-sm font-bold text-foreground">{room.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-poppins">{room.subject} · hosted by {room.host_name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-poppins mt-0.5">
                      <Users className="h-2.5 w-2.5" /> {room.participant_count}/{room.max_participants} studying
                    </div>
                  </div>
                </div>
                <button onClick={() => joinRoom.mutate(room)} disabled={room.participant_count >= room.max_participants}
                  className="px-4 py-2 rounded-xl text-xs font-orbitron font-bold text-primary-foreground bg-primary neon-glow hover:scale-105 transition-all disabled:opacity-50">
                  Join
                </button>
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="glass-strong rounded-2xl p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-poppins">No active study rooms.</p>
              <p className="text-xs text-muted-foreground/60 font-poppins mt-1">Create one and invite your classmates!</p>
            </div>
          )}
        </div>

        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
            <div className="glass-strong rounded-2xl p-6 max-w-xs w-full neon-glow animate-slide-up">
              <h3 className="font-orbitron text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> New Study Room
              </h3>
              <div className="space-y-3 mb-5">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Room name..."
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none" />
                <select value={newSubject} onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none">
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCreating(false)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-orbitron text-xs">Cancel</button>
                <button onClick={() => createRoom.mutate()} disabled={!newName.trim() || createRoom.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow disabled:opacity-50">
                  {createRoom.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyRooms;
