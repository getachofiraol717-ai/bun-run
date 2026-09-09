import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Archive, Download, Plus, Trash2, FileCheck, Layers, Sparkles, CheckCircle2, Upload, FileArchive, ArrowDownToLine, Loader2, Zap, Sliders, Check } from 'lucide-react';
import { toast } from 'sonner';
import ZipFileInput, { formatBytes } from './ZipFileInput';

export type CompressionLevel = 'store' | 'normal' | 'max';

export interface MergedZipItem {
  id: string;
  title: string;
  fileName: string;
  fileCount: number;
  sizeFormatted: string;
  timestamp: string;
  sourceNames: string[];
  compressionLevel?: CompressionLevel;
  // If user merged custom files, store lightweight file content structure in localStorage
  files?: Array<{ path: string; content: string }>;
}

const DEFAULT_RECENT_MERGES: MergedZipItem[] = [
  {
    id: 'merge-1',
    title: 'Grade 9 STEM Master Curriculum',
    fileName: 'grade9-stem-master-bundle.zip',
    fileCount: 14,
    sizeFormatted: '4.2 MB',
    timestamp: 'Today, 11:30 AM',
    sourceNames: ['math-textbook-g9.zip', 'physics-lab-manual.zip', 'chemistry-notes.zip'],
    compressionLevel: 'normal',
    files: [
      { path: 'math/curriculum-overview.txt', content: 'Ethiopian Grade 9 Mathematics Syllabus & Problem Sets\nUnits 1-8 Covered.' },
      { path: 'physics/lab-manual.txt', content: 'Grade 9 Physics Laboratory Experiments & Formula Sheet.' },
      { path: 'chemistry/reaction-guide.txt', content: 'Chemistry Periodic Table & Chemical Reactions Reference.' },
      { path: 'manifest.json', content: JSON.stringify({ bundle: 'Grade 9 STEM Master', version: '2026.1', mergedAt: new Date().toISOString() }, null, 2) },
    ]
  },
  {
    id: 'merge-2',
    title: 'Ethiopia MoE Learning Resources Pack',
    fileName: 'moe-learning-pack-2026.zip',
    fileCount: 22,
    sizeFormatted: '8.7 MB',
    timestamp: 'Yesterday, 4:15 PM',
    sourceNames: ['biology-grade9.zip', 'english-skills.zip', 'amharic-lit.zip'],
    compressionLevel: 'max',
    files: [
      { path: 'biology/genetics-basics.txt', content: 'Unit 4: Basics of Cell Biology and Genetics.' },
      { path: 'english/vocabulary-builder.txt', content: 'Grade 9 Academic Vocabulary and Reading Comprehension.' },
      { path: 'amharic/literature-guide.txt', content: 'Grade 9 Amharic Literature and Grammar Essentials.' },
      { path: 'READ_ME.md', content: '# MoE Consolidated Learning Pack\n\nAll digital textbooks consolidated for offline study.' }
    ]
  },
  {
    id: 'merge-3',
    title: 'AI Tutor Practice & Quiz Datasets',
    fileName: 'ai-tutor-quiz-datasets.zip',
    fileCount: 8,
    sizeFormatted: '1.8 MB',
    timestamp: 'Jul 29, 2026',
    sourceNames: ['quiz-bank-math.zip', 'ai-tutor-prompts.zip'],
    compressionLevel: 'store',
    files: [
      { path: 'quizzes/math-practice-questions.json', content: JSON.stringify([{ id: 1, q: 'Solve 2x + 5 = 15', a: 'x = 5' }], null, 2) },
      { path: 'prompts/tutor-persona-config.json', content: JSON.stringify({ name: 'Margeos Tutor', language: 'en/am' }, null, 2) }
    ]
  }
];

const STORAGE_KEY = 'ku_recent_zip_merges';
const COMPRESSION_STORAGE_KEY = 'ku_zip_compression_level';

