import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Archive,
  Upload,
  FileArchive,
  FolderArchive,
  Layers,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Download,
  Sliders,
  Zap,
  FolderOpen,
  FileText,
  X,
  ArrowUp,
  ArrowDown,
  Info,
  HardDrive,
  ShieldCheck,
  FolderTree,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import FileVerificationModal from './FileVerificationModal';
import MergeSuccessModal, { MergeSuccessResult } from './MergeSuccessModal';
import ZipFolderTreePreview, { TreeFileItem } from './ZipFolderTreePreview';
import ZipTreePreviewModal from './ZipTreePreviewModal';
import {
  MergeCandidateFile,
  detectDuplicateConflicts,
  validateFinalFiles,
  formatBytes,
  normalizePath
} from '@/plugins/margeos/zip-intelligence/utils/mergeVerificationUtils';

export type ZipCompressionLevel = 'store' | 'normal' | 'max';

export interface ZipArchiveItem {
  id: string;
  file: File;
  handle?: FileSystemFileHandle;
  name: string;
  size: number;
  sizeFormatted: string;
  entryCount?: number;
  entriesPreview?: string[];
  allEntries?: { path: string; size: number }[];
  isInspecting?: boolean;
  error?: string;
  lastModifiedDate: string;
}

export interface ZipFileInputProps {
  id?: string;
  className?: string;
  multiple?: boolean;
  maxFiles?: number;
  allowDrop?: boolean;
  showMergeControls?: boolean;
  defaultBundleTitle?: string;
  initialFiles?: File[];
  onFilesSelected?: (files: File[], items: ZipArchiveItem[]) => void;
  onMergeComplete?: (result: {
    mergedBlob: Blob;
    filename: string;
    fileCount: number;
    totalExtractedFiles: number;
    sizeFormatted: string;
  }) => void;
}

export { formatBytes };

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function';
}

const COMPRESSION_LEVEL_OPTIONS: Array<{
  id: ZipCompressionLevel;
  name: string;
  badge: string;
  desc: string;
  icon: typeof Zap;
}> = [
  {
    id: 'store',
    name: 'Store (Raw)',
    badge: 'Fastest',
    desc: 'Instant packaging without CPU compression overhead.',
    icon: Zap,
  },
  {
    id: 'normal',
    name: 'Normal (Deflate L6)',
    badge: 'Balanced',
    desc: 'Standard ZIP compression (~60-70% size reduction).',
    icon: Layers,
  },
  {
    id: 'max',
    name: 'Maximum (Deflate L9)',
    badge: 'Smallest',
    desc: 'Maximum deflation for tightest archive footprint.',
    icon: Archive,
  },
];

