import React, { useState, useMemo, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  FileSpreadsheet,
  FileArchive,
  FileJson,
  ChevronRight,
  ChevronDown,
  Search,
  FolderTree,
  Layers,
  HardDrive,
  Filter,
  Check,
  Copy,
  Info,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatBytes } from '@/plugins/margeos/zip-intelligence/utils/mergeVerificationUtils';

export interface TreeFileItem {
  id?: string;
  path: string;
  originalPath?: string;
  size?: number;
  sizeFormatted?: string;
  lastModified?: number;
  lastModifiedFormatted?: string;
  sourceArchiveName?: string;
  resolution?: 'keep' | 'overwrite' | 'rename' | 'skip';
  isDuplicate?: boolean;
}

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  size: number;
  totalSize: number;
  fileCount: number;
  children: TreeNode[];
  sourceArchiveName?: string;
  fileItem?: TreeFileItem;
  resolution?: 'keep' | 'overwrite' | 'rename' | 'skip';
  isDuplicate?: boolean;
}

/**
 * Builds a nested hierarchical tree from a flat list of file paths/items
 */
export function buildFileTree(items: (TreeFileItem | string)[]): TreeNode {
  const root: TreeNode = {
    id: 'root',
    name: 'root',
    path: '',
    isFolder: true,
    size: 0,
    totalSize: 0,
    fileCount: 0,
    children: [],
  };

  for (const raw of items) {
    const item: TreeFileItem = typeof raw === 'string' ? { path: raw } : raw;
    const cleanPath = item.path.replace(/^[/\\]+/, '').replace(/[/\\]+$/, '');
    if (!cleanPath) continue;

    const parts = cleanPath.split(/[/\\]+/);
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (isLast) {
        // It's a file
        const fileNode: TreeNode = {
          id: item.id || `file-${currentPath}`,
          name: part,
          path: currentPath,
          isFolder: false,
          size: item.size || 0,
          totalSize: item.size || 0,
          fileCount: 1,
          children: [],
          sourceArchiveName: item.sourceArchiveName,
          fileItem: item,
          resolution: item.resolution,
          isDuplicate: item.isDuplicate,
        };
        currentNode.children.push(fileNode);
      } else {
        // It's a folder
        let folderNode = currentNode.children.find((c) => c.isFolder && c.name === part);
        if (!folderNode) {
          folderNode = {
            id: `dir-${currentPath}`,
            name: part,
            path: currentPath,
            isFolder: true,
            size: 0,
            totalSize: 0,
            fileCount: 0,
            children: [],
          };
          currentNode.children.push(folderNode);
        }
        currentNode = folderNode;
      }
    }
  }

  // Recursive rollup of folder counts and aggregate sizes + sorting
  function calculateMetricsAndSort(node: TreeNode): { totalSize: number; fileCount: number } {
    if (!node.isFolder) {
      return { totalSize: node.size, fileCount: 1 };
    }

    let folderSize = 0;
    let folderFileCount = 0;

    for (const child of node.children) {
      const { totalSize, fileCount } = calculateMetricsAndSort(child);
      folderSize += totalSize;
      folderFileCount += fileCount;
    }

    node.totalSize = folderSize;
    node.fileCount = folderFileCount;

    // Sort folders first, then alphabetical
    node.children.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    return { totalSize: folderSize, fileCount: folderFileCount };
  }

  calculateMetricsAndSort(root);
  return root;
}

/**
 * Helper to select appropriate Lucide icon by file extension
 */
