// @ts-nocheck
/**
 * useProjectExplorer Hook
 * React hook for project file exploration and navigation
 */

import { useState, useCallback, useMemo } from 'react';
import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';
import ProjectSearchService, { SearchOptions, SearchSummary } from '../services/ProjectSearchService';

export interface UseProjectExplorerReturn {
  // State
  project: Project | null;
  currentFolder: ProjectFolder;
  selectedFile: ProjectFile | null;
  expandedFolders: Set<string>;
  searchQuery: string;
  searchResults: SearchSummary | null;
  viewMode: 'tree' | 'list' | 'grid';
  sortBy: 'name' | 'type' | 'size' | 'modified';
  sortOrder: 'asc' | 'desc';
  fileTypeFilter: string[];

  // Navigation
  currentPath: string[];
  breadcrumbs: Array<{ name: string; path: string }>;

  // Actions
  setProject: (project: Project) => void;
  navigateToFolder: (folder: ProjectFolder) => void;
  navigateUp: () => void;
  navigateToPath: (path: string) => void;
  toggleFolder: (folderId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  selectFile: (file: ProjectFile | null) => void;

  // Search
  setSearchQuery: (query: string) => void;
  performSearch: (query: string, options?: SearchOptions) => Promise<void>;
  clearSearch: () => void;

  // View controls
  setViewMode: (mode: 'tree' | 'list' | 'grid') => void;
  setSortBy: (sort: 'name' | 'type' | 'size' | 'modified') => void;
  toggleSortOrder: () => void;
  setFileTypeFilter: (types: string[]) => void;

  // File operations
  getFileContent: (file: ProjectFile) => string | null;
  getFileUrl: (file: ProjectFile) => string | null;
  getFileIcon: (file: ProjectFile) => string;

  // Computed
  visibleFiles: ProjectFile[];
  visibleFolders: ProjectFolder[];
  totalFiles: number;
  totalFolders: number;
  fileTypeCounts: Record<string, number>;
}

export function useProjectExplorer(): UseProjectExplorerReturn {
  const [project, setProjectState] = useState<Project | null>(null);
  const [currentFolder, setCurrentFolder] = useState<ProjectFolder | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSummary | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'grid'>('tree');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'size' | 'modified'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);

  const searchService = useMemo(() => ProjectSearchService.getInstance(), []);

  const setProject = useCallback((proj: Project) => {
    setProjectState(proj);
    setCurrentFolder(proj.rootFolder);
    setSelectedFile(null);
    setSearchResults(null);
    setSearchQuery('');

    // Expand root by default
    setExpandedFolders(new Set([proj.rootFolder.id]));
  }, []);

  const navigateToFolder = useCallback((folder: ProjectFolder) => {
    setCurrentFolder(folder);
    setSelectedFile(null);
  }, []);

  const navigateUp = useCallback(() => {
    if (!project || !currentFolder) return;

    if (currentFolder.path === project.rootFolder.path) return;

    const pathParts = currentFolder.path.split('/').filter(Boolean);
    pathParts.pop();

    const parentPath = pathParts.length > 0 ? pathParts.join('/') : project.rootFolder.path;
    const parent = findFolderByPath(project.rootFolder, parentPath);

    if (parent) {
      setCurrentFolder(parent);
    }
  }, [project, currentFolder]);

  const navigateToPath = useCallback((path: string) => {
    if (!project) return;

    const folder = findFolderByPath(project.rootFolder, path);
    if (folder) {
      setCurrentFolder(folder);
    }
  }, [project]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!project) return;

    const allIds = new Set<string>();
    const collectIds = (folder: ProjectFolder) => {
      allIds.add(folder.id);
      folder.subfolders.forEach(collectIds);
    };
    collectIds(project.rootFolder);

