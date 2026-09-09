import { useEffect, useState } from 'react';
import CreatorLayout from './CreatorLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Store, Download, Heart, Plus, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const db = supabase as any;

export default function CreatorMarketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [showPub, setShowPub] = useState(false);
  const [pubProject, setPubProject] = useState('');
  const [pubTitle, setPubTitle] = useState('');
  const [pubDesc, setPubDesc] = useState('');

  useEffect(() => {
    db.from('marketplace_items').select('*').order('installs', { ascending: false }).limit(60).then(({ data }: any) => setItems(data ?? []));
    if (user) db.from('creator_projects').select('id,name').eq('user_id', user.id).then(({ data }: any) => setMyProjects(data ?? []));
  }, [user]);

  const filtered = items.filter(i =>
    !q.trim() || i.title.toLowerCase().includes(q.toLowerCase()) ||
    (i.description || '').toLowerCase().includes(q.toLowerCase())
  );

  const install = async (item: any) => {
    if (!user) return toast.error('Sign in first');
    if (!item.project_id) return toast.error('Item has no source project');
    // Clone: read source project + files, create new project for user
    const { data: src } = await db.from('creator_projects').select('*').eq('id', item.project_id).single();
    const { data: srcFiles } = await db.from('creator_files').select('path,content,language').eq('project_id', item.project_id);
    const { data: np, error } = await db.from('creator_projects').insert({
      user_id: user.id, name: `${src?.name ?? item.title} (installed)`,
      description: src?.description ?? '', language: src?.language ?? 'web', template: 'marketplace',
    }).select().single();
    if (error) { toast.error(error.message); return; }
    if (srcFiles?.length) await db.from('creator_files').insert(srcFiles.map((f: any) => ({ ...f, project_id: np.id })));
    await db.from('marketplace_installs').upsert({ user_id: user.id, item_id: item.id });
    await db.from('marketplace_items').update({ installs: (item.installs || 0) + 1 }).eq('id', item.id);
    toast.success('Installed to your workspace');
    navigate(`/creator/workspace/${np.id}`);
  };

  const publish = async () => {
    if (!user || !pubProject || !pubTitle.trim()) return;
    setPublishing(true);
    const { error } = await db.from('marketplace_items').insert({
      user_id: user.id, project_id: pubProject, title: pubTitle.trim(), description: pubDesc.trim(), tags: [],
    });
    // Also flip project to public so others can read its files
    await db.from('creator_projects').update({ is_public: true }).eq('id', pubProject);
    setPublishing(false);
    if (error) return toast.error(error.message);
    toast.success('Published \u{1F389}');
    setShowPub(false); setPubTitle(''); setPubDesc(''); setPubProject('');
    db.from('marketplace_items').select('*').order('installs', { ascending: false }).then(({ data }: any) => setItems(data ?? []));
  };

  return (
    <CreatorLayout>
      <div className="flex items-center gap-2 text-primary text-sm font-poppins"><Store className="h-4 w-4" /> Marketplace</div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-orbitron text-3xl text-primary neon-text">Built by KU creators</h1>
        <button onClick={() => setShowPub(true)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> Publish</button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects, tools, templates\u2026"
          className="w-full pl-9 pr-3 py-2 bg-background/60 border border-border rounded-lg text-sm focus:border-primary outline-none" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">
          The marketplace is just getting started. Be the first to publish.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((i) => (
            <div key={i.id} className="rounded-2xl border border-border/60 bg-card/30 p-5 backdrop-blur hover:border-primary/40 transition">
              <div className="font-orbitron text-lg">{i.title}</div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-3 min-h-[3.5em]">{i.description || 'No description.'}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                <span className="inline-flex items-center gap-1"><Download className="h-3 w-3" /> {i.installs ?? 0}</span>
                <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {i.likes ?? 0}</span>
              </div>
              <button onClick={() => install(i)} className="mt-4 w-full py-2 rounded-lg border border-primary/40 text-primary text-sm hover:bg-primary/10">Install</button>
            </div>
          ))}
        </div>
      )}

      {showPub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">Publish a project</h3>
            <label className="text-xs text-muted-foreground">Project</label>
            <select value={pubProject} onChange={e => setPubProject(e.target.value)} className="w-full mt-1 mb-3 bg-background/60 border border-border rounded p-2 text-sm">
              <option value="">Select\u2026</option>
              {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="text-xs text-muted-foreground">Title</label>
            <input value={pubTitle} onChange={e => setPubTitle(e.target.value)} className="w-full mt-1 mb-3 bg-background/60 border border-border rounded p-2 text-sm" />
            <label className="text-xs text-muted-foreground">Description</label>
            <textarea value={pubDesc} onChange={e => setPubDesc(e.target.value)} rows={3} className="w-full mt-1 mb-4 bg-background/60 border border-border rounded p-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPub(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-primary">Cancel</button>
              <button disabled={publishing} onClick={publish} className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm inline-flex items-center gap-1.5 disabled:opacity-50">
                {publishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </CreatorLayout>
  );
}