export function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'cs':
    case 'go':
    case 'rs':
    case 'php':
    case 'rb':
    case 'swift':
    case 'kt':
    case 'html':
    case 'css':
    case 'scss':
    case 'vue':
    case 'svelte':
    case 'sh':
    case 'bash':
      return { Icon: FileCode, color: 'text-cyan-400' };
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'xml':
      return { Icon: FileJson, color: 'text-amber-400' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'bmp':
    case 'ico':
      return { Icon: FileImage, color: 'text-emerald-400' };
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
    case 'm4a':
      return { Icon: FileAudio, color: 'text-purple-400' };
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'avi':
    case 'mkv':
      return { Icon: FileVideo, color: 'text-indigo-400' };
    case 'csv':
    case 'xlsx':
    case 'xls':
      return { Icon: FileSpreadsheet, color: 'text-green-400' };
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
    case 'rar':
      return { Icon: FileArchive, color: 'text-yellow-400' };
    case 'md':
    case 'txt':
    case 'rtf':
    case 'pdf':
    case 'doc':
    case 'docx':
      return { Icon: FileText, color: 'text-blue-400' };
    default:
      return { Icon: File, color: 'text-muted-foreground' };
  }
}

export interface ZipFolderTreePreviewProps {
  files: (TreeFileItem | string)[];
  title?: string;
  sourceArchiveName?: string;
  defaultExpandedDepth?: number;
  maxHeight?: string;
  showSearch?: boolean;
  showStats?: boolean;
  showInspector?: boolean;
  onFileSelect?: (file: TreeFileItem) => void;
  className?: string;
  isCompact?: boolean;
}

