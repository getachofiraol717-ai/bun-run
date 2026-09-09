// @ts-nocheck
/**
 * Technology Detector
 * Detects programming languages, frameworks, and tools used in projects
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';
import { TechnologyProfile, LanguageProfile, FrameworkProfile, LibraryProfile } from '../models/TechnologyProfile';

export interface TechnologyDetectionResult {
  profile: TechnologyProfile;
  confidence: number;
  detectedFeatures: string[];
  recommendations: string[];
}

export interface TechnologyPattern {
  name: string;
  patterns: RegExp[];
  filePatterns: string[];
  indicators: string[];
}

export class TechnologyDetector {
  private static instance: TechnologyDetector | null = null;

  private static readonly LANGUAGE_PATTERNS: TechnologyPattern[] = [
    {
      name: 'TypeScript',
      patterns: [/\.tsx?$/, /interface\s+\w+/, /type\s+\w+\s*=/, /:\s*(string|number|boolean|any)\b/],
      filePatterns: ['.ts', '.tsx'],
      indicators: ['tsconfig.json', 'typescript'],
    },
    {
      name: 'JavaScript',
      patterns: [/\.jsx?$/, /const\s+\w+\s*=/, /function\s+\w+\s*\(/, /=>\s*{/],
      filePatterns: ['.js', '.jsx', '.mjs', '.cjs'],
      indicators: ['package.json', 'javascript'],
    },
    {
      name: 'Python',
      patterns: [/\.py$/, /def\s+\w+\s*\(/, /class\s+\w+.*:/, /import\s+\w+/, /from\s+\w+\s+import/],
      filePatterns: ['.py', '.pyw'],
      indicators: ['requirements.txt', 'setup.py', 'pyproject.toml', 'python'],
    },
    {
      name: 'Java',
      patterns: [/\.java$/, /public\s+(class|interface|enum)\s+\w+/, /package\s+\w+;/],
      filePatterns: ['.java'],
      indicators: ['pom.xml', 'build.gradle', 'java'],
    },
    {
      name: 'C#',
      patterns: [/\.cs$/, /using\s+System/, /namespace\s+\w+/, /public\s+class\s+\w+/],
      filePatterns: ['.cs', '.csx'],
      indicators: ['.csproj', '*.sln', 'dotnet'],
    },
    {
      name: 'Go',
      patterns: [/\.go$/, /package\s+\w+/, /func\s+\w+\s*\(/, /import\s+\(/],
      filePatterns: ['.go'],
      indicators: ['go.mod', 'go.sum', 'golang'],
    },
    {
      name: 'Rust',
      patterns: [/\.rs$/, /fn\s+\w+\s*\(/, /let\s+mut\s+/, /impl\s+\w+/],
      filePatterns: ['.rs'],
      indicators: ['Cargo.toml', 'Cargo.lock', 'rust'],
    },
    {
      name: 'Ruby',
      patterns: [/\.rb$/, /def\s+\w+/, /class\s+\w+/, /require\s+['"]/],
      filePatterns: ['.rb'],
      indicators: ['Gemfile', 'Rakefile', 'ruby'],
    },
    {
      name: 'PHP',
      patterns: [/\.php$/, /<\?php/, /namespace\s+\w+;/, /\$\w+\s*=/],
      filePatterns: ['.php'],
      indicators: ['composer.json', 'php'],
    },
    {
      name: 'Swift',
      patterns: [/\.swift$/, /func\s+\w+\s*\(/, /var\s+\w+\s*:/, /import\s+\w+/],
      filePatterns: ['.swift'],
      indicators: ['Package.swift', 'swift'],
    },
    {
      name: 'Kotlin',
      patterns: [/\.kt$/, /fun\s+\w+\s*\(/, /val\s+\w+\s*[=:]/, /data\s+class/],
      filePatterns: ['.kt', '.kts'],
      indicators: ['build.gradle.kts', 'kotlin'],
    },
  ];

  private static readonly FRAMEWORK_PATTERNS: TechnologyPattern[] = [
    {
      name: 'React',
      patterns: [/import\s+.*\s+from\s+['"]react['"]/, /<[A-Z]\w+/, /useState|useEffect|useContext/],
      filePatterns: ['.jsx', '.tsx'],
      indicators: ['react', 'react-dom', 'create-react-app', 'next.js'],
    },
    {
      name: 'Vue',
      patterns: [/import\s+.*\s+from\s+['"]vue['"]/, /<template>/, /<script setup>/],
      filePatterns: ['.vue', '.jsx'],
      indicators: ['vue', 'nuxt', 'vue-cli'],
    },
    {
      name: 'Angular',
      patterns: [/import\s+.*\s+from\s+['"]@angular/, /@Component/, /@Injectable/, /NgModule/],
      filePatterns: ['.ts'],
      indicators: ['@angular/core', 'angular.json'],
    },
    {
      name: 'Next.js',
      patterns: [/getServerSideProps|getStaticProps|getInitialProps/, /pages\/|app\//],
      filePatterns: ['.js', '.jsx', '.ts', '.tsx'],
      indicators: ['next.config', 'next.js'],
    },
    {
      name: 'Express',
      patterns: [/express\(\)/, /app\.(get|post|put|delete)/, /router\.(get|post)/],
      filePatterns: ['.js', '.ts'],
      indicators: ['express'],
    },
    {
      name: 'FastAPI',
      patterns: [/from\s+fastapi\s+import/, /@app\./, /FastAPI\(\)/],
      filePatterns: ['.py'],
      indicators: ['fastapi', 'uvicorn'],
    },
    {
      name: 'Django',
      patterns: [/from\s+django/, /from\s+rest_framework/, /manage\.py/],
      filePatterns: ['.py'],
      indicators: ['django', 'settings.py'],
    },
    {
      name: 'Flask',
      patterns: [/from\s+flask\s+import/, /app\s*=\s*Flask/, /@app\.route/],
      filePatterns: ['.py'],
      indicators: ['flask'],
    },
    {
      name: 'Spring Boot',
      patterns: [/@SpringBootApplication/, /@RestController/, /@Service/],
      filePatterns: ['.java'],
      indicators: ['spring-boot', 'spring-web'],
    },
    {
      name: 'Electron',
      patterns: [/electron/, /BrowserWindow/, /ipcMain|ipcRenderer/],
      filePatterns: ['.js', '.ts'],
      indicators: ['electron'],
    },
    {
      name: 'React Native',
      patterns: [/from\s+['"]react-native['"]/, /View\s*,?\s*Text/, /StyleSheet/],
      filePatterns: ['.js', '.jsx', '.ts', '.tsx'],
      indicators: ['react-native'],
    },
    {
      name: 'Flutter',
      patterns: [/import\s+['"]package:flutter/, /StatelessWidget|StatefulWidget/, /Widget\s+build/],
      filePatterns: ['.dart'],
      indicators: ['pubspec.yaml', 'flutter'],
    },
  ];

  private static readonly LIBRARY_PATTERNS: TechnologyPattern[] = [
    { name: 'Axios', patterns: [/axios/, /axios\.get|axios\.post/], filePatterns: [], indicators: ['axios'] },
    { name: 'Fetch API', patterns: [/fetch\(/, /Request|Response/], filePatterns: [], indicators: [] },
    { name: 'Lodash', patterns: [/_\.\w+/, /import\s+_\s+from\s+['"]lodash['"]/], filePatterns: [], indicators: ['lodash'] },
    { name: 'Moment.js', patterns: [/moment\(/, /import\s+moment/], filePatterns: [], indicators: ['moment'] },
    { name: 'Day.js', patterns: [/dayjs\(/, /import\s+dayjs/], filePatterns: [], indicators: ['dayjs'] },
    { name: 'Tailwind CSS', patterns: [/tailwindcss/, /className=.*\s+\w+-\d+/], filePatterns: [], indicators: ['tailwindcss', 'tailwind.config'] },
    { name: 'Bootstrap', patterns: [/bootstrap/, /class=.*\b(container|row|col|btn)\b/], filePatterns: [], indicators: ['bootstrap'] },
    { name: 'Redux', patterns: [/redux/, /createStore|,provider|,connect/], filePatterns: [], indicators: ['redux', '@reduxjs'] },
    { name: 'Zustand', patterns: [/zustand/, /create\(\(/], filePatterns: [], indicators: ['zustand'] },
    { name: 'Prisma', patterns: [/prisma/, /@prisma\/client/], filePatterns: [], indicators: ['prisma'] },
    { name: 'Mongoose', patterns: [/mongoose/, /new\s+Schema/, /@Schema/], filePatterns: [], indicators: ['mongoose'] },
    { name: 'Jest', patterns: [/jest/, /describe\(|it\(|test\(/], filePatterns: [], indicators: ['jest'] },
    { name: 'Mocha', patterns: [/mocha/, /describe\(|it\(/], filePatterns: [], indicators: ['mocha'] },
    { name: 'Cypress', patterns: [/cy\./, /cypress/], filePatterns: [], indicators: ['cypress'] },
    { name: 'Webpack', patterns: [/webpack/, /webpack\.config/], filePatterns: [], indicators: ['webpack'] },
    { name: 'Vite', patterns: [/vite/, /\.vite\.config/], filePatterns: [], indicators: ['vite.config'] },
  ];

  private constructor() {}

  static getInstance(): TechnologyDetector {
    if (!TechnologyDetector.instance) {
      TechnologyDetector.instance = new TechnologyDetector();
    }
    return TechnologyDetector.instance;
  }

  detect(project: Project): TechnologyDetectionResult {
    const files = this.flattenFiles(project.rootFolder);
    const languageProfiles = this.detectLanguages(files);
    const frameworkProfiles = this.detectFrameworks(files, languageProfiles);
    const libraryProfiles = this.detectLibraries(files);
    const features = this.detectFeatures(files);
    const complexity = this.calculateComplexity(languageProfiles, frameworkProfiles);

    const profile: TechnologyProfile = {
      languages: languageProfiles,
      frameworks: frameworkProfiles,
      libraries: libraryProfiles,
      buildTools: this.detectBuildTools(files),
      overallComplexity: complexity,
      detectedFeatures: features,
    };

    return {
      profile,
      confidence: this.calculateConfidence(profile),
      detectedFeatures: features,
      recommendations: this.generateRecommendations(profile),
    };
  }

  private flattenFiles(folder: ProjectFolder): ProjectFile[] {
    const files: ProjectFile[] = [...folder.files];

    for (const subfolder of folder.subfolders) {
      files.push(...this.flattenFiles(subfolder));
    }

    return files;
  }

  private detectLanguages(files: ProjectFile[]): LanguageProfile[] {
    const languageCounts: Record<string, { count: number; lines: number }> = {};
    const contentByLanguage: Record<string, string> = {};

    for (const file of files) {
      const language = this.getLanguageFromExtension(file.extension);
      if (!language) continue;

      if (!languageCounts[language]) {
        languageCounts[language] = { count: 0, lines: 0 };
        contentByLanguage[language] = '';
      }

      languageCounts[language].count++;
      if (file.content) {
        languageCounts[language].lines += file.content.split('\n').length;
        contentByLanguage[language] += file.content;
      }
    }

    const totalFiles = Object.values(languageCounts).reduce((sum, l) => sum + l.count, 0);

    return Object.entries(languageCounts)
      .map(([name, data]) => {
        const percentage = totalFiles > 0 ? (data.count / totalFiles) * 100 : 0;
        const version = this.detectLanguageVersion(contentByLanguage[name], name);

        return {
          name,
          files: data.count,
          percentage,
          version,
          linesOfCode: data.lines,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }

  private getLanguageFromExtension(ext: string): string | null {
    const extensionMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.mjs': 'JavaScript',
      '.cjs': 'JavaScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cs': 'C#',
      '.go': 'Go',
      '.rs': 'Rust',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.dart': 'Dart',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.less': 'Less',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.md': 'Markdown',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bash': 'Bash',
    };

    return extensionMap[ext.toLowerCase()] || null;
  }

  private detectLanguageVersion(content: string, language: string): string | undefined {
    // TypeScript
    if (language === 'TypeScript' && content.includes('interface ')) {
      return '4.x+';
    }

    // Python
    if (language === 'Python') {
      if (content.includes('type') && content.includes(':')) return '3.x (type hints)';
      if (content.includes('async def')) return '3.5+';
      return '3.x';
    }

    // JavaScript
    if (language === 'JavaScript') {
      if (content.includes('async') && content.includes('await')) return 'ES2017+';
      if (content.includes('=>')) return 'ES6+';
      return 'ES5+';
    }

    return undefined;
  }

  private detectFrameworks(files: ProjectFile[], languages: LanguageProfile[]): FrameworkProfile[] {
    const frameworks: FrameworkProfile[] = [];

    for (const pattern of TechnologyDetector.FRAMEWORK_PATTERNS) {
      let matches = 0;

      for (const file of files) {
        if (!file.content) continue;

        // Check file patterns
        const ext = file.extension.toLowerCase();
        if (pattern.filePatterns.some((fp) => fp === ext)) {
          // Check content patterns
          for (const regex of pattern.patterns) {
            if (regex.test(file.content)) {
              matches++;
              break;
            }
          }
        }
      }

      if (matches > 0) {
        const purpose = this.getFrameworkPurpose(pattern.name);
        frameworks.push({
          name: pattern.name,
          version: this.detectFrameworkVersion(files, pattern.name),
          purpose,
          confidence: Math.min(matches / 3, 1),
          files: matches,
        });
      }
    }

    return frameworks.sort((a, b) => b.confidence - a.confidence);
  }

  private getFrameworkPurpose(name: string): string {
    const purposes: Record<string, string> = {
      'React': 'UI library for building component-based interfaces',
      'Vue': 'Progressive JavaScript framework for building UIs',
      'Angular': 'Platform for building mobile and desktop web applications',
      'Next.js': 'React framework for server-side rendering and static site generation',
      'Express': 'Minimal and flexible Node.js web application framework',
      'FastAPI': 'Modern, fast web framework for building APIs with Python',
      'Django': 'High-level Python web framework for rapid development',
      'Flask': 'Lightweight WSGI web application framework for Python',
      'Spring Boot': 'Java framework for creating stand-alone, production-grade applications',
      'Electron': 'Framework for building cross-platform desktop applications',
      'React Native': 'Framework for building native mobile apps with React',
      'Flutter': 'Google UI toolkit for building natively compiled applications',
    };

    return purposes[name] || 'Web development framework';
  }

  private detectFrameworkVersion(files: ProjectFile[], name: string): string | undefined {
    for (const file of files) {
      if (file.name === 'package.json' && file.content) {
        try {
          const pkg = JSON.parse(file.content);
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };

          const versionMap: Record<string, string> = {
            'react': deps['react'],
            'vue': deps['vue'],
            '@angular/core': deps['@angular/core'],
            'next': deps['next'],
            'express': deps['express'],
          };

          if (versionMap[name] || versionMap[name.toLowerCase()]) {
            return versionMap[name] || versionMap[name.toLowerCase()];
          }
        } catch {}
      }
    }

    return undefined;
  }

  private detectLibraries(files: ProjectFile[]): LibraryProfile[] {
    const libraries: LibraryProfile[] = [];

    for (const pattern of TechnologyDetector.LIBRARY_PATTERNS) {
      let matches = 0;

      for (const file of files) {
        if (!file.content) continue;

        for (const regex of pattern.patterns) {
          if (regex.test(file.content)) {
            matches++;
            break;
          }
        }
      }

      if (matches > 0) {
        libraries.push({
          name: pattern.name,
          category: this.getLibraryCategory(pattern.name),
          purpose: this.getLibraryPurpose(pattern.name),
          usageCount: matches,
        });
      }
    }

    return libraries.sort((a, b) => b.usageCount - a.usageCount);
  }

  private getLibraryCategory(name: string): string {
    const categories: Record<string, string> = {
      'Axios': 'HTTP Client',
      'Fetch API': 'HTTP Client',
      'Lodash': 'Utility',
      'Moment.js': 'Date/Time',
      'Day.js': 'Date/Time',
      'Tailwind CSS': 'CSS Framework',
      'Bootstrap': 'CSS Framework',
      'Redux': 'State Management',
      'Zustand': 'State Management',
      'Prisma': 'ORM',
      'Mongoose': 'ORM',
      'Jest': 'Testing',
      'Mocha': 'Testing',
      'Cypress': 'Testing',
      'Webpack': 'Bundler',
      'Vite': 'Bundler',
    };

    return categories[name] || 'Library';
  }

  private getLibraryPurpose(name: string): string {
    const purposes: Record<string, string> = {
      'Axios': 'HTTP client for making HTTP requests',
      'Fetch API': 'Native browser API for network requests',
      'Lodash': 'Utility functions for common programming tasks',
      'Moment.js': 'Date parsing, validation, and manipulation',
      'Day.js': 'Immutable date library alternative to Moment.js',
      'Tailwind CSS': 'Utility-first CSS framework',
      'Bootstrap': 'CSS framework for responsive design',
      'Redux': 'State management library for JavaScript apps',
      'Zustand': 'Lightweight state management solution',
      'Prisma': 'Next-generation ORM for Node.js and TypeScript',
      'Mongoose': 'MongoDB object modeling for Node.js',
      'Jest': 'JavaScript testing framework',
      'Mocha': 'Feature-rich JavaScript test framework',
      'Cypress': 'End-to-end testing framework',
      'Webpack': 'Module bundler for JavaScript applications',
      'Vite': 'Next-generation frontend tooling',
    };

    return purposes[name] || 'Software library';
  }

  private detectBuildTools(files: ProjectFile[]): string[] {
    const tools: string[] = [];

    for (const file of files) {
      if (file.name === 'package.json') tools.push('npm/yarn/pnpm');
      if (file.name === 'tsconfig.json') tools.push('TypeScript Compiler');
      if (file.name === 'webpack.config.js' || file.name === 'webpack.config.ts') tools.push('Webpack');
      if (file.name.includes('vite.config')) tools.push('Vite');
      if (file.name === 'babel.config.js') tools.push('Babel');
      if (file.name === 'jest.config.js') tools.push('Jest');
      if (file.name === 'pyproject.toml' || file.name === 'setup.py') tools.push('Python Package Manager');
      if (file.name === 'pom.xml') tools.push('Maven');
      if (file.name === 'build.gradle') tools.push('Gradle');
      if (file.name === 'Cargo.toml') tools.push('Cargo');
      if (file.name === 'go.mod') tools.push('Go Modules');
    }

    return [...new Set(tools)];
  }

  private detectFeatures(files: ProjectFile[]): string[] {
    const features: string[] = [];

    const featureChecks: Array<{ feature: string; check: (f: ProjectFile) => boolean }> = [
      { feature: 'Authentication', check: (f) => /auth|login|password|token|jwt|oauth/i.test(f.name + f.content) },
      { feature: 'API/REST', check: (f) => /api|rest|endpoint|route|controller/i.test(f.name + f.content) },
      { feature: 'Database', check: (f) => /database|db|sql|mongo|prisma|sequelize|query/i.test(f.name + f.content) },
      { feature: 'Testing', check: (f) => /test|spec|jest|mocha|cypress|testing/i.test(f.name + f.content) },
      { feature: 'UI Components', check: (f) => /component|button|card|modal|form|input/i.test(f.name + f.content) },
      { feature: 'State Management', check: (f) => /redux|zustand|store|context|state/i.test(f.name + f.content) },
      { feature: 'Styling', check: (f) => /css|style|theme|color|tailwind|bootstrap/i.test(f.name + f.content) },
      { feature: 'Internationalization', check: (f) => /i18n|locale|translate|intl|translation/i.test(f.name + f.content) },
      { feature: 'Form Handling', check: (f) => /form|input|validation|schema|yup|zod/i.test(f.name + f.content) },
      { feature: 'File Upload', check: (f) => /upload|file|multipart|storage|s3/i.test(f.name + f.content) },
      { feature: 'Real-time', check: (f) => /websocket|socket|realtime|stream/i.test(f.name + f.content) },
      { feature: 'Caching', check: (f) => /cache|redis|memcached|localStorage/i.test(f.name + f.content) },
    ];

    for (const { feature, check } of featureChecks) {
      if (files.some(check)) {
        features.push(feature);
      }
    }

    return features;
  }

  private calculateComplexity(languages: LanguageProfile[], frameworks: FrameworkProfile[]): 'simple' | 'moderate' | 'complex' | 'enterprise' {
    const totalLangs = languages.length;
    const totalFrameworks = frameworks.length;
    const hasBackend = frameworks.some((f) =>
      ['Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot'].includes(f.name)
    );
    const hasFrontend = frameworks.some((f) =>
      ['React', 'Vue', 'Angular', 'Next.js', 'React Native'].includes(f.name)
    );

    if (totalLangs >= 3 && totalFrameworks >= 3) {
      return 'enterprise';
    }

    if (totalFrameworks >= 2 || (hasBackend && hasFrontend)) {
      return 'complex';
    }

    if (totalFrameworks >= 1 || totalLangs >= 2) {
      return 'moderate';
    }

    return 'simple';
  }

  private calculateConfidence(profile: TechnologyProfile): number {
    let confidence = 0.5;

    // Increase confidence based on clear indicators
    if (profile.languages.length > 0) confidence += 0.2;
    if (profile.frameworks.length > 0) confidence += 0.2;
    if (profile.buildTools.length > 0) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  private generateRecommendations(profile: TechnologyProfile): string[] {
    const recommendations: string[] = [];

    const hasTypeScript = profile.languages.some((l) => l.name === 'TypeScript');
    const hasJavaScript = profile.languages.some((l) => l.name === 'JavaScript');

    if (hasJavaScript && !hasTypeScript) {
      recommendations.push(
        'Consider migrating to TypeScript for better type safety and developer experience.'
      );
    }

    const hasReact = profile.frameworks.some((f) => f.name === 'React');
    if (hasReact && !profile.libraries.some((l) => l.name === 'Redux' || l.name === 'Zustand')) {
      recommendations.push(
        'Consider adding a state management solution like Redux Toolkit or Zustand.'
      );
    }

    if (!profile.libraries.some((l) => l.category === 'Testing')) {
      recommendations.push(
        'No testing library detected. Consider adding Jest, Mocha, or Cypress for testing.'
      );
    }

    return recommendations;
  }
}

export default TechnologyDetector.getInstance();
