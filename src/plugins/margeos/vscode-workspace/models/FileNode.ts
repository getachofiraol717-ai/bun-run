// @ts-nocheck
/**
 * FileNode.ts
 *
 * Model for FileNode representing files and directories in the explorer.
 */

export type FileNodeType = 'file' | 'directory' | 'symlink';

export interface FileNodeMetadata {
  language?: string;
  encoding?: string;
  mimeType?: string;
  size?: number;
  lineCount?: number;
  lastModified?: string;
  created?: string;
  author?: string;
}

export interface FileNodePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
}

export interface FileNode {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  path: string;
  relativePath: string;
  type: FileNodeType;
  extension?: string;
  content?: string;
  metadata: FileNodeMetadata;
  permissions: FileNodePermissions;
  isHidden: boolean;
  isSystem: boolean;
  children?: FileNode[];
  childCount: number;
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileNodeTree {
  rootNodes: FileNode[];
  totalNodes: number;
  totalFiles: number;
  totalDirectories: number;
}

/**
 * Factory functions
 */

export function getDefaultMetadata(): FileNodeMetadata {
  return {
    encoding: 'utf-8',
    created: new Date().toISOString()
  };
}

export function getDefaultPermissions(): FileNodePermissions {
  return {
    readable: true,
    writable: true,
    executable: false
  };
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    txt: 'plaintext',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    gitignore: 'gitignore',
    env: 'dotenv',
    svg: 'svg',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    webp: 'image',
    ico: 'image',
    mp4: 'video',
    webm: 'video',
    mp3: 'audio',
    wav: 'audio',
    pdf: 'pdf',
    zip: 'archive',
    tar: 'archive',
    gz: 'archive',
    rar: 'archive',
    '7z': 'archive'
  };

  return languageMap[extension] || 'plaintext';
}

export function createFileNode(
  projectId: string,
  name: string,
  path: string,
  parentId: string | null = null,
  type: FileNodeType = 'file',
  content: string = ''
): FileNode {
  const extension = getFileExtension(name);
  const relativePath = parentId ? `${parentId}/${name}` : name;

  return {
    id: `FN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    projectId,
    parentId,
    name,
    path,
    relativePath,
    type,
    extension: extension || undefined,
    content: type === 'file' ? content : undefined,
    metadata: {
      ...getDefaultMetadata(),
      language: type === 'file' ? getLanguageFromExtension(extension) : undefined,
      created: new Date().toISOString()
    },
    permissions: getDefaultPermissions(),
    isHidden: name.startsWith('.') || name.startsWith('_'),
    isSystem: ['node_modules', '.git', 'dist', 'build', '__pycache__'].includes(name),
    childCount: 0,
    depth: parentId ? 1 : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createDirectory(
  projectId: string,
  name: string,
  path: string,
  parentId: string | null = null
): FileNode {
  const node = createFileNode(projectId, name, path, parentId, 'directory');
  node.metadata.executable = true;
  return node;
}

export function isHiddenFile(name: string): boolean {
  return name.startsWith('.');
}

export function isSystemDirectory(name: string): boolean {
  const systemDirs = [
    'node_modules', '.git', '.svn', '.hg',
    'dist', 'build', 'out', 'target', 'bin',
    '__pycache__', '.pytest_cache', '.next',
    '.nuxt', '.cache', '.parcel-cache',
    'vendor', 'bower_components', 'jspm_packages'
  ];
  return systemDirs.includes(name);
}

export function updateFileContent(file: FileNode, content: string): FileNode {
  file.content = content;
  file.metadata.lineCount = content.split('\n').length;
  file.metadata.size = new Blob([content]).size;
  file.updatedAt = new Date().toISOString();
  return file;
}

export function renameFileNode(file: FileNode, newName: string): FileNode {
  const oldPath = file.path;
  file.name = newName;
  file.path = oldPath.replace(/[^/]+$/, newName);
  file.extension = getFileExtension(newName);
  file.metadata.language = getLanguageFromExtension(file.extension || '');
  file.updatedAt = new Date().toISOString();
  return file;
}

export function moveFileNode(file: FileNode, newParentId: string | null, newPath: string): FileNode {
  file.parentId = newParentId;
  file.path = newPath;
  file.relativePath = newParentId ? `${newParentId}/${file.name}` : file.name;
  file.depth = newParentId ? 1 : 0;
  file.updatedAt = new Date().toISOString();
  return file;
}

export function toggleHidden(file: FileNode): FileNode {
  file.isHidden = !file.isHidden;
  file.updatedAt = new Date().toISOString();
  return file;
}

export function getFileIcon(file: FileNode): string {
  if (file.type === 'directory') {
    return file.isSystem ? 'folder-package' : 'folder';
  }

  const iconMap: Record<string, string> = {
    javascript: 'file-code',
    typescript: 'file-code',
    javascriptreact: 'file-code',
    typescriptreact: 'file-code',
    python: 'file-code',
    html: 'file-code',
    css: 'file-code',
    json: 'file-json',
    yaml: 'file-code',
    markdown: 'file-text',
    gitignore: 'file-diff',
    shell: 'terminal',
    image: 'file-image',
    pdf: 'file-text',
    audio: 'file-media',
    video: 'file-media',
    zip: 'file-archive',
    svg: 'file-media'
  };

  return iconMap[file.metadata.language || ''] || 'file';
}

export function sortFileNodes(nodes: FileNode[], foldersFirst: boolean = true): FileNode[] {
  return [...nodes].sort((a, b) => {
    // Folders first
    if (foldersFirst) {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
    }

    // Hidden files last
    if (a.isHidden && !b.isHidden) return 1;
    if (!a.isHidden && b.isHidden) return -1;

    // System directories last
    if (a.isSystem && !b.isSystem) return 1;
    if (!a.isSystem && b.isSystem) return -1;

    // Alphabetical
    return a.name.localeCompare(b.name);
  });
}

export function buildFileTree(nodes: FileNode[]): FileNodeTree {
  const rootNodes = nodes.filter(n => n.parentId === null);
  const totalFiles = nodes.filter(n => n.type === 'file').length;
  const totalDirectories = nodes.filter(n => n.type === 'directory').length;

  // Build tree structure
  const buildChildren = (parentNodes: FileNode[]): FileNode[] => {
    return parentNodes.map(node => {
      const children = nodes.filter(n => n.parentId === node.id);
      return {
        ...node,
        children: buildChildren(children),
        childCount: children.length
      };
    });
  };

  return {
    rootNodes: buildChildren(rootNodes),
    totalNodes: nodes.length,
    totalFiles,
    totalDirectories
  };
}
