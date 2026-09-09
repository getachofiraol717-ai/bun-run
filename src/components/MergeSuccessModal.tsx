import React, { useState, useMemo } from 'react';
import { saveAs } from 'file-saver';
import {
  CheckCircle2,
  Download,
  Archive,
  Layers,
  FileText,
  Copy,
  Check,
  X,
  Search,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FolderArchive,
  HardDrive,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

export interface MergeSuccessFileSummary {
  path: string;
  size: number;
  sizeFormatted: string;
  sourceArchive?: string;
}

export interface MergeSuccessResult {
  mergedBlob: Blob;
  filename: string;
  bundleTitle?: string;
  fileCount: number; // number of source zip archives
  totalExtractedFiles: number; // total files in combined ZIP
  sizeBytes: number;
  sizeFormatted: string;
  rawSizeBytes?: number;
  rawSizeFormatted?: string;
  compressionLevel: 'store' | 'normal' | 'max' | string;
  sourceNames: string[];
  filesList?: MergeSuccessFileSummary[];
  conflictResolutions?: {
    renamed: number;
    overwritten: number;
    skipped: number;
  };
  timestamp?: string;
}

export interface MergeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: MergeSuccessResult | null;
  onCustomDownload?: (result: MergeSuccessResult) => void;
}

export const MergeSuccessModal: React.FC<MergeSuccessModalProps> = ({
  isOpen,
  onClose,
  result,
  onCustomDownload,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [showFileBreakdown, setShowFileBreakdown] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const filteredFiles = useMemo(() => {
    if (!result?.filesList) return [];
    if (!searchFilter.trim()) return result.filesList;
    const q = searchFilter.toLowerCase();
    return result.filesList.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        (f.sourceArchive && f.sourceArchive.toLowerCase().includes(q))
    );
  }, [result?.filesList, searchFilter]);

  if (!isOpen || !result) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (onCustomDownload) {
        onCustomDownload(result);
      } else {
        saveAs(result.mergedBlob, result.filename);
      }
      setHasDownloaded(true);
      toast.success(`Downloaded combined archive "${result.filename}" (${result.sizeFormatted})`);
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error('Failed to trigger file download: ' + (err?.message || ''));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopySummary = async () => {
    const summaryText = [
      `=== Knowledge Universe Consolidated ZIP Package ===`,
      `Filename: ${result.filename}`,
      `Bundle Title: ${result.bundleTitle || 'Untitled Bundle'}`,
      `Combined Size: ${result.sizeFormatted} (${result.sizeBytes.toLocaleString()} bytes)`,
      `Total Content Files: ${result.totalExtractedFiles}`,
      `Source Archives: ${result.fileCount} (${result.sourceNames.join(', ')})`,
      `Compression: ${result.compressionLevel.toUpperCase()}`,
      `Generated: ${result.timestamp || new Date().toLocaleString()}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedManifest(true);
      toast.success('Merge summary copied to clipboard!');
      setTimeout(() => setCopiedManifest(false), 2500);
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  };

  const compressionLabel =
    result.compressionLevel === 'store'
      ? 'Store (Raw 0%)'
      : result.compressionLevel === 'max'
      ? 'Max Deflate (L9)'
      : 'Normal Deflate (L6)';

  return (
    <div
      id="merge-success-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="merge-success-modal-dialog"
        className="glass-strong bg-card/95 border border-primary/30 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto font-poppins"
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-success-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          id="close-merge-success-modal-btn"
          className="absolute top-5 right-5 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Section */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold font-orbitron flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> MERGE SUCCESSFUL
              </span>
              <span className="text-xs text-muted-foreground font-poppins">
                {result.sourceNames.length} Archives Consolidated
              </span>
            </div>
            <h3
              id="merge-success-title"
              className="text-lg sm:text-xl font-bold font-orbitron text-foreground tracking-tight mt-1"
            >
              Combined ZIP Ready
            </h3>
            <p className="text-xs text-muted-foreground font-poppins line-clamp-1 mt-0.5">
              Target: <span className="font-mono text-foreground font-medium">{result.filename}</span>
            </p>
          </div>
        </div>

        {/* Summary Metric Cards (Mathematical spacing & high contrast) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Combined Size */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <HardDrive className="h-3.5 w-3.5 text-primary" />
              <span>Combined Size</span>
            </div>
            <p className="text-lg font-bold font-orbitron text-foreground tracking-tight">
              {result.sizeFormatted}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {result.sizeBytes.toLocaleString()} bytes
            </p>
          </div>

          {/* Content Count */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span>Content Count</span>
            </div>
            <p className="text-lg font-bold font-orbitron text-foreground tracking-tight">
              {result.totalExtractedFiles}
            </p>
            <p className="text-[10px] text-muted-foreground">packaged files</p>
          </div>

          {/* Compression & Integrity */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Compression</span>
            </div>
            <p className="text-xs font-bold font-orbitron text-foreground truncate mt-1">
              {compressionLabel}
            </p>
            <p className="text-[10px] text-emerald-400/90 font-medium">100% Conflict-Verified</p>
          </div>
        </div>

        {/* Primary Download Combined ZIP Hero Button */}
        <div className="space-y-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            id="download-combined-zip-btn"
            className={`w-full py-3 px-5 rounded-xl text-sm font-semibold font-orbitron flex items-center justify-center gap-2.5 transition-all shadow-lg ${
              hasDownloaded
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/40'
                : 'bg-gradient-to-r from-primary via-cyan-500 to-blue-600 hover:opacity-95 text-primary-foreground shadow-primary/25 hover:scale-[1.01]'
            }`}
          >
            {hasDownloaded ? (
              <>
                <Check className="h-4 w-4" />
                <span>Re-Download Combined ZIP ({result.sizeFormatted})</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Combined ZIP ({result.sizeFormatted})</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <Archive className="h-3 w-3 text-primary" /> Includes{' '}
              <strong className="text-foreground font-mono font-normal">merge-manifest.json</strong>
            </span>
            <button
              onClick={handleCopySummary}
              className="text-primary hover:underline flex items-center gap-1 font-medium"
              id="copy-merge-summary-btn"
            >
              {copiedManifest ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy Summary
                </>
              )}
            </button>
          </div>
        </div>

        {/* Source Archives Breakdown */}
        <div className="rounded-xl bg-card/60 border border-border/70 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <FolderArchive className="h-3.5 w-3.5 text-primary" />
              Source Archives ({result.sourceNames.length})
            </span>
            {result.conflictResolutions && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {result.conflictResolutions.renamed > 0 && `${result.conflictResolutions.renamed} renamed · `}
                {result.conflictResolutions.overwritten > 0 && `${result.conflictResolutions.overwritten} overwritten · `}
                {result.conflictResolutions.skipped > 0 && `${result.conflictResolutions.skipped} skipped`}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {result.sourceNames.map((name, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-md bg-muted/60 text-foreground text-[11px] font-mono border border-border/50 truncate max-w-full"
                title={name}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Expandable Content Files Breakdown */}
        {result.filesList && result.filesList.length > 0 && (
          <div className="border border-border/60 rounded-xl overflow-hidden bg-card/40">
            <button
              onClick={() => setShowFileBreakdown((prev) => !prev)}
              id="toggle-file-breakdown-btn"
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                <span>View All Merged Content Files ({result.filesList.length})</span>
              </span>
              {showFileBreakdown ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showFileBreakdown && (
              <div className="p-3 border-t border-border/60 space-y-2 animate-fade-in bg-background/50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search inside combined package..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                  {filteredFiles.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No files match your search filter.
                    </p>
                  ) : (
                    filteredFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 rounded bg-card/80 border border-border/40 hover:border-border"
                      >
                        <span className="truncate max-w-[70%] text-foreground" title={file.path}>
                          {file.path}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-shrink-0">
                          {file.sourceArchive && (
                            <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[120px]">
                              {file.sourceArchive}
                            </span>
                          )}
                          <span className="font-semibold text-foreground">{file.sizeFormatted}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
          <button
            onClick={onClose}
            id="close-merge-success-btn"
            className="px-4 py-2 rounded-xl text-xs font-semibold font-poppins text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Done
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            id="footer-download-zip-btn"
            className="px-4 py-2 rounded-xl text-xs font-semibold font-poppins bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download ZIP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeSuccessModal;
