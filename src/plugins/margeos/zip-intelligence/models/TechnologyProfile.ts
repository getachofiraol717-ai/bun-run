/**
 * Technology Profile Model
 * Detected technologies and their analysis
 */

export interface TechnologyProfile {
  id: string;
  projectId: string;
  createdAt: Date;
  languages: LanguageProfile[];
  frameworks: FrameworkProfile[];
  libraries: LibraryProfile[];
  tools: ToolProfile[];
  databases?: DatabaseProfile[];
  apis?: ApiProfile[];
  infrastructure?: InfrastructureProfile[];
  overallComplexity: ComplexityLevel;
  techStack: TechStackSummary;
  compatibility: CompatibilityInfo;
  recommendations: TechRecommendation[];
}

export interface LanguageProfile {
  name: string;
  version?: string;
  files: number;
  lines: number;
  percentage: number;
  mainUsages: string[];
  features: string[];
  ecosystem?: string;
}

export interface FrameworkProfile {
  name: string;
  version?: string;
  category: FrameworkCategory;
  detected: boolean;
  confidence: number;
  purpose: string;
  mainFiles: string[];
  configuration: ConfigFile[];
  keyFeatures: string[];
}

export type FrameworkCategory =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mobile'
  | 'desktop'
  | 'data'
  | 'ml'
  | 'testing'
  | 'build'
  | 'other';

export interface LibraryProfile {
  name: string;
  version?: string;
  category: string;
  purpose: string;
  usage: string;
  files: string[];
  size?: number;
}

export interface ToolProfile {
  name: string;
  category: ToolCategory;
  purpose: string;
  configuration?: string;
  commands?: string[];
}

export type ToolCategory =
  | 'linter'
  | 'formatter'
  | 'bundler'
  | 'compiler'
  | 'task-runner'
  | 'package-manager'
  | 'version-control'
  | 'testing'
  | 'documentation'
  | 'deployment'
  | 'ci-cd'
  | 'other';

export interface DatabaseProfile {
  name: string;
  type: 'sql' | 'nosql' | 'graph' | 'key-value' | 'search' | 'cache' | 'other';
  orm?: string;
  connectionConfig?: string;
  models?: string[];
}

export interface ApiProfile {
  type: 'rest' | 'graphql' | 'grpc' | 'websocket' | 'webhook' | 'other';
  endpoints?: number;
  authentication?: string;
  documentation?: string;
  framework?: string;
}

export interface InfrastructureProfile {
  type: 'cloud' | 'container' | 'serverless' | 'on-premise' | 'hybrid';
  providers?: string[];
  services?: string[];
  configuration?: string;
}

export interface ConfigFile {
  name: string;
  path: string;
  type: string;
  parsed?: boolean;
}

export interface TechStackSummary {
  primary: string;
  secondary: string[];
  modern: boolean;
  trends: string[];
  age: 'legacy' | 'mature' | 'modern' | 'cutting-edge';
  diversity: number; // 0-100, how varied the tech stack is
}

export interface CompatibilityInfo {
  browserSupport?: BrowserSupport;
  nodeVersion?: string;
  osSupport?: string[];
  mobileSupport?: MobileSupport;
  notes: string[];
}

export interface BrowserSupport {
  chrome: boolean;
  firefox: boolean;
  safari: boolean;
  edge: boolean;
  ie11?: boolean;
}

export interface MobileSupport {
  ios: boolean;
  android: boolean;
  responsive: boolean;
}

export interface TechRecommendation {
  id: string;
  type: 'adoption' | 'upgrade' | 'replacement' | 'best-practice';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  currentTech?: string;
  recommendedTech?: string;
  reason: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  risks?: string[];
}

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'enterprise';

// Technology detection patterns
export interface TechPattern {
  pattern: RegExp | string;
  type: 'file' | 'content' | 'package' | 'config';
  tech: string;
  category: FrameworkCategory | ToolCategory;
  versionExtractor?: RegExp;
  confidence: number;
}

