import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  FileWarning,
  Sliders,
  Copy,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
  FolderArchive,
  FileText,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Archive,
  FolderTree,
} from 'lucide-react';
import ZipFolderTreePreview, { TreeFileItem } from './ZipFolderTreePreview';
import {
  MergeCandidateFile,
  DuplicateConflictGroup,
  detectDuplicateConflicts,
  autoResolveConflicts,
  validateFinalFiles,
  formatBytes,
  normalizePath,
  splitPath,
} from '@/plugins/margeos/zip-intelligence/utils/mergeVerificationUtils';

export interface FileVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFiles: MergeCandidateFile[];
  sourceArchivesCount: number;
  bundleTitle: string;
  compressionLevel: string;
  isSaving: boolean;
  onConfirmSave: (resolvedFiles: MergeCandidateFile[]) => void;
}

export const FileVerificationModal: React.FC<FileVerificationModalProps> = ({
  isOpen,
  onClose,
  initialFiles,
  sourceArchivesCount,
  bundleTitle,
  compressionLevel,
  isSaving,
  onConfirmSave,
}) => {
  const [files, setFiles] = useState<MergeCandidateFile[]>(initialFiles);
  const [activeTab, setActiveTab] = useState<'conflicts' | 'all_files' | 'tree_view'>('conflicts');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArchive, setFilterArchive] = useState<string>('all');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [customPathInput, setCustomPathInput] = useState<string>('');

  // Re-detect conflicts on current state
  const verification = useMemo(() => {
    return detectDuplicateConflicts(files);
  }, [files]);

  // Validate active non-skipped / non-overwritten files for collisions
  const validation = useMemo(() => {
    return validateFinalFiles(files);
  }, [files]);

  if (!isOpen) return null;

  const archivesList = Array.from(new Set(files.map((f) => f.sourceArchiveName)));

  // Bulk Auto-Resolution Handlers
  const handleAutoStrategy = (
    strategy: 'rename-prefix' | 'rename-number' | 'overwrite-latest' | 'overwrite-first'
  ) => {
    const updated = autoResolveConflicts(files, strategy);
    setFiles(updated);
    setEditingFileId(null);
  };

  // Individual file resolution: pick winner for a conflict group
  const handlePickWinner = (conflictGroup: DuplicateConflictGroup, winnerId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (conflictGroup.files.some((cg) => cg.id === f.id)) {
          if (f.id === winnerId) {
            return {
              ...f,
              resolution: 'keep',
              resolvedPath: f.targetPath,
            };
          } else {
            return {
              ...f,
              resolution: 'overwrite',
              resolvedPath: f.targetPath,
            };
          }
        }
        return f;
      })
    );
  };

  // Start editing a file's custom path
  const handleStartEditing = (file: MergeCandidateFile) => {
    setEditingFileId(file.id);
    setCustomPathInput(file.resolvedPath || file.targetPath);
  };

  // Save custom renamed path
  const handleSaveCustomPath = (fileId: string) => {
    const norm = normalizePath(customPathInput);
    if (!norm) return;

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            resolution: 'rename',
            resolvedPath: norm,
          };
        }
        return f;
      })
    );
    setEditingFileId(null);
  };

  // Toggle skip/exclude file
  const handleToggleSkip = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          const nextResolution = f.resolution === 'skip' ? 'keep' : 'skip';
          return {
            ...f,
            resolution: nextResolution,
          };
        }
        return f;
      })
    );
  };

  // Reset all to initial target paths
  const handleResetResolutions = () => {
    setFiles(
      initialFiles.map((f) => ({
        ...f,
        resolution: 'keep',
        resolvedPath: f.targetPath,
      }))
    );
    setEditingFileId(null);
  };

  // Filtered files for 'all_files' tab
  const filteredAllFiles = files.filter((f) => {
    const matchesSearch =
      f.originalPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.resolvedPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.sourceArchiveName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchive = filterArchive === 'all' || f.sourceArchiveName === filterArchive;
    return matchesSearch && matchesArchive;
  });

  const conflictsCount = verification.conflictGroups.length;
  const activeCount = validation.activeFiles.length;
  const skippedCount = files.filter((f) => f.resolution === 'skip').length;
  const overwrittenCount = files.filter((f) => f.resolution === 'overwrite').length;
  const renamedCount = files.filter((f) => f.resolution === 'rename').length;

  return (
    <div
      id="file-verification-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in font-poppins"
    >
      <div className="bg-card border border-border/80 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                conflictsCount > 0 && !validation.isValid
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
              }`}
            >
              {conflictsCount > 0 && !validation.isValid ? (
                <FileWarning className="h-5 w-5 animate-pulse" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-orbitron text-base sm:text-lg font-bold text-foreground">
                  Merge Verification & Conflict Resolution
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    validation.isValid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {validation.isValid
                    ? 'Verified & Ready'
                    : `${validation.remainingCollisions.length} Conflict${
                        validation.remainingCollisions.length > 1 ? 's' : ''
                      } Pending`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reviewing {files.length} files extracted across {sourceArchivesCount} archives before
                saving to &ldquo;<span className="text-foreground font-medium">{bundleTitle}</span>&rdquo;
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conflict Status Banner */}
        {conflictsCount > 0 ? (
          <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                Found <strong>{conflictsCount}</strong> duplicate filename destination collision
                {conflictsCount > 1 ? 's' : ''}. Choose whether to <strong>overwrite</strong> or{' '}
                <strong>rename</strong> each file before the final save.
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <span>{renamedCount} Renamed</span>
              <span>•</span>
              <span>{overwrittenCount} Overwritten</span>
              <span>•</span>
              <span>{skippedCount} Skipped</span>
            </div>
          </div>
        ) : (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>
              All {files.length} files have unique destination paths. No duplicate conflicts detected.
            </span>
          </div>
        )}

        {/* Global Quick Resolution Strategy Toolbar */}
        {conflictsCount > 0 && (
          <div className="px-5 py-3 border-b border-border/60 bg-card/40 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Quick Auto-Resolve:
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleAutoStrategy('rename-prefix')}
                className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors border border-primary/20 flex items-center gap-1"
                title="Prefix duplicate filenames with their source archive name"
              >
                <Copy className="h-3 w-3" />
                Archive Prefix
              </button>

              <button
                type="button"
                onClick={() => handleAutoStrategy('rename-number')}
                className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors border border-primary/20 flex items-center gap-1"
                title="Append sequential numbers (_2, _3) to duplicate files"
              >
                <Edit3 className="h-3 w-3" />
                Auto Number (_2)
              </button>

              <button
                type="button"
                onClick={() => handleAutoStrategy('overwrite-latest')}
                className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-xs font-medium transition-colors border border-border/60 flex items-center gap-1"
                title="Keep the most recently modified file and overwrite older ones"
              >
                <RefreshCw className="h-3 w-3" />
                Keep Newest
              </button>

              <button
                type="button"
                onClick={() => handleAutoStrategy('overwrite-first')}
                className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-xs font-medium transition-colors border border-border/60 flex items-center gap-1"
                title="Keep the file from the first archive and overwrite subsequent duplicates"
              >
                <Archive className="h-3 w-3" />
                Keep First
              </button>

              <button
                type="button"
                onClick={handleResetResolutions}
                className="px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground text-xs transition-colors ml-1"
                title="Reset all resolutions back to initial state"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-border/50 flex items-center justify-between gap-3 bg-muted/10 flex-wrap">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setActiveTab('conflicts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'conflicts'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <AlertTriangle
                className={`h-3.5 w-3.5 ${
                  conflictsCount > 0 ? 'text-amber-400' : 'text-muted-foreground'
                }`}
              />
              <span>Duplicate Conflicts ({conflictsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all_files')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'all_files'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5 text-primary" />
              <span>All Files ({files.length})</span>
            </button>

            <button
              type="button"
              id="tree-preview-tab-btn"
              onClick={() => setActiveTab('tree_view')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'tree_view'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderTree className="h-3.5 w-3.5 text-cyan-400" />
              <span>Directory Tree Preview</span>
            </button>
          </div>

          {/* Search / Filter */}
          <div className="flex items-center gap-2 flex-1 max-w-xs justify-end">
            <div className="relative w-full">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search file paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-card border border-border/70 text-xs font-poppins text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            {archivesList.length > 1 && (
              <select
                value={filterArchive}
                onChange={(e) => setFilterArchive(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-card border border-border/70 text-xs font-poppins text-foreground focus:outline-none focus:border-primary shrink-0"
              >
                <option value="all">All Archives</option>
                {archivesList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'conflicts' ? (
            verification.conflictGroups.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit mx-auto ring-1 ring-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="font-orbitron text-sm sm:text-base font-bold text-foreground">
                  No Duplicate Filename Conflicts
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Every file extracted from your archives has a unique path in the merged bundle. You
                  can proceed directly to saving or review the full file list.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('all_files')}
                  className="px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted text-xs font-medium text-foreground transition-colors border border-border inline-flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  View All {files.length} Merged Files
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {verification.conflictGroups
                  .filter((cg) =>
                    cg.targetPath.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((group, groupIdx) => {
                    const activeInGroup = group.files.filter(
                      (f) => f.resolution !== 'overwrite' && f.resolution !== 'skip'
                    );
                    const isGroupColliding =
                      activeInGroup.length > 1 &&
                      new Set(activeInGroup.map((f) => f.resolvedPath)).size < activeInGroup.length;

                    return (
                      <div
                        key={group.conflictGroupId}
                        className={`rounded-2xl border p-4 transition-all space-y-3 ${
                          isGroupColliding
                            ? 'bg-amber-500/5 border-amber-500/40 shadow-sm ring-1 ring-amber-500/20'
                            : 'bg-card/70 border-border/80'
                        }`}
                      >
                        {/* Group Title Bar */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded bg-muted/60 border border-border">
                              #{groupIdx + 1}
                            </span>
                            <span
                              className="text-xs sm:text-sm font-semibold font-mono text-foreground truncate"
                              title={group.targetPath}
                            >
                              {group.targetPath}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold shrink-0">
                              {group.files.length} Sources Collide
                            </span>
                          </div>

                          {isGroupColliding && (
                            <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1 font-semibold">
                              <AlertTriangle className="h-3 w-3" />
                              Resolution Needed
                            </span>
                          )}
                        </div>

                        {/* Colliding Files in this group */}
                        <div className="space-y-2">
                          {group.files.map((file) => {
                            const isEditing = editingFileId === file.id;
                            const isOverwritten = file.resolution === 'overwrite';
                            const isSkipped = file.resolution === 'skip';
                            const isRenamed = file.resolution === 'rename';
                            const isKeep = file.resolution === 'keep';

                            return (
                                <div
                                key={file.id}
                                className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isOverwritten
                                    ? 'bg-muted/20 border-border/40 opacity-60'
                                    : isSkipped
                                    ? 'bg-muted/30 border-border/40 opacity-50'
                                    : isRenamed
                                    ? 'bg-primary/10 border-primary/40'
                                    : 'bg-card border-border/80'
                                }`}
                              >
                                {/* File details */}
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md bg-muted/80 text-[10px] font-mono font-bold text-foreground flex items-center gap-1 shrink-0 border border-border/50">
                                      <FolderArchive className="h-3 w-3 text-primary" />
                                      {file.sourceArchiveName}
                                    </span>
                                    <span className="text-muted-foreground font-mono text-[10px]">
                                      Size: {file.sizeFormatted}
                                    </span>
                                    <span className="text-muted-foreground font-mono text-[10px]">
                                      Date: {file.lastModifiedFormatted}
                                    </span>

                                    {isOverwritten && (
                                      <span className="px-1.5 py-0.2 rounded bg-muted text-[9px] font-mono text-muted-foreground font-bold">
                                        Will Overwrite
                                      </span>
                                    )}
                                    {isSkipped && (
                                      <span className="px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground text-[9px] font-mono font-bold border border-border/50">
                                        Skipped
                                      </span>
                                    )}
                                    {isRenamed && (
                                      <span className="px-1.5 py-0.2 rounded bg-primary/20 text-primary text-[9px] font-mono font-bold border border-primary/30">
                                        Renamed
                                      </span>
                                    )}
                                    {isKeep && !isOverwritten && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30">
                                        Target Master
                                      </span>
                                    )}
                                  </div>

                                  {/* Path and inline renaming */}
                                  {isEditing ? (
                                    <div className="flex items-center gap-2 pt-1">
                                      <input
                                        type="text"
                                        value={customPathInput}
                                        onChange={(e) => setCustomPathInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveCustomPath(file.id);
                                          if (e.key === 'Escape') setEditingFileId(null);
                                        }}
                                        className="w-full px-2.5 py-1 rounded-lg bg-card border border-primary text-xs font-mono text-foreground focus:outline-none"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveCustomPath(file.id)}
                                        className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingFileId(null)}
                                        className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs shrink-0"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 font-mono text-xs pt-0.5">
                                      <span className="text-muted-foreground truncate">
                                        {file.originalPath}
                                      </span>
                                      {file.resolvedPath !== file.originalPath && (
                                        <>
                                          <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                                          <span className="text-primary font-bold truncate">
                                            {file.resolvedPath}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Actions per file */}
                                <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                                  <button
                                    type="button"
                                    onClick={() => handlePickWinner(group, file.id)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                                      isKeep && !isOverwritten
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-muted/60 hover:bg-muted text-foreground border border-border/60'
                                    }`}
                                    title="Keep this file and overwrite all other conflicting duplicates"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>{isKeep && !isOverwritten ? 'Primary' : 'Overwrite with this'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleStartEditing(file)}
                                    className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border/60 text-xs font-medium transition-colors flex items-center gap-1"
                                    title="Rename destination filename/path"
                                  >
                                    <Edit3 className="h-3 w-3 text-primary" />
                                    <span>Rename</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleSkip(file.id)}
                                    className={`p-1 rounded-lg transition-colors ${
                                      isSkipped
                                        ? 'bg-muted/80 text-foreground border border-border/60'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                                    }`}
                                    title={isSkipped ? 'Include file again' : 'Exclude from merged ZIP'}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )
          ) : activeTab === 'all_files' ? (
            /* All Files View */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 px-1">
                <span>
                  Showing {filteredAllFiles.length} of {files.length} candidate files
                </span>
                <span>Active in final bundle: {activeCount} files</span>
              </div>

              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredAllFiles.map((file) => {
                  const isOverwritten = file.resolution === 'overwrite';
                  const isSkipped = file.resolution === 'skip';
                  const isRenamed = file.resolution === 'rename';

                  return (
                    <div
                      key={file.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isSkipped
                          ? 'bg-muted/30 border-border/40 opacity-50'
                          : isOverwritten
                          ? 'bg-muted/30 border-border/40 opacity-60'
                          : isRenamed
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-card border-border/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-muted text-[10px] font-mono text-muted-foreground font-bold shrink-0">
                            {file.sourceArchiveName}
                          </span>
                          <span className="font-mono text-foreground font-medium truncate" title={file.resolvedPath}>
                            {file.resolvedPath}
                          </span>
                          {file.isDuplicate && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 text-[9px] font-mono font-bold shrink-0 border border-amber-500/20">
                              Duplicate Group
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                          <span>Original: {file.originalPath}</span>
                          <span>•</span>
                          <span>Size: {file.sizeFormatted}</span>
                          <span>•</span>
                          <span>Status: {file.resolution.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('conflicts');
                            handleStartEditing(file);
                          }}
                          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Rename file"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSkip(file.id)}
                          className={`p-1 rounded-lg ${
                            isSkipped
                              ? 'text-foreground bg-muted border border-border/60'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                          }`}
                          title={isSkipped ? 'Include file' : 'Exclude file'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Directory Tree Preview Tab */
            <div className="space-y-3">
              <ZipFolderTreePreview
                files={files.map((f) => ({
                  id: f.id,
                  path: f.resolvedPath,
                  originalPath: f.originalPath,
                  size: f.size,
                  sizeFormatted: f.sizeFormatted,
                  lastModified: f.lastModified,
                  lastModifiedFormatted: f.lastModifiedFormatted,
                  sourceArchiveName: f.sourceArchiveName,
                  resolution: f.resolution,
                  isDuplicate: f.isDuplicate,
                }))}
                title="Consolidated Package Structure"
                bundleTitle={bundleTitle}
                defaultExpandedDepth={2}
                maxHeight="45vh"
                showSearch={true}
                showStats={true}
                showInspector={true}
              />
            </div>
          )}
        </div>

        {/* Validation Errors Notice */}
        {!validation.isValid && (
          <div className="px-5 py-2.5 bg-amber-500/10 border-t border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Unresolved collision:</strong> {validation.remainingCollisions.length} path(s)
              still have duplicate assignments ({validation.remainingCollisions.slice(0, 2).join(', ')}
              {validation.remainingCollisions.length > 2 ? '...' : ''}). Please rename or overwrite to
              proceed.
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Layers className="h-4 w-4 text-primary" />
            <span>
              Final package: <strong>{activeCount}</strong> files ({compressionLevel.toUpperCase()})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold transition-colors border border-border/60"
            >
              Cancel
            </button>

            <button
              type="button"
              id="confirm-verified-save-btn"
              onClick={() => onConfirmSave(files)}
              disabled={isSaving || !validation.isValid || activeCount === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-neon-cyan text-primary-foreground font-orbitron text-xs font-bold flex items-center gap-2 hover:opacity-95 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              <FileCheck className="h-4 w-4" />
              <span>Confirm & Save Final ZIP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileVerificationModal;