export const ZipFileInput: React.FC<ZipFileInputProps> = ({
  id = 'zip-file-input',
  className = '',
  multiple = true,
  maxFiles = 20,
  allowDrop = true,
  showMergeControls = true,
  defaultBundleTitle = '',
  initialFiles = [],
  onFilesSelected,
  onMergeComplete,
}) => {
  const [items, setItems] = useState<ZipArchiveItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [bundleTitle, setBundleTitle] = useState(defaultBundleTitle);
  const [compressionLevel, setCompressionLevel] = useState<ZipCompressionLevel>('normal');
  const [useSubfolders, setUseSubfolders] = useState(true);
  const [alwaysVerifyConflicts, setAlwaysVerifyConflicts] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [extractedCandidates, setExtractedCandidates] = useState<MergeCandidateFile[] | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isFinalizingSave, setIsFinalizingSave] = useState(false);
  const [mergeSuccessResult, setMergeSuccessResult] = useState<MergeSuccessResult | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [treePreviewModalConfig, setTreePreviewModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    sourceArchiveName?: string;
    bundleTitle?: string;
    files: (TreeFileItem | string)[];
  } | null>(null);
  const [isInlineTreeOpen, setIsInlineTreeOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFsAccess = isFileSystemAccessSupported();

  const inspectZip = async (
    file: File
  ): Promise<{ count: number; entries: string[]; allEntries: { path: string; size: number }[] }> => {
    try {
      const zip = await JSZip.loadAsync(file);
      const fileEntries = Object.entries(zip.files).filter(([_, e]) => !e.dir);
      return {
        count: fileEntries.length,
        entries: fileEntries.slice(0, 5).map(([name]) => name),
        allEntries: fileEntries.map(([name, entry]) => ({
          path: name,
          size: (entry as any)._data?.uncompressedSize || 0,
        })),
      };
    } catch {
      return { count: 0, entries: [], allEntries: [] };
    }
  };

  const processNewFiles = useCallback(
    async (newFiles: File[], handles?: (FileSystemFileHandle | undefined)[]) => {
      const validZipFiles = newFiles.filter((f) => {
        const isZipExt = f.name.toLowerCase().endsWith('.zip');
        const isZipType =
          f.type === 'application/zip' ||
          f.type === 'application/x-zip-compressed' ||
          f.type === 'application/octet-stream';
        return isZipExt || isZipType;
      });

      if (validZipFiles.length === 0 && newFiles.length > 0) {
        toast.error('Only .zip archive files are supported.');
        return;
      }

      if (newFiles.length > validZipFiles.length) {
        toast.warning(`Skipped ${newFiles.length - validZipFiles.length} non-zip file(s).`);
      }

      const newItems: ZipArchiveItem[] = validZipFiles.map((file, idx) => {
        const handle = handles && handles[idx] ? handles[idx] : undefined;
        return {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          handle,
          name: file.name,
          size: file.size,
          sizeFormatted: formatBytes(file.size),
          lastModifiedDate: new Date(file.lastModified).toLocaleDateString(),
          isInspecting: true,
        };
      });

      setItems((prev) => {
        const combined = multiple ? [...prev, ...newItems] : newItems;
        const capped = combined.slice(0, maxFiles);
        if (combined.length > maxFiles) {
          toast.info(`Limited selection to maximum of ${maxFiles} ZIP files.`);
        }
        return capped;
      });

      // Async inspection of each ZIP
      for (const item of newItems) {
        try {
          const { count, entries, allEntries } = await inspectZip(item.file);
          setItems((current) =>
            current.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    entryCount: count,
                    entriesPreview: entries,
                    allEntries: allEntries,
                    isInspecting: false,
                  }
                : it
            )
          );
        } catch {
          setItems((current) =>
            current.map((it) =>
              it.id === item.id
                ? { ...it, isInspecting: false, error: 'Could not inspect archive' }
                : it
            )
          );
        }
      }
    },
    [multiple, maxFiles]
  );

  // Helper to open modal inspection for a specific archive
  const handleInspectArchiveTree = (item: ZipArchiveItem) => {
    const filesList: TreeFileItem[] =
      item.allEntries && item.allEntries.length > 0
        ? item.allEntries.map((e) => ({
            path: e.path,
            originalPath: e.path,
            size: e.size,
            sizeFormatted: formatBytes(e.size),
            sourceArchiveName: item.name,
          }))
        : (item.entriesPreview || []).map((p) => ({
            path: p,
            originalPath: p,
            sourceArchiveName: item.name,
          }));

    setTreePreviewModalConfig({
      isOpen: true,
      title: `Archive Directory Tree: ${item.name}`,
      sourceArchiveName: item.name,
      files: filesList,
    });
  };

  // Helper to open combined modal inspection for all staged archives
  const handleInspectCombinedTree = () => {
    if (items.length === 0) return;
    const combinedFiles: TreeFileItem[] = [];
    for (const item of items) {
      const safeFolderName = item.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      if (item.allEntries && item.allEntries.length > 0) {
        for (const entry of item.allEntries) {
          const targetPath = useSubfolders ? `${safeFolderName}/${entry.path}` : entry.path;
          combinedFiles.push({
            path: normalizePath(targetPath),
            originalPath: entry.path,
            size: entry.size,
            sizeFormatted: formatBytes(entry.size),
            sourceArchiveName: item.name,
          });
        }
      } else if (item.entriesPreview) {
        for (const p of item.entriesPreview) {
          const targetPath = useSubfolders ? `${safeFolderName}/${p}` : p;
          combinedFiles.push({
            path: normalizePath(targetPath),
            originalPath: p,
            sourceArchiveName: item.name,
          });
        }
      }
    }

    setTreePreviewModalConfig({
      isOpen: true,
      title: `Combined Directory Tree Preview (${items.length} Archives)`,
      bundleTitle: bundleTitle.trim() || 'Merged-Bundle',
      files: combinedFiles,
    });
  };

  // Computed combined tree list for inline tree preview
  const combinedStagedTreeFiles = useMemo((): TreeFileItem[] => {
    const result: TreeFileItem[] = [];
    for (const item of items) {
      const safeFolderName = item.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      if (item.allEntries && item.allEntries.length > 0) {
        for (const entry of item.allEntries) {
          const targetPath = useSubfolders ? `${safeFolderName}/${entry.path}` : entry.path;
          result.push({
            path: normalizePath(targetPath),
            originalPath: entry.path,
            size: entry.size,
            sizeFormatted: formatBytes(entry.size),
            sourceArchiveName: item.name,
          });
        }
      } else if (item.entriesPreview) {
        for (const p of item.entriesPreview) {
          const targetPath = useSubfolders ? `${safeFolderName}/${p}` : p;
          result.push({
            path: normalizePath(targetPath),
            originalPath: p,
            sourceArchiveName: item.name,
          });
        }
      }
    }
    return result;
  }, [items, useSubfolders]);

  // Sync with initialFiles if provided
  useEffect(() => {
    if (initialFiles.length > 0 && items.length === 0) {
      processNewFiles(initialFiles);
    }
  }, [initialFiles, processNewFiles]);

  // Notify parent on change
  useEffect(() => {
    if (onFilesSelected) {
      const files = items.map((it) => it.file);
      onFilesSelected(files, items);
    }
  }, [items, onFilesSelected]);

  // Native File System Access API picker
  const handleNativePicker = async () => {
    if (!hasFsAccess || !window.showOpenFilePicker) {
      // Fallback to standard input
      fileInputRef.current?.click();
      return;
    }

    try {
      const handles = await window.showOpenFilePicker({
        multiple,
        excludeAcceptAllOption: false,
        types: [
          {
            description: 'ZIP Archive Files (*.zip)',
            accept: {
              'application/zip': ['.zip'],
              'application/x-zip-compressed': ['.zip'],
              'application/octet-stream': ['.zip'],
            },
          },
        ],
      });

      if (!handles || handles.length === 0) return;

      const files = await Promise.all(handles.map((h) => h.getFile()));
      await processNewFiles(files, handles);
      toast.success(
        `Selected ${files.length} ZIP file${files.length > 1 ? 's' : ''} via File System Access API`
      );
    } catch (err: any) {
      // User cancellation is normal
      if (err?.name === 'AbortError') return;

      console.warn('File System Access API prompt error, falling back to input:', err);
      // If permission denied or other error, trigger standard file input
      fileInputRef.current?.click();
    }
  };

  const handleStandardFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await processNewFiles(files);
      // Reset input value so re-selecting same files triggers change
      e.target.value = '';
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    if (!allowDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!allowDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!allowDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await processNewFiles(files);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    setItems((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  // Step 1: Extraction and conflict verification trigger
  const handleMergeAndSave = async () => {
    if (items.length === 0) {
      toast.error('Please select at least one ZIP file to merge.');
      return;
    }

    setIsMerging(true);
    setMergeProgress({ current: 0, total: items.length, message: 'Extracting candidate files...' });

    try {
      const candidateFiles: MergeCandidateFile[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setMergeProgress({
          current: i + 1,
          total: items.length,
          message: `Inspecting & extracting "${item.name}"...`,
        });

        const safeFolderName = item.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');

        try {
          const sourceZip = await JSZip.loadAsync(item.file);
          const entries = Object.entries(sourceZip.files).filter(([_, entry]) => !entry.dir);

          for (const [relativePath, zipEntry] of entries) {
            const content = await zipEntry.async('uint8array');
            const targetPath = useSubfolders ? `${safeFolderName}/${relativePath}` : relativePath;
            const normTarget = normalizePath(targetPath);
            const lastMod = zipEntry.date ? zipEntry.date.getTime() : item.file.lastModified || Date.now();

            candidateFiles.push({
              id: `${item.id}-${relativePath}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              sourceArchiveId: item.id,
              sourceArchiveName: item.name,
              originalPath: relativePath,
              targetPath: normTarget,
              resolvedPath: normTarget,
              size: content.byteLength,
              sizeFormatted: formatBytes(content.byteLength),
              lastModified: lastMod,
              lastModifiedFormatted: new Date(lastMod).toLocaleDateString(),
              data: content,
              resolution: 'keep',
              isDuplicate: false,
            });
          }
        } catch {
          // If archive had an extraction issue, package raw file safely
          const rawBuffer = await item.file.arrayBuffer();
          const targetPath = `${safeFolderName}/${item.name}`;
          const normTarget = normalizePath(targetPath);
          const lastMod = item.file.lastModified || Date.now();

          candidateFiles.push({
            id: `${item.id}-${item.name}-${Date.now()}`,
            sourceArchiveId: item.id,
            sourceArchiveName: item.name,
            originalPath: item.name,
            targetPath: normTarget,
            resolvedPath: normTarget,
            size: rawBuffer.byteLength,
            sizeFormatted: formatBytes(rawBuffer.byteLength),
            lastModified: lastMod,
            lastModifiedFormatted: new Date(lastMod).toLocaleDateString(),
            data: new Uint8Array(rawBuffer),
            resolution: 'keep',
            isDuplicate: false,
          });
        }
      }

      // Step 2: Verification Analysis
      const verification = detectDuplicateConflicts(candidateFiles);

      if (verification.hasConflicts || alwaysVerifyConflicts) {
        setExtractedCandidates(verification.files);
        setIsVerificationOpen(true);
        setIsMerging(false);
        setMergeProgress(null);
        if (verification.hasConflicts) {
          toast.warning(
            `Detected ${verification.conflictGroups.length} duplicate filename conflict(s). Please review and resolve before final save.`
          );
        } else {
          toast.info(`Extracted ${candidateFiles.length} files. Verification checklist ready.`);
        }
        return;
      }

      // If no conflicts and alwaysVerifyConflicts is false, proceed to direct save
      await finalizeZipSave(candidateFiles);
    } catch (err: any) {
      console.error('Merge extraction error:', err);
      toast.error('Failed to extract files for merging. ' + (err?.message || ''));
      setIsMerging(false);
      setMergeProgress(null);
    }
  };

  // Step 3: Final package generation and save after verification
  const finalizeZipSave = async (resolvedFiles: MergeCandidateFile[]) => {
    setIsFinalizingSave(true);
    setMergeProgress({ current: 0, total: resolvedFiles.length, message: 'Packaging verified files...' });

    try {
      const mergedZip = new JSZip();
      const activeFiles = resolvedFiles.filter(
        (f) => f.resolution !== 'overwrite' && f.resolution !== 'skip'
      );

      // Validate no remaining collisions
      const validation = validateFinalFiles(resolvedFiles);
      if (!validation.isValid) {
        toast.error(
          `Cannot save: Duplicate filename collisions remain (${validation.remainingCollisions.join(', ')})`
        );
        setIsFinalizingSave(false);
        return;
      }

      // Add each verified and resolved file to the new ZIP
      for (let i = 0; i < activeFiles.length; i++) {
        const file = activeFiles[i];
        mergedZip.file(normalizePath(file.resolvedPath), file.data);
      }

      // Create detailed merge manifest
      const title = bundleTitle.trim() || `Merged-Bundle-${new Date().toISOString().slice(0, 10)}`;
      const sourceManifest = items.map((it) => ({
        name: it.name,
        size: it.size,
        filesContributed: activeFiles.filter((f) => f.sourceArchiveName === it.name).length,
      }));

      const manifestData = {
        title,
        createdAt: new Date().toISOString(),
        totalSourceArchives: items.length,
        totalExtractedFiles: resolvedFiles.length,
        finalActiveFilesCount: activeFiles.length,
        renamedFilesCount: resolvedFiles.filter((f) => f.resolution === 'rename').length,
        overwrittenFilesCount: resolvedFiles.filter((f) => f.resolution === 'overwrite').length,
        skippedFilesCount: resolvedFiles.filter((f) => f.resolution === 'skip').length,
        compressionLevel,
        sources: sourceManifest,
        files: activeFiles.map((f) => ({
          path: f.resolvedPath,
          sourceArchive: f.sourceArchiveName,
          originalPath: f.originalPath,
          size: f.size,
        })),
        generator: 'Knowledge Universe MargeOS ZIP Engine with Conflict Verification',
      };

      mergedZip.file('merge-manifest.json', JSON.stringify(manifestData, null, 2));

      setMergeProgress({
        current: activeFiles.length,
        total: activeFiles.length,
        message: `Compressing package (${compressionLevel.toUpperCase()})...`,
      });

      const zipOptions =
        compressionLevel === 'store'
          ? { type: 'blob' as const, compression: 'STORE' as const }
          : {
              type: 'blob' as const,
              compression: 'DEFLATE' as const,
              compressionOptions: { level: compressionLevel === 'max' ? 9 : 6 },
            };

      const blob = await mergedZip.generateAsync(zipOptions);
      const safeFileName =
        title.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/(^-|-$)/g, '') + '.zip';

      // Save via File System Access API or file-saver fallback
      let savedViaFs = false;
      if (hasFsAccess && window.showSaveFilePicker) {
        try {
          const saveHandle = await window.showSaveFilePicker({
            suggestedName: safeFileName,
            types: [
              {
                description: 'ZIP Archive (*.zip)',
                accept: { 'application/zip': ['.zip'] },
              },
            ],
          });
          const writable = await (saveHandle as any).createWritable();
          await writable.write(blob);
          await writable.close();
          savedViaFs = true;
          toast.success(`Successfully saved merged ZIP directly to "${safeFileName}"!`);
        } catch (saveErr: any) {
          if (saveErr?.name === 'AbortError') {
            setIsFinalizingSave(false);
            setMergeProgress(null);
            return;
          }
        }
      }

      if (!savedViaFs) {
        saveAs(blob, safeFileName);
      }

      setIsVerificationOpen(false);

      const successData: MergeSuccessResult = {
        mergedBlob: blob,
        filename: safeFileName,
        bundleTitle: title,
        fileCount: items.length,
        totalExtractedFiles: activeFiles.length,
        sizeBytes: blob.size,
        sizeFormatted: formatBytes(blob.size),
        rawSizeBytes: totalBytes,
        rawSizeFormatted: formatBytes(totalBytes),
        compressionLevel,
        sourceNames: items.map((it) => it.name),
        filesList: activeFiles.map((f) => ({
          path: f.resolvedPath,
          size: f.size,
          sizeFormatted: f.sizeFormatted || formatBytes(f.size),
          sourceArchive: f.sourceArchiveName,
        })),
        conflictResolutions: {
          renamed: resolvedFiles.filter((f) => f.resolution === 'rename').length,
          overwritten: resolvedFiles.filter((f) => f.resolution === 'overwrite').length,
          skipped: resolvedFiles.filter((f) => f.resolution === 'skip').length,
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMergeSuccessResult(successData);
      setIsSuccessModalOpen(true);

      toast.success('ZIP Merge Successful!', {
        description: `Consolidated ${items.length} archives into ${activeFiles.length} files (${formatBytes(blob.size)})`,
        action: {
          label: 'Download Combined ZIP',
          onClick: () => {
            saveAs(blob, safeFileName);
          },
        },
        duration: 7000,
      });

      if (onMergeComplete) {
        onMergeComplete({
          mergedBlob: blob,
          filename: safeFileName,
          fileCount: items.length,
          totalExtractedFiles: activeFiles.length,
          sizeFormatted: formatBytes(blob.size),
        });
      }
    } catch (err: any) {
      console.error('Finalize save error:', err);
      toast.error('Failed to save merged ZIP archive. ' + (err?.message || ''));
    } finally {
      setIsFinalizingSave(false);
      setIsMerging(false);
      setMergeProgress(null);
    }
  };

  const totalBytes = items.reduce((acc, it) => acc + it.size, 0);
  const totalEntriesCount = items.reduce((acc, it) => acc + (it.entryCount || 0), 0);

  return (
    <div id={id} className={`w-full space-y-4 font-poppins text-foreground ${className}`}>
      {/* Hidden fallback file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept=".zip,application/zip,application/x-zip-compressed,application/octet-stream"
        onChange={handleStandardFileInput}
        className="hidden"
        id={`${id}-hidden-input`}
      />

      {/* Main Upload / Drag Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all p-6 text-center ${
          isDragging
            ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30'
            : 'border-border/80 hover:border-primary/50 bg-card/40 hover:bg-card/70'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <FolderArchive className="h-8 w-8 text-primary animate-pulse" />
            </div>
            {hasFsAccess && (
              <span
                className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold flex items-center gap-0.5"
                title="File System Access API Active"
              >
                <HardDrive className="h-2.5 w-2.5" />
                Native FS
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-orbitron text-sm sm:text-base font-bold text-foreground">
              Select Multiple ZIP Archives to Merge
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {hasFsAccess
                ? 'Leverages the modern File System Access API for high-speed local disk selection & direct streaming.'
                : 'Select multiple .zip files or drag and drop archives directly here.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              id={`${id}-native-picker-btn`}
              onClick={handleNativePicker}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-orbitron font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              <FolderOpen className="h-4 w-4" />
              <span>{hasFsAccess ? 'Browse with File System API' : 'Select ZIP Files'}</span>
            </button>

            <button
              type="button"
              id={`${id}-standard-picker-btn`}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-poppins font-medium flex items-center gap-1.5 transition-all border border-border/60"
            >
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Standard Input</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono pt-1">
            <span>Supports .zip archives</span>
            <span>•</span>
            <span>Batch multi-selection enabled</span>
          </div>
        </div>
      </div>

      {/* Selected Archives List */}
      {items.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h4 className="font-orbitron text-xs font-bold text-foreground">
                Selected Archives ({items.length})
              </h4>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Total: {formatBytes(totalBytes)}
              </span>
              {totalEntriesCount > 0 && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  (~{totalEntriesCount} files)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id={`${id}-preview-tree-btn`}
                onClick={handleInspectCombinedTree}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium flex items-center gap-1.5 transition-colors border border-cyan-500/20"
                title="Inspect directory hierarchy of all staged archives before merging"
              >
                <FolderTree className="h-3 w-3" />
                <span>Tree Preview</span>
              </button>
              <button
                type="button"
                id={`${id}-toggle-inline-tree-btn`}
                onClick={() => setIsInlineTreeOpen((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border ${
                  isInlineTreeOpen
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground border-border/50'
                }`}
                title="Toggle expandable folder tree preview"
              >
                {isInlineTreeOpen ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    <span>Hide Tree</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    <span>Show Tree</span>
                  </>
                )}
              </button>
              <button
                type="button"
                id={`${id}-add-more-btn`}
                onClick={handleNativePicker}
                className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add More
              </button>
              <button
                type="button"
                id={`${id}-clear-all-btn`}
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </button>
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={item.id}
                id={`${id}-item-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/40 transition-all gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileArchive className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md" title={item.name}>
                        {item.name}
                      </span>
                      {item.handle && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-bold shrink-0">
                          FS Handle
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5 flex-wrap">
                      <span>{item.sizeFormatted}</span>
                      <span>•</span>
                      {item.isInspecting ? (
                        <span className="flex items-center gap-1 text-primary">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Inspecting contents...
                        </span>
                      ) : item.entryCount !== undefined ? (
                        <span>{item.entryCount} bundled files</span>
                      ) : null}
                    </div>

                    {item.entriesPreview && item.entriesPreview.length > 0 && (
                      <div className="text-[9px] text-muted-foreground/80 font-mono truncate mt-1">
                        Files: {item.entriesPreview.join(', ')}
                        {item.entryCount && item.entryCount > 5 ? ' ...' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reorder and Delete controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Inspect directory tree structure of this archive"
                    onClick={() => handleInspectArchiveTree(item)}
                    className="p-1 rounded-md text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  >
                    <FolderTree className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Move up"
                    disabled={idx === 0}
                    onClick={() => handleMoveItem(idx, 'up')}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Move down"
                    disabled={idx === items.length - 1}
                    onClick={() => handleMoveItem(idx, 'down')}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Inline Directory Tree Preview */}
          {isInlineTreeOpen && (
            <div className="pt-3 border-t border-border/50">
              <ZipFolderTreePreview
                files={combinedStagedTreeFiles}
                title="Staged Files Directory Structure"
                bundleTitle={bundleTitle.trim() || 'Merged-Archive'}
                defaultExpandedDepth={1}
                maxHeight="300px"
                showSearch={true}
                showStats={true}
                showInspector={true}
              />
            </div>
          )}

          {/* Merge & Compression Controls */}
          {showMergeControls && (
            <div className="mt-4 pt-4 border-t border-border/50 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Merged Package Name
                  </label>
                  <input
                    type="text"
                    id={`${id}-bundle-title`}
                    placeholder="e.g. Master-Consolidated-Pack"
                    value={bundleTitle}
                    onChange={(e) => setBundleTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs font-poppins text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Namespace Strategy
                  </label>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border text-xs">
                    <span className="text-[11px] text-muted-foreground">Keep archive folders</span>
                    <button
                      type="button"
                      onClick={() => setUseSubfolders(!useSubfolders)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        useSubfolders
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {useSubfolders ? 'Subfolders (Safe)' : 'Flat Merge'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Compression Configuration */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-primary" />
                  Compression Ratio Settings
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COMPRESSION_LEVEL_OPTIONS.map((c) => {
                    const Icon = c.icon;
                    const isSelected = compressionLevel === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCompressionLevel(c.id)}
                        className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-primary/20 border-primary shadow-sm ring-1 ring-primary/40'
                            : 'bg-muted/20 border-border/60 hover:bg-muted/40 hover:border-border'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                              <Icon className="h-3 w-3 text-primary" />
                              {c.name}
                            </span>
                            {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                          </div>
                        </div>
                        <span
                          className={`mt-1.5 text-[8px] font-mono px-1 py-0.2 rounded text-center block ${
                            isSelected
                              ? 'bg-primary text-primary-foreground font-bold'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {c.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verification & Conflict Settings */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <div>
                    <span className="font-medium text-foreground block">Verification & Duplicate Resolver</span>
                    <span className="text-[10px] text-muted-foreground">Prompt to overwrite or rename conflicting files before final save</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAlwaysVerifyConflicts(!alwaysVerifyConflicts)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    alwaysVerifyConflicts
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {alwaysVerifyConflicts ? 'Active' : 'Auto Only'}
                </button>
              </div>

              {/* Progress State */}
              {(isMerging || isFinalizingSave) && mergeProgress && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-primary font-bold">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {mergeProgress.message}
                    </span>
                    <span className="text-muted-foreground">
                      {mergeProgress.current} / {mergeProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{
                        width: `${Math.round((mergeProgress.current / Math.max(mergeProgress.total, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Merge Button */}
              <button
                type="button"
                id={`${id}-merge-btn`}
                onClick={handleMergeAndSave}
                disabled={isMerging || isFinalizingSave || items.length === 0}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-neon-cyan text-primary-foreground font-orbitron text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {isMerging || isFinalizingSave ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing {items.length} Archives...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>
                      Merge {items.length} ZIP Files & Verify ({compressionLevel.toUpperCase()})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Verification and Conflict Resolution Modal */}
      {isVerificationOpen && extractedCandidates && (
        <FileVerificationModal
          isOpen={isVerificationOpen}
          onClose={() => {
            setIsVerificationOpen(false);
            setIsFinalizingSave(false);
          }}
          initialFiles={extractedCandidates}
          sourceArchivesCount={items.length}
          bundleTitle={bundleTitle.trim() || `Merged-Bundle-${new Date().toISOString().slice(0, 10)}`}
          compressionLevel={compressionLevel}
          isSaving={isFinalizingSave}
          onConfirmSave={finalizeZipSave}
        />
      )}

      {/* Success Modal with Download Combined ZIP & Content Summary */}
      {isSuccessModalOpen && mergeSuccessResult && (
        <MergeSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          result={mergeSuccessResult}
        />
      )}

      {/* Standalone Tree Preview Modal */}
      {treePreviewModalConfig?.isOpen && (
        <ZipTreePreviewModal
          isOpen={treePreviewModalConfig.isOpen}
          onClose={() => setTreePreviewModalConfig(null)}
          files={treePreviewModalConfig.files}
          title={treePreviewModalConfig.title}
          sourceArchiveName={treePreviewModalConfig.sourceArchiveName}
          bundleTitle={treePreviewModalConfig.bundleTitle}
          onProceedToMerge={items.length > 0 ? handleMergeAndSave : undefined}
        />
      )}
    </div>
  );
};

export default ZipFileInput;