export const TECHNOLOGY_PATTERNS: TechPattern[] = [
  // Frontend Frameworks
  { pattern: /react/i, type: 'package', tech: 'React', category: 'frontend', versionExtractor: /react["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /vue/i, type: 'package', tech: 'Vue.js', category: 'frontend', versionExtractor: /vue["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /angular/i, type: 'package', tech: 'Angular', category: 'frontend', versionExtractor: /@angular\/core["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /next\.js/i, type: 'package', tech: 'Next.js', category: 'frontend', versionExtractor: /next["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /nuxt/i, type: 'package', tech: 'Nuxt.js', category: 'frontend', versionExtractor: /nuxt["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /svelte/i, type: 'package', tech: 'Svelte', category: 'frontend', confidence: 0.9 },

  // Backend Frameworks
  { pattern: /express/i, type: 'package', tech: 'Express', category: 'backend', versionExtractor: /express["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /fastapi/i, type: 'package', tech: 'FastAPI', category: 'backend', versionExtractor: /fastapi["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /flask/i, type: 'package', tech: 'Flask', category: 'backend', versionExtractor: /flask["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 0.95 },
  { pattern: /django/i, type: 'package', tech: 'Django', category: 'backend', versionExtractor: /django["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /rails/i, type: 'package', tech: 'Ruby on Rails', category: 'backend', versionExtractor: /rails["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /spring/i, type: 'package', tech: 'Spring Boot', category: 'backend', versionExtractor: /spring-boot["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /koa/i, type: 'package', tech: 'Koa', category: 'backend', confidence: 0.9 },
  { pattern: /hapi/i, type: 'package', tech: 'Hapi', category: 'backend', confidence: 0.9 },
  { pattern: /nestjs/i, type: 'package', tech: 'NestJS', category: 'backend', confidence: 0.95 },

  // Build Tools
  { pattern: /webpack/i, type: 'package', tech: 'Webpack', category: 'bundler', versionExtractor: /webpack["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /vite/i, type: 'package', tech: 'Vite', category: 'bundler', versionExtractor: /vite["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /esbuild/i, type: 'package', tech: 'esbuild', category: 'bundler', confidence: 0.9 },
  { pattern: /rollup/i, type: 'package', tech: 'Rollup', category: 'bundler', versionExtractor: /rollup["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },

  // Testing
  { pattern: /jest/i, type: 'package', tech: 'Jest', category: 'testing', versionExtractor: /jest["']?\s*[:=]\s*["']?(\d+\.\d+)/, confidence: 1.0 },
  { pattern: /cypress/i, type: 'package', tech: 'Cypress', category: 'testing', confidence: 1.0 },
  { pattern: /mocha/i, type: 'package', tech: 'Mocha', category: 'testing', confidence: 0.95 },
  { pattern: /pytest/i, type: 'package', tech: 'pytest', category: 'testing', confidence: 0.95 },
  { pattern: /junit/i, type: 'package', tech: 'JUnit', category: 'testing', confidence: 0.95 },

  // Linters & Formatters
  { pattern: /eslint/i, type: 'package', tech: 'ESLint', category: 'linter', confidence: 1.0 },
  { pattern: /prettier/i, type: 'package', tech: 'Prettier', category: 'formatter', confidence: 1.0 },
  { pattern: /pylint/i, type: 'package', tech: 'Pylint', category: 'linter', confidence: 0.95 },
  { pattern: /black/i, type: 'package', tech: 'Black', category: 'formatter', confidence: 0.95 },

  // CSS Frameworks
  { pattern: /tailwindcss|tailwind/i, type: 'package', tech: 'Tailwind CSS', category: 'frontend', confidence: 1.0 },
  { pattern: /bootstrap/i, type: 'package', tech: 'Bootstrap', category: 'frontend', confidence: 0.95 },
  { pattern: /material-ui|@mui/i, type: 'package', tech: 'Material-UI', category: 'frontend', confidence: 1.0 },
  { pattern: /antd/i, type: 'package', tech: 'Ant Design', category: 'frontend', confidence: 1.0 },

  // State Management
  { pattern: /redux/i, type: 'package', tech: 'Redux', category: 'frontend', confidence: 1.0 },
  { pattern: /zustand/i, type: 'package', tech: 'Zustand', category: 'frontend', confidence: 0.95 },
  { pattern: /mobx/i, type: 'package', tech: 'MobX', category: 'frontend', confidence: 0.95 },
  { pattern: /vuex/i, type: 'package', tech: 'Vuex', category: 'frontend', confidence: 1.0 },
  { pattern: /pinia/i, type: 'package', tech: 'Pinia', category: 'frontend', confidence: 0.95 },

  // Databases
  { pattern: /mongoose/i, type: 'package', tech: 'MongoDB (Mongoose)', category: 'frontend', confidence: 1.0 },
  { pattern: /sequelize/i, type: 'package', tech: 'Sequelize', category: 'frontend', confidence: 1.0 },
  { pattern: /typeorm/i, type: 'package', tech: 'TypeORM', category: 'frontend', confidence: 1.0 },
  { pattern: /prisma/i, type: 'package', tech: 'Prisma', category: 'frontend', confidence: 1.0 },

  // Package Managers
  { pattern: 'package.json', type: 'file', tech: 'npm', category: 'package-manager', confidence: 1.0 },
  { pattern: 'yarn.lock', type: 'file', tech: 'Yarn', category: 'package-manager', confidence: 1.0 },
  { pattern: 'pnpm-lock.yaml', type: 'file', tech: 'pnpm', category: 'package-manager', confidence: 1.0 },
  { pattern: 'Pipfile', type: 'file', tech: 'Pipenv', category: 'package-manager', confidence: 1.0 },
  { pattern: 'requirements.txt', type: 'file', tech: 'pip', category: 'package-manager', confidence: 0.9 },
  { pattern: 'go.mod', type: 'file', tech: 'Go modules', category: 'package-manager', confidence: 1.0 },
  { pattern: 'Cargo.toml', type: 'file', tech: 'Cargo', category: 'package-manager', confidence: 1.0 },
];

// Helper functions
export function createTechnologyProfile(
  id: string,
  projectId: string
): TechnologyProfile {
  return {
    id,
    projectId,
    createdAt: new Date(),
    languages: [],
    frameworks: [],
    libraries: [],
    tools: [],
    overallComplexity: 'moderate',
    techStack: {
      primary: '',
      secondary: [],
      modern: true,
      trends: [],
      age: 'modern',
      diversity: 0,
    },
    compatibility: {
      notes: [],
    },
    recommendations: [],
  };
}

export function detectLanguage(fileExtension: string): string | null {
  const languageMap: Record<string, string> = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (JSX)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (TSX)',
    '.py': 'Python',
    '.java': 'Java',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
    '.cpp': 'C++',
    '.c': 'C',
    '.cs': 'C#',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
    '.r': 'R',
    '.lua': 'Lua',
    '.pl': 'Perl',
    '.sh': 'Shell',
    '.sql': 'SQL',
    '.html': 'HTML',
    '.css': 'SCSS',
    '.scss': 'SCSS',
    '.less': 'Less',
  };

  return languageMap[fileExtension.toLowerCase()] || null;
}

export function getFrameworkCategory(framework: string): FrameworkCategory {
  const categories: Record<string, FrameworkCategory> = {
    React: 'frontend',
    'Vue.js': 'frontend',
    Angular: 'frontend',
    'Next.js': 'fullstack',
    'Nuxt.js': 'fullstack',
    Svelte: 'frontend',
    Express: 'backend',
    FastAPI: 'backend',
    Flask: 'backend',
    Django: 'backend',
    'Ruby on Rails': 'fullstack',
    'Spring Boot': 'backend',
    NestJS: 'backend',
    Koa: 'backend',
  };

  return categories[framework] || 'other';
}

export default {
  createTechnologyProfile,
  detectLanguage,
  getFrameworkCategory,
  TECHNOLOGY_PATTERNS,
};