    setExpandedFolders(allIds);
  }, [project]);

  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  const selectFile = useCallback((file: ProjectFile | null) => {
    setSelectedFile(file);
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    if (!query) {
      setSearchResults(null);
    }
  }, []);

  const performSearch = useCallback(async (query: string, options?: SearchOptions) => {
    if (!project || !query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchQueryState(query);

    const results = await searchService.search(project, query, {
      includeContent: true,
      maxResults: 100,
      ...options,
    });

    setSearchResults(results);
  }, [project, searchService]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const getFileContent = useCallback((file: ProjectFile): string | null => {
    return file.content || null;
  }, []);

  const getFileUrl = useCallback((file: ProjectFile): string | null => {
    if (!file.content) return null;
    const blob = new Blob([file.content], { type: 'text/plain' });
    return URL.createObjectURL(blob);
  }, []);

  const getFileIcon = useCallback((file: ProjectFile): string => {
    const ext = file.extension.toLowerCase();

    const iconMap: Record<string, string> = {
      '.ts': '📘',
      '.tsx': '⚛️',
      '.js': '📜',
      '.jsx': '⚛️',
      '.json': '📋',
      '.md': '📝',
      '.html': '🌐',
      '.css': '🎨',
      '.scss': '🎨',
      '.py': '🐍',
      '.java': '☕',
      '.go': '🔵',
      '.rs': '🦀',
      '.rb': '💎',
      '.php': '🐘',
      '.sql': '🗃️',
      '.sh': '📟',
      '.yaml': '📄',
      '.yml': '📄',
      '.xml': '📄',
    };

    return iconMap[ext] || '📄';
  }, []);

  // Computed: current path
  const currentPath = useMemo(() => {
    if (!currentFolder) return [];
    return currentFolder.path.split('/').filter(Boolean);
  }, [currentFolder]);

  // Computed: breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!project) return [];

    const crumbs: Array<{ name: string; path: string }> = [];
    const parts = currentFolder?.path.split('/').filter(Boolean) || [];

    let currentPath = '';
    for (const part of parts) {
      currentPath += (currentPath ? '/' : '') + part;
      crumbs.push({ name: part, path: currentPath });
    }

    return crumbs;
  }, [project, currentFolder]);

  // Computed: visible files
  const visibleFiles = useMemo(() => {
    let files = currentFolder?.files || [];

    // Apply type filter
    if (fileTypeFilter.length > 0) {
      files = files.filter((f) =>
        fileTypeFilter.includes(f.extension.toLowerCase())
      );
    }

    // Sort
    files = [...files].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.extension.localeCompare(b.extension);
          break;
        case 'size':
          comparison = (a.content?.length || 0) - (b.content?.length || 0);
          break;
        case 'modified':
          comparison = 0; // Would need modification time
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return files;
  }, [currentFolder, fileTypeFilter, sortBy, sortOrder]);

  // Computed: visible folders
  const visibleFolders = useMemo(() => {
    let folders = currentFolder?.subfolders || [];

    folders = [...folders].sort((a, b) =>
      sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    return folders;
  }, [currentFolder, sortOrder]);

  // Computed: totals
  const totalFiles = useMemo(() => {
    if (!project) return 0;
    return project.structure.totalFiles;
  }, [project]);

  const totalFolders = useMemo(() => {
    if (!project) return 0;
    return project.structure.totalFolders;
  }, [project]);

  // Computed: file type counts
  const fileTypeCounts = useMemo(() => {
    if (!project) return {};

    const counts: Record<string, number> = {};
    const countFiles = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        const ext = file.extension.toLowerCase() || 'other';
        counts[ext] = (counts[ext] || 0) + 1;
      }
      folder.subfolders.forEach(countFiles);
    };

    countFiles(project.rootFolder);
    return counts;
  }, [project]);

  return {
    project,
    currentFolder: currentFolder || null,
    selectedFile,
    expandedFolders,
    searchQuery,
    searchResults,
    viewMode,
    sortBy,
    sortOrder,
    fileTypeFilter,
    currentPath,
    breadcrumbs,
    setProject,
    navigateToFolder,
    navigateUp,
    navigateToPath,
    toggleFolder,
    expandAll,
    collapseAll,
    selectFile,
    setSearchQuery,
    performSearch,
    clearSearch,
    setViewMode,
    setSortBy,
    toggleSortOrder,
    setFileTypeFilter,
    getFileContent,
    getFileUrl,
    getFileIcon,
    visibleFiles,
    visibleFolders,
    totalFiles,
    totalFolders,
    fileTypeCounts,
  };
}

// Helper functions
function findFolderByPath(folder: ProjectFolder, path: string): ProjectFolder | null {
  if (folder.path === path) return folder;

  for (const subfolder of folder.subfolders) {
    const found = findFolderByPath(subfolder, path);
    if (found) return found;
  }

  return null;
}

export default useProjectExplorer;