export const COMPRESSION_CONFIGS: Array<{
  id: CompressionLevel;
  name: string;
  badge: string;
  levelText: string;
  desc: string;
  icon: typeof Zap;
}> = [
  {
    id: 'store',
    name: 'Store',
    badge: 'Fastest',
    levelText: 'Raw / 0%',
    desc: '⚡ No compression. Instant archiving speed.',
    icon: Zap,
  },
  {
    id: 'normal',
    name: 'Normal',
    badge: 'Balanced',
    levelText: 'Deflate L6',
    desc: '⚖️ Standard ZIP compression (~65% size reduction).',
    icon: Layers,
  },
  {
    id: 'max',
    name: 'Max',
    badge: 'Smallest',
    levelText: 'Deflate L9',
    desc: '📦 Maximum compression ratio for minimal file size.',
    icon: Archive,
  },
];

const RecentMerges: React.FC = () => {
  const [merges, setMerges] = useState<MergedZipItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  // Compression state
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>(() => {
    try {
      const saved = localStorage.getItem(COMPRESSION_STORAGE_KEY);
      if (saved === 'store' || saved === 'normal' || saved === 'max') {
        return saved as CompressionLevel;
      }
    } catch {}
    return 'normal';
  });

  // New merge form state
  const [bundleTitle, setBundleTitle] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMerges(JSON.parse(stored));
      } else {
        setMerges(DEFAULT_RECENT_MERGES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECENT_MERGES));
      }
    } catch {
      setMerges(DEFAULT_RECENT_MERGES);
    }
  }, []);

  const handleCompressionChange = (level: CompressionLevel) => {
    setCompressionLevel(level);
    try {
      localStorage.setItem(COMPRESSION_STORAGE_KEY, level);
    } catch {}
    toast.info(`ZIP Compression set to ${level.toUpperCase()} mode`);
  };

  const getZipAsyncOptions = (level: CompressionLevel) => {
    if (level === 'store') {
      return {
        type: 'blob' as const,
        compression: 'STORE' as const,
      };
    }
    return {
      type: 'blob' as const,
      compression: 'DEFLATE' as const,
      compressionOptions: {
        level: level === 'max' ? 9 : 6,
      },
    };
  };

  const saveToStorage = (items: MergedZipItem[]) => {
    setMerges(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore storage errors */
    }
  };

  // Quick download single ZIP file
  const handleQuickDownload = async (item: MergedZipItem) => {
    setDownloadingId(item.id);
    try {
      const zip = new JSZip();

      if (item.files && item.files.length > 0) {
        item.files.forEach(f => zip.file(f.path, f.content));
      } else {
        // Fallback default content if files structure missing
        zip.file('README.txt', `Consolidated Package: ${item.title}\nExported: ${new Date().toLocaleString()}`);
        zip.file('metadata.json', JSON.stringify({ title: item.title, sources: item.sourceNames }, null, 2));
      }

      // Use specified compression level or global default
      const levelToUse = item.compressionLevel || compressionLevel;
      const blob = await zip.generateAsync(getZipAsyncOptions(levelToUse));
      saveAs(blob, item.fileName);
      toast.success(`Downloaded "${item.fileName}" (${levelToUse.toUpperCase()} compression)!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate ZIP download.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete item from history
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = merges.filter(m => m.id !== id);
    saveToStorage(filtered);
    toast.success('Removed from recent merges history');
  };

  return (
    <div className="glass rounded-2xl p-5 mb-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-orbitron text-base font-semibold text-foreground flex items-center gap-2">
              Recent Merges
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono font-normal">
                {merges.length} archives
              </span>
            </h3>
            <p className="text-xs text-muted-foreground font-poppins">
              Consolidated ZIP archives & customizable compression
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Compression Level Quick Selector Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowQuickSettings((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl border border-border glass hover:bg-muted/40 text-xs font-poppins text-foreground flex items-center gap-1.5 transition-colors"
              title="Compression Level Settings"
            >
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline font-medium">ZIP Level:</span>
              <span className="font-mono uppercase text-primary font-bold">{compressionLevel}</span>
            </button>

            {showQuickSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuickSettings(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 glass-strong border border-border rounded-xl p-3 shadow-2xl min-w-[260px] animate-fade-in space-y-2">
                  <p className="text-[11px] font-semibold font-orbitron text-foreground uppercase border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-primary" /> Compression Level
                  </p>
                  <div className="space-y-1">
                    {COMPRESSION_CONFIGS.map((c) => {
                      const Icon = c.icon;
                      const isSelected = compressionLevel === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            handleCompressionChange(c.id);
                            setShowQuickSettings(false);
                          }}
                          className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors ${
                            isSelected ? 'bg-primary/15 border border-primary/40' : 'hover:bg-muted/50 border border-transparent'
                          }`}
                        >
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">{c.name}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${isSelected ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground'}`}>
                                {c.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{c.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowMergeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-orbitron font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md hover:shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Merge ZIP Files
          </button>
        </div>
      </div>

      {/* List of Merged Packages */}
      {merges.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/60 bg-muted/10">
          <FileArchive className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-poppins font-medium text-foreground">No recent ZIP merges</p>
          <p className="text-xs text-muted-foreground font-poppins mt-1 max-w-sm mx-auto">
            Consolidate multiple ZIP files or course assets into a single clean archive package.
          </p>
          <button
            onClick={() => setShowMergeModal(true)}
            className="mt-3 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-poppins font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Consolidate Files Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {merges.map((item) => {
            const isDownloading = downloadingId === item.id;
            const itemLevel = item.compressionLevel || compressionLevel;
            return (
              <div
                key={item.id}
                className="group relative glass-strong rounded-xl p-4 border border-border/60 hover:border-primary/40 transition-all hover:shadow-lg flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                        <FileArchive className="h-4 w-4" />
                      </div>
                      <h4 className="font-orbitron text-xs font-bold text-foreground truncate" title={item.title}>
                        {item.title}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      title="Remove from history"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] font-mono text-muted-foreground mt-2 truncate" title={item.fileName}>
                    {item.fileName}
                  </p>

                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-poppins mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3 text-primary/80" />
                      {item.fileCount} {item.fileCount === 1 ? 'file' : 'files'}
                    </span>
                    <span>•</span>
                    <span>{item.sizeFormatted}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px] font-mono uppercase font-semibold">
                      {itemLevel}
                    </span>
                  </div>

                  {item.sourceNames && item.sourceNames.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">Sources:</span>
                      {item.sourceNames.map((s, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground shrink-0 font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Download Button */}
                <button
                  onClick={() => handleQuickDownload(item)}
                  disabled={isDownloading}
                  className="w-full mt-1 py-2 px-3 rounded-lg bg-gradient-to-r from-primary to-neon-cyan text-primary-foreground font-orbitron text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating ({itemLevel.toUpperCase()})...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                      <span>Quick Download ({itemLevel.toUpperCase()})</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Merge Modal / Dialog */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-strong rounded-2xl border border-border p-6 max-w-xl w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <h3 className="font-orbitron text-base font-bold text-foreground">Consolidate ZIP Files</h3>
              </div>
              <button
                onClick={() => setShowMergeModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <ZipFileInput
              id="recent-merges-zip-input"
              defaultBundleTitle={bundleTitle}
              onMergeComplete={(result) => {
                const newItem: MergedZipItem = {
                  id: `merge-${Date.now()}`,
                  title: result.filename.replace(/\.zip$/i, ''),
                  fileName: result.filename,
                  fileCount: result.totalExtractedFiles,
                  sizeFormatted: result.sizeFormatted,
                  timestamp: 'Just now',
                  sourceNames: [`${result.fileCount} archives consolidated`],
                  compressionLevel,
                };
                const updated = [newItem, ...merges.slice(0, 19)];
                saveToStorage(updated);
                setShowMergeModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentMerges;