export const ZipFolderTreePreview: React.FC<ZipFolderTreePreviewProps> = ({
  files,
  title,
  sourceArchiveName,
  defaultExpandedDepth = 2,
  maxHeight = '480px',
  showSearch = true,
  showStats = true,
  showInspector = true,
  onFileSelect,
  className = '',
  isCompact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchive, setSelectedArchive] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const [initializedDepth, setInitializedDepth] = useState(false);

  // Extract unique source archives if present
  const sourceArchives = useMemo(() => {
    const set = new Set<string>();
    for (const f of files) {
      if (typeof f !== 'string' && f.sourceArchiveName) {
        set.add(f.sourceArchiveName);
      }
    }
    return Array.from(set);
  }, [files]);

  // Filter files by source archive if selected
  const filteredFiles = useMemo(() => {
    if (selectedArchive === 'all') return files;
    return files.filter((f) => {
      if (typeof f === 'string') return true;
      return f.sourceArchiveName === selectedArchive;
    });
  }, [files, selectedArchive]);

  // Build tree
  const rootTree = useMemo(() => {
    return buildFileTree(filteredFiles);
  }, [filteredFiles]);

  // Automatically expand initial depth on mount or files change
  useMemo(() => {
    const initial = new Set<string>();

    function traverse(node: TreeNode, depth: number) {
      if (node.isFolder) {
        if (depth <= defaultExpandedDepth || searchQuery.trim() !== '') {
          initial.add(node.path || 'root');
        }
        for (const child of node.children) {
          traverse(child, depth + 1);
        }
      }
    }

    traverse(rootTree, 0);
    setExpandedPaths(initial);
  }, [rootTree, defaultExpandedDepth, searchQuery]);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      const key = path || 'root';
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = new Set<string>();
    function traverse(node: TreeNode) {
      if (node.isFolder) {
        all.add(node.path || 'root');
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    traverse(rootTree);
    setExpandedPaths(all);
  }, [rootTree]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  // Filter tree recursively by search query
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matchingPaths = new Set<string>();

    function checkNode(node: TreeNode): boolean {
      let hasMatch = node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q);

      if (node.isFolder) {
        for (const child of node.children) {
          if (checkNode(child)) {
            hasMatch = true;
          }
        }
      }

      if (hasMatch) {
        matchingPaths.add(node.path || 'root');
        // Ensure parent paths are also expanded
        const parts = node.path.split('/');
        for (let i = 1; i < parts.length; i++) {
          matchingPaths.add(parts.slice(0, i).join('/'));
        }
      }

      return hasMatch;
    }

    checkNode(rootTree);
    return matchingPaths;
  }, [rootTree, searchQuery]);

  // Handle node selection
  const handleNodeClick = (node: TreeNode) => {
    if (node.isFolder) {
      toggleExpand(node.path);
    } else {
      setSelectedNode(node);
      if (node.fileItem && onFileSelect) {
        onFileSelect(node.fileItem);
      }
    }
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    toast.success(`Copied path "${path}"`);
  };

  // Render individual tree node recursively
  const renderNode = (node: TreeNode, depth: number = 0) => {
    if (node.id === 'root') {
      return (
        <div className="space-y-0.5">
          {node.children.map((child) => renderNode(child, 0))}
        </div>
      );
    }

    // Check search visibility
    if (searchMatches && !searchMatches.has(node.path)) {
      return null;
    }

    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedNode?.id === node.id;
    const isOverwritten = node.resolution === 'overwrite';
    const isSkipped = node.resolution === 'skip';
    const isRenamed = node.resolution === 'rename';

    if (node.isFolder) {
      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => handleNodeClick(node)}
            className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors group text-xs font-poppins hover:bg-muted/50 ${
              isSelected ? 'bg-primary/15 text-primary' : 'text-foreground'
            }`}
            style={{ paddingLeft: `${Math.max(depth * 14 + 6, 6)}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-muted-foreground group-hover:text-foreground transition-transform">
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </span>

              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-primary/80 shrink-0" />
              )}

              <span className="font-semibold text-foreground font-mono truncate" title={node.name}>
                {node.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono shrink-0 ml-2">
              <span className="px-1.5 py-0.2 rounded bg-muted/70 text-muted-foreground">
                {node.fileCount} {node.fileCount === 1 ? 'file' : 'files'}
              </span>
              {node.totalSize > 0 && (
                <span className="hidden sm:inline text-muted-foreground/80">
                  {formatBytes(node.totalSize)}
                </span>
              )}
            </div>
          </div>

          {/* Children nodes */}
          {isExpanded && node.children.length > 0 && (
            <div className="border-l border-border/40 ml-[13px] my-0.5 space-y-0.5">
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File Node
    const { Icon, color } = getFileIcon(node.name);

    return (
      <div
        key={node.id}
        onClick={() => handleNodeClick(node)}
        className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-all text-xs font-poppins group hover:bg-muted/40 ${
          isSelected
            ? 'bg-primary/20 text-primary border-l-2 border-primary'
            : isSkipped
            ? 'opacity-40 line-through bg-muted/30'
            : isOverwritten
            ? 'opacity-60 bg-muted/20'
            : isRenamed
            ? 'bg-primary/5'
            : 'text-foreground'
        }`}
        style={{ paddingLeft: `${Math.max(depth * 14 + 6, 6)}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />

          <span
            className="font-mono text-foreground truncate text-[11px]"
            title={node.path}
          >
            {node.name}
          </span>

          {node.isDuplicate && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 text-[9px] font-mono font-bold shrink-0 border border-amber-500/20">
              DUP
            </span>
          )}

          {isRenamed && (
            <span className="px-1.5 py-0.2 rounded bg-primary/20 text-primary text-[9px] font-mono font-bold shrink-0 border border-primary/30">
              RENAMED
            </span>
          )}

          {isSkipped && (
            <span className="px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground text-[9px] font-mono font-bold shrink-0 border border-border/50">
              SKIPPED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono shrink-0 ml-2">
          {node.sourceArchiveName && sourceArchives.length > 1 && (
            <span className="hidden md:inline px-1.5 py-0.2 rounded bg-muted/60 text-[9px] text-muted-foreground truncate max-w-[100px]">
              {node.sourceArchiveName}
            </span>
          )}
          <span>{node.size > 0 ? formatBytes(node.size) : '0 B'}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl border border-border/80 bg-card/80 flex flex-col overflow-hidden shadow-sm ${className}`}
    >
      {/* Header & Controls Toolbar */}
      <div className="p-3 sm:p-4 border-b border-border/60 bg-muted/20 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FolderTree className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-orbitron text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                {title || 'ZIP Directory Tree Structure'}
                {sourceArchiveName && (
                  <span className="text-[11px] font-normal text-muted-foreground font-mono">
                    ({sourceArchiveName})
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-muted-foreground font-poppins">
                Explore nested folders, file counts, and verify directory hierarchy
              </p>
            </div>
          </div>

          {/* Expand / Collapse Toolbar */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-[11px] font-medium transition-colors border border-border/50 flex items-center gap-1"
              title="Expand all directories"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Expand All</span>
            </button>

            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-[11px] font-medium transition-colors border border-border/50 flex items-center gap-1"
              title="Collapse all directories"
            >
              <Minimize2 className="h-3 w-3" />
              <span>Collapse All</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          {showSearch && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter folder tree / filename..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-card border border-border text-xs font-poppins text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {sourceArchives.length > 1 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedArchive}
                onChange={(e) => setSelectedArchive(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-card border border-border text-xs font-poppins text-foreground focus:outline-none focus:border-primary"
              >
                <option value="all">All Source Archives ({sourceArchives.length})</option>
                {sourceArchives.map((arch) => (
                  <option key={arch} value={arch}>
                    {arch}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Body with Tree and Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60 flex-1 min-h-0">
        {/* Tree Container */}
        <div
          className={`${
            showInspector && selectedNode && !selectedNode.isFolder
              ? 'md:col-span-2'
              : 'md:col-span-3'
          } p-3 overflow-y-auto font-mono text-xs`}
          style={{ maxHeight }}
        >
          {rootTree.children.length === 0 ? (
            <div className="text-center py-10 px-4 text-muted-foreground space-y-2">
              <FolderTree className="h-8 w-8 mx-auto text-muted-foreground/50 animate-pulse" />
              <p className="text-xs">No files or directories found in selection.</p>
            </div>
          ) : (
            renderNode(rootTree, 0)
          )}
        </div>

        {/* Selected File Details Inspector */}
        {showInspector && selectedNode && !selectedNode.isFolder && (
          <div className="p-4 bg-muted/10 space-y-3 font-poppins overflow-y-auto" style={{ maxHeight }}>
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="font-orbitron text-xs font-bold text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                File Details
              </span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-mono block">
                  Filename
                </label>
                <p className="font-mono font-bold text-foreground break-all">{selectedNode.name}</p>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-mono block">
                  Full Path
                </label>
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-card border border-border mt-0.5">
                  <p className="font-mono text-[11px] text-foreground truncate">{selectedNode.path}</p>
                  <button
                    type="button"
                    onClick={() => handleCopyPath(selectedNode.path)}
                    className="p-1 text-muted-foreground hover:text-primary shrink-0"
                    title="Copy full path"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {selectedNode.fileItem?.originalPath &&
                selectedNode.fileItem.originalPath !== selectedNode.path && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-mono block">
                      Original Source Path
                    </label>
                    <p className="font-mono text-[11px] text-muted-foreground break-all">
                      {selectedNode.fileItem.originalPath}
                    </p>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-card border border-border">
                  <span className="text-[10px] text-muted-foreground block">Size</span>
                  <span className="font-mono font-bold text-foreground text-xs">
                    {selectedNode.size > 0 ? formatBytes(selectedNode.size) : '0 B'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-card border border-border">
                  <span className="text-[10px] text-muted-foreground block">Archive Source</span>
                  <span className="font-mono font-bold text-foreground text-xs truncate block" title={selectedNode.sourceArchiveName}>
                    {selectedNode.sourceArchiveName || 'Archive'}
                  </span>
                </div>
              </div>

              {selectedNode.resolution && (
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-mono block mb-1">
                    Merge Resolution Status
                  </label>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      selectedNode.resolution === 'skip'
                        ? 'bg-muted text-muted-foreground border border-border/60'
                        : selectedNode.resolution === 'overwrite'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : selectedNode.resolution === 'rename'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {selectedNode.resolution.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Summary Stats */}
      {showStats && (
        <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs font-mono text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Folder className="h-3.5 w-3.5 text-primary" />
              <span>Total Files: <strong className="text-foreground">{rootTree.fileCount}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
              <span>Uncompressed: <strong className="text-foreground">{formatBytes(rootTree.totalSize)}</strong></span>
            </span>
          </div>

          {searchQuery && (
            <span className="text-[11px] text-primary">
              Filtered query: &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ZipFolderTreePreview;
