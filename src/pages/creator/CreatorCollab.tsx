import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CreatorLayout from './CreatorLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { aiStream } from './aiClient';
import {
  Users, MessageSquare, Copy, Check, Link2, Plus, Trash2,
  Sparkles, Loader2, Send, Circle,
} from 'lucide-react';

const db = supabase as any;

/* ── Types ─────────────────────────────────────────────────── */
interface CollabRoom {
  id: string;
  name: string;
  project_id: string | null;
  created_by: string;
  share_code: string;
  created_at: string;
}
interface ChatMsg {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
}
interface Presence {
  userId: string;
  name: string;
  online_at: string;
}

/* ── Helpers ────────────────────────────────────────────────── */
const shortCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function CreatorCollab() {
  const { user, profile } = useAuth();
  const displayName = (profile as any)?.name || user?.email?.split('@')[0] || 'Creator';

  const [rooms,      setRooms]      = useState<CollabRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<CollabRoom | null>(null);
  const [messages,   setMessages]   = useState<ChatMsg[]>([]);
  const [presence,   setPresence]   = useState<Presence[]>([]);
  const [input,      setInput]      = useState('');
  const [creating,   setCreating]   = useState(false);
  const [newName,    setNewName]    = useState('');
  const [joinCode,   setJoinCode]   = useState('');
  const [busy,       setBusy]       = useState(false);
  const [aiSumBusy,  setAiSumBusy] = useState(false);
  const [aiSummary,  setAiSummary] = useState('');
  const [copied,     setCopied]    = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  /* Load rooms user owns or participates in */
  useEffect(() => {
    if (!user) return;
    db.from('collab_rooms')
      .select('*')
      .or(`created_by.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setRooms(data); });
  }, [user]);

  /* Subscribe to room messages + presence via Supabase Realtime */
  useEffect(() => {
    if (!activeRoom || !user) return;

    // Load history
    db.from('collab_messages')
      .select('*')
      .eq('room_id', activeRoom.id)
      .order('created_at')
      .limit(100)
      .then(({ data }: any) => setMessages(data ?? []));

    // Realtime channel
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase.channel(`collab:${activeRoom.id}`, {
      config: { presence: { key: user.id } },
    });

    channel
      // New messages
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'collab_messages',
        filter: `room_id=eq.${activeRoom.id}`,
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new as ChatMsg]);
      })
      // Presence sync
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online: Presence[] = Object.values(state).flatMap((arr: any) => arr);
        setPresence(online);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: user.id, name: displayName, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); setPresence([]); };
  }, [activeRoom?.id, user?.id]);

  /* Auto-scroll */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  /* Create a new room */
  const createRoom = async () => {
    if (!user || !newName.trim()) return;
    setBusy(true);
    const { data, error } = await db.from('collab_rooms').insert({
      name: newName.trim(),
      created_by: user.id,
      share_code: shortCode(),
    }).select().single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setRooms(prev => [data, ...prev]);
    setActiveRoom(data);
    setCreating(false); setNewName('');
    toast.success('Room created');
  };

  /* Join by share code */
  const joinRoom = async () => {
    if (!joinCode.trim()) return;
    const { data } = await db.from('collab_rooms').select('*').eq('share_code', joinCode.trim().toUpperCase()).maybeSingle();
    if (!data) { toast.error('Room not found. Check the code.'); return; }
    setActiveRoom(data);
    if (!rooms.find(r => r.id === data.id)) setRooms(prev => [data, ...prev]);
    setJoinCode('');
    toast.success(`Joined "${data.name}"`);
  };

  /* Send message */
  const sendMsg = async () => {
    if (!input.trim() || !activeRoom || !user) return;
    const body = input.trim();
    setInput('');
    const { error } = await db.from('collab_messages').insert({
      room_id: activeRoom.id,
      user_id: user.id,
      display_name: displayName,
      body,
    });
    if (error) toast.error(error.message);
  };

  /* Delete room */
  const deleteRoom = async (id: string) => {
    if (!confirm('Delete this room and all its messages?')) return;
    await db.from('collab_rooms').delete().eq('id', id);
    setRooms(prev => prev.filter(r => r.id !== id));
    if (activeRoom?.id === id) setActiveRoom(null);
  };

  /* AI meeting summary */
  const summarise = async () => {
    if (messages.length < 3) { toast.error('Need at least 3 messages to summarise.'); return; }
    setAiSumBusy(true); setAiSummary('');
    const transcript = messages.slice(-40).map(m => `${m.display_name}: ${m.body}`).join('\n');
    await aiStream({
      mode: 'expert',
      messages: [{ role: 'user', content: `Summarise this collaboration chat and list key decisions, action items, and open questions:\n\n${transcript}` }],
      onToken: t => setAiSummary(p => p + t),
    });
    setAiSumBusy(false);
  };

  /* Copy share link */
  const copyLink = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.share_code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Share code copied!');
  };

  return (
    <CreatorLayout>
      <div className="flex items-center gap-2 text-primary text-sm font-poppins mb-1">
        <Users className="h-4 w-4" /> Collaboration Hub
      </div>
      <h1 className="font-orbitron text-3xl text-primary neon-text mb-1">Build together</h1>
      <p className="text-muted-foreground mb-6 font-poppins text-sm max-w-2xl">
        Create a room, share the code, and chat with your team in real time. AI can summarise your discussion.
      </p>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-14rem)]">
        {/* ── Room list ─────────────────────────────────────── */}
        <aside className="flex flex-col gap-3 min-h-0">
          {/* Create / join */}
          <div className="rounded-xl border border-border/60 bg-card/30 backdrop-blur p-3 space-y-2">
            {creating ? (
              <>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Room name…"
                  onKeyDown={e => { if (e.key === 'Enter') createRoom(); if (e.key === 'Escape') setCreating(false); }}
                  autoFocus className="w-full bg-background/60 border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-primary" />
                <div className="flex gap-2">
                  <button onClick={createRoom} disabled={busy} className="flex-1 py-1.5 rounded bg-primary text-primary-foreground text-sm font-poppins disabled:opacity-50">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : 'Create'}
                  </button>
                  <button onClick={() => setCreating(false)} className="px-3 py-1.5 rounded border border-border text-muted-foreground text-sm hover:text-primary">✕</button>
                </div>
              </>
            ) : (
              <button onClick={() => setCreating(true)} className="w-full py-2 rounded-lg border border-primary/40 text-primary text-sm font-poppins inline-flex items-center justify-center gap-1.5 hover:bg-primary/10">
                <Plus className="h-3.5 w-3.5" /> New Room
              </button>
            )}
            <div className="flex gap-1">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Join code (e.g. A1B2C3)"
                onKeyDown={e => { if (e.key === 'Enter') joinRoom(); }}
                className="flex-1 bg-background/60 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary uppercase tracking-widest" />
              <button onClick={joinRoom} className="px-3 py-1.5 rounded border border-border text-sm hover:text-primary">Join</button>
            </div>
          </div>

          {/* Room list */}
          <div className="flex-1 overflow-auto space-y-1.5 rounded-xl border border-border/60 bg-card/30 backdrop-blur p-2">
            {rooms.length === 0 && <p className="text-xs text-muted-foreground p-2">No rooms yet.</p>}
            {rooms.map(r => (
              <div key={r.id} onClick={() => setActiveRoom(r)}
                className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm ${
                  activeRoom?.id === r.id ? 'bg-primary/15 border border-primary/30 text-primary' : 'hover:bg-muted/30 text-muted-foreground'
                }`}>
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{r.name}</span>
                {r.created_by === user?.id && (
                  <button onClick={e => { e.stopPropagation(); deleteRoom(r.id); }} className="opacity-0 group-hover:opacity-100 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Chat area ─────────────────────────────────────── */}
        <div className="flex flex-col min-h-0 rounded-xl border border-border/60 bg-card/30 backdrop-blur overflow-hidden">
          {!activeRoom ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-3 text-muted-foreground">
              <Users className="h-10 w-10 opacity-30" />
              <p className="font-poppins text-sm">Select or create a room to start collaborating</p>
            </div>
          ) : (
            <>
              {/* Room header */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between gap-2">
                <div>
                  <div className="font-orbitron text-sm text-primary">{activeRoom.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Circle className="h-2 w-2 fill-green-400 text-green-400" />
                      {presence.length} online
                      {presence.length > 0 && ` — ${presence.map(p => p.name).join(', ')}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={copyLink} title="Copy share code"
                    className="flex items-center gap-1.5 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:text-primary">
                    {copied ? <Check className="h-3 w-3 text-green-400" /> : <Link2 className="h-3 w-3" />}
                    {activeRoom.share_code}
                  </button>
                  <button onClick={summarise} disabled={aiSumBusy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded border border-accent/40 text-accent text-xs hover:bg-accent/10 disabled:opacity-50">
                    {aiSumBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI Summary
                  </button>
                </div>
              </div>

              {/* AI summary */}
              {aiSummary && (
                <div className="mx-4 mt-3 p-3 rounded-xl bg-accent/5 border border-accent/20 text-sm whitespace-pre-wrap">
                  <div className="text-[10px] text-accent mb-1.5 font-mono">🤖 AI Summary</div>
                  {aiSummary}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No messages yet. Say hello! 👋
                  </p>
                )}
                {messages.map(m => {
                  const isMe = m.user_id === user?.id;
                  return (
                    <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                        isMe ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                      }`}>
                        {m.display_name[0]?.toUpperCase()}
                      </div>
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`text-[10px] mb-0.5 ${isMe ? 'text-right text-primary/60' : 'text-muted-foreground'}`}>
                          {m.display_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={`rounded-xl px-3 py-2 text-sm ${
                          isMe ? 'bg-primary/15 border border-primary/20 text-foreground' : 'bg-card/60 border border-border/50 text-foreground'
                        }`}>
                          {m.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 pb-4 flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Type a message… (Enter to send)"
                  className="flex-1 bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button onClick={sendMsg} disabled={!input.trim()} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
}
