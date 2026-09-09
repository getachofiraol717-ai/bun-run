/**
 * Framework Detector
 * Specialized detection for web development frameworks
 */

import { ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface FrameworkInfo {
  name: string;
  type: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop';
  version?: string;
  confidence: number;
  keyFiles: string[];
  entryPoints: string[];
  configuration: Record<string, string>;
}

export class FrameworkDetector {
  private static instance: FrameworkDetector | null = null;

  private static readonly FRONTEND_FRAMEWORKS: Array<{
    name: string;
    patterns: RegExp[];
    configFiles: string[];
    entryPatterns: string[];
    type: FrameworkInfo['type'];
  }> = [
    {
      name: 'React',
      patterns: [/<[A-Z]\w+/, /useState|useEffect|useContext/, /import\s+.*\s+from\s+['"]react['"]/],
      configFiles: ['package.json', 'webpack.config.js', 'vite.config.ts', 'next.config.js'],
      entryPatterns: ['index.jsx', 'index.tsx', 'App.jsx', 'App.tsx', 'main.jsx', 'main.tsx'],
      type: 'frontend',
    },
    {
      name: 'Vue',
      patterns: [/createApp\(/, /<template>[\s\S]*<\/template>/, /<script setup>/, /ref\(|reactive\(/],
      configFiles: ['package.json', 'vite.config.ts', 'vue.config.js'],
      entryPatterns: ['main.js', 'main.ts', 'App.vue', 'index.html'],
      type: 'frontend',
    },
    {
      name: 'Angular',
      patterns: [/@Component\(/, /@NgModule\(/, /@Injectable\(/, /import\s+.*@angular/],
      configFiles: ['package.json', 'angular.json', 'tsconfig.json'],
      entryPatterns: ['main.ts', 'app.module.ts'],
      type: 'frontend',
    },
    {
      name: 'Svelte',
      patterns: [/<script>[\s\S]*<\/script>[\s\S]*<style>/, /export\s+let\s+\w+/, /import\s+.*from\s+['"]svelte['"]/],
      configFiles: ['package.json', 'svelte.config.js', 'vite.config.js'],
      entryPatterns: ['main.js', 'App.svelte'],
      type: 'frontend',
    },
    {
      name: 'Next.js',
      patterns: [/getServerSideProps|getStaticProps|getStaticPaths/, /pages\/|app\//],
      configFiles: ['package.json', 'next.config.js', 'next.config.ts'],
      entryPatterns: ['pages/_app.js', 'pages/_app.tsx', 'app/layout.tsx'],
      type: 'fullstack',
    },
    {
      name: 'Nuxt',
      patterns: [/defineNuxtConfig/, /useNuxtApp\(\)/, /pages\//, /composables\//],
      configFiles: ['package.json', 'nuxt.config.ts', 'nuxt.config.js'],
      entryPatterns: ['app.vue', 'pages/index.vue'],
      type: 'fullstack',
    },
  ];

  private static readonly BACKEND_FRAMEWORKS: Array<{
    name: string;
    patterns: RegExp[];
    configFiles: string[];
    entryPatterns: string[];
    type: FrameworkInfo['type'];
  }> = [
    {
      name: 'Express',
      patterns: [/express\(\)/, /app\.(get|post|put|delete|use)\(/, /require\(['"]express['"]\)/],
      configFiles: ['package.json'],
      entryPatterns: ['index.js', 'server.js', 'app.js', 'src/index.js', 'src/server.js'],
      type: 'backend',
    },
    {
      name: 'FastAPI',
      patterns: [/from\s+fastapi\s+import/, /@app\.(get|post|put|delete)\(/, /FastAPI\(\)/],
      configFiles: ['requirements.txt', 'pyproject.toml'],
      entryPatterns: ['main.py', 'app.py', 'server.py'],
      type: 'backend',
    },
    {
      name: 'Django',
      patterns: [/from\s+django/, /django\.conf\./, /manage\.py/],
      configFiles: ['manage.py', 'settings.py', 'requirements.txt'],
      entryPatterns: ['manage.py', 'urls.py', 'wsgi.py'],
      type: 'backend',
    },
    {
      name: 'Flask',
      patterns: [/from\s+flask\s+import/, /app\s*=\s*Flask\(/, /@app\.route\(/],
      configFiles: ['requirements.txt', 'pyproject.toml'],
      entryPatterns: ['app.py', 'main.py', 'run.py'],
      type: 'backend',
    },
    {
      name: 'NestJS',
      patterns: [/@Module\(/, /@Controller\(/, /@Injectable\(/, /import\s+.*@nestjs/],
      configFiles: ['package.json', 'nest-cli.json', 'tsconfig.json'],
      entryPatterns: ['main.ts', 'app.module.ts'],
      type: 'backend',
    },
    {
      name: 'Spring Boot',
      patterns: [/@SpringBootApplication/, /@RestController/, /@Service/, /@Repository/],
      configFiles: ['pom.xml', 'build.gradle', 'application.properties', 'application.yml'],
      entryPatterns: ['Application.java', 'Main.java', 'src/main/java'],
      type: 'backend',
    },
    {
      name: 'Rails',
      patterns: [/Rails\.application/, /ActiveRecord/, /application_controller/],
      configFiles: ['Gemfile', 'config/application.rb', 'config/routes.rb'],
      entryPatterns: ['config/routes.rb', 'app/controllers/application_controller.rb'],
      type: 'fullstack',
    },
  ];

  private static readonly MOBILE_FRAMEWORKS: Array<{
    name: string;
    patterns: RegExp[];
    configFiles: string[];
    entryPatterns: string[];
    type: FrameworkInfo['type'];
  }> = [
    {
      name: 'React Native',
      patterns: [/from\s+['"]react-native['"]/, /View\s*,?\s*Text/, /StyleSheet\.create/],
      configFiles: ['package.json', 'App.tsx', 'App.jsx'],
      entryPatterns: ['App.tsx', 'App.jsx', 'index.js'],
      type: 'mobile',
    },
    {
      name: 'Flutter',
      patterns: [/import\s+['"]package:flutter/, /StatelessWidget|StatefulWidget/, /Widget\s+build/],
      configFiles: ['pubspec.yaml', 'pubspec.lock'],
      entryPatterns: ['lib/main.dart', 'lib/app.dart'],
      type: 'mobile',
    },
    {
      name: 'Expo',
      patterns: [/from\s+['"]expo['"]/, /ExpoApp|registerRootComponent/],
      configFiles: ['package.json', 'app.json', 'app.config.js'],
      entryPatterns: ['App.tsx', 'App.jsx'],
      type: 'mobile',
    },
  ];

  private static readonly DESKTOP_FRAMEWORKS: Array<{
    name: string;
    patterns: RegExp[];
    configFiles: string[];
    entryPatterns: string[];
    type: FrameworkInfo['type'];
  }> = [
    {
      name: 'Electron',
      patterns: [/electron/, /BrowserWindow/, /app\.on\(['"]ready['"]/, /ipcMain|ipcRenderer/],
      configFiles: ['package.json', 'main.js', 'main.ts', 'preload.js'],
      entryPatterns: ['main.js', 'main.ts', 'index.js'],
      type: 'desktop',
    },
    {
      name: 'Tauri',
      patterns: [/tauri/, /invoke\(|emit\(/],
      configFiles: ['package.json', 'tauri.conf.json', 'Cargo.toml'],
      entryPatterns: ['src/main.rs', 'src-tauri/src/main.rs'],
      type: 'desktop',
    },
    {
      name: 'NW.js',
      patterns: [/nw\.js|nwjs/, /require\(['"]nw['"]\)/],
      configFiles: ['package.json', 'index.html'],
      entryPatterns: ['index.html', 'package.json'],
      type: 'desktop',
    },
  ];

  private constructor() {}

  static getInstance(): FrameworkDetector {
    if (!FrameworkDetector.instance) {
      FrameworkDetector.instance = new FrameworkDetector();
    }
    return FrameworkDetector.instance;
  }

  detect(files: ProjectFile[]): FrameworkInfo[] {
    const frameworks: FrameworkInfo[] = [];

    const allFrameworks = [
      ...FrameworkDetector.FRONTEND_FRAMEWORKS,
      ...FrameworkDetector.BACKEND_FRAMEWORKS,
      ...FrameworkDetector.MOBILE_FRAMEWORKS,
      ...FrameworkDetector.DESKTOP_FRAMEWORKS,
    ];

    for (const framework of allFrameworks) {
      const result = this.analyzeFramework(framework, files);
      if (result.confidence > 0.3) {
        frameworks.push(result);
      }
    }

    return frameworks.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeFramework(
    framework: (typeof FrameworkDetector.FRONTEND_FRAMEWORKS)[number],
    files: ProjectFile[]
  ): FrameworkInfo {
    let patternMatches = 0;
    let configMatches = 0;
    let entryMatches = 0;

    const configFiles: string[] = [];
    const entryPoints: string[] = [];

    // Check patterns in file content
    for (const file of files) {
      if (!file.content) continue;

      for (const pattern of framework.patterns) {
        if (pattern.test(file.content)) {
          patternMatches++;
          break;
        }
      }
    }

    // Check for config files
    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      if (framework.configFiles.some((cf) => lowerName === cf.toLowerCase())) {
        configMatches++;
        configFiles.push(file.name);
      }
    }

    // Check for entry points
    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      if (framework.entryPatterns.some((ep) => lowerName === ep.toLowerCase())) {
        entryMatches++;
        entryPoints.push(file.name);
      }
    }

    // Calculate confidence
    const confidence = Math.min(
      (patternMatches * 0.3 + configMatches * 0.4 + entryMatches * 0.3) /
        Math.max(framework.patterns.length, 1),
      1
    );

    // Extract version from package.json or config
    let version: string | undefined;
    for (const file of files) {
      if (file.name === 'package.json' && file.content) {
        try {
          const pkg = JSON.parse(file.content);
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };

          const versionKeys: Record<string, string[]> = {
            'React': ['react'],
            'Vue': ['vue'],
            'Angular': ['@angular/core'],
            'Next.js': ['next'],
            'Nuxt': ['nuxt'],
            'Express': ['express'],
            'FastAPI': ['fastapi'],
            'Django': ['django'],
            'Flask': ['flask'],
            'NestJS': ['@nestjs/core'],
            'Spring Boot': [],
            'React Native': ['react-native'],
            'Flutter': [],
            'Expo': ['expo'],
            'Electron': ['electron'],
            'Tauri': ['@tauri-apps/api'],
            'Svelte': ['svelte'],
          };

          const keys = versionKeys[framework.name] || [framework.name.toLowerCase()];
          for (const key of keys) {
            if (deps[key]) {
              version = deps[key];
              break;
            }
          }
        } catch {}
      }
    }

    return {
      name: framework.name,
      type: framework.type,
      version,
      confidence,
      keyFiles: configFiles,
      entryPoints,
      configuration: this.extractConfiguration(files, framework.name),
    };
  }

  private extractConfiguration(files: ProjectFile[], frameworkName: string): Record<string, string> {
    const config: Record<string, string> = {};

    const configFileMap: Record<string, string[]> = {
      'React': ['webpack.config.js', 'vite.config.ts', 'next.config.js'],
      'Vue': ['vite.config.ts', 'vue.config.js', 'nuxt.config.ts'],
      'Angular': ['angular.json', 'tsconfig.json'],
      'Next.js': ['next.config.js', 'next.config.ts'],
      'Nuxt': ['nuxt.config.ts', 'nuxt.config.js'],
      'Express': ['package.json'],
      'FastAPI': ['requirements.txt', 'pyproject.toml'],
      'Django': ['settings.py', 'requirements.txt'],
      'Flask': ['requirements.txt', 'pyproject.toml'],
      'NestJS': ['nest-cli.json', 'tsconfig.json'],
      'Electron': ['package.json'],
      'Tauri': ['tauri.conf.json', 'Cargo.toml'],
      'React Native': ['package.json', 'metro.config.js', 'app.json'],
      'Flutter': ['pubspec.yaml'],
    };

    const relevantFiles = configFileMap[frameworkName] || [];

    for (const file of files) {
      if (relevantFiles.some((rf) => file.name.toLowerCase() === rf.toLowerCase())) {
        if (file.name.endsWith('.json') && file.content) {
          try {
            const parsed = JSON.parse(file.content);
            config[file.name] = 'present';
          } catch {}
        } else {
          config[file.name] = 'present';
        }
      }
    }

    return config;
  }

  getFrameworkByName(name: string, files: ProjectFile[]): FrameworkInfo | null {
    const allFrameworks = [
      ...FrameworkDetector.FRONTEND_FRAMEWORKS,
      ...FrameworkDetector.BACKEND_FRAMEWORKS,
      ...FrameworkDetector.MOBILE_FRAMEWORKS,
      ...FrameworkDetector.DESKTOP_FRAMEWORKS,
    ];

    const framework = allFrameworks.find(
      (f) => f.name.toLowerCase() === name.toLowerCase()
    );

    if (!framework) return null;

    const result = this.analyzeFramework(framework, files);
    return result.confidence > 0.3 ? result : null;
  }

  detectMultipleFrameworks(files: ProjectFile[]): {
    frontend: FrameworkInfo[];
    backend: FrameworkInfo[];
    mobile: FrameworkInfo[];
    desktop: FrameworkInfo[];
  } {
    const result = {
      frontend: [] as FrameworkInfo[],
      backend: [] as FrameworkInfo[],
      mobile: [] as FrameworkInfo[],
      desktop: [] as FrameworkInfo[],
    };

    const detected = this.detect(files);

    for (const framework of detected) {
      switch (framework.type) {
        case 'frontend':
          result.frontend.push(framework);
          break;
        case 'backend':
          result.backend.push(framework);
          break;
        case 'fullstack':
          // Fullstack can be both frontend and backend
          result.frontend.push(framework);
          result.backend.push(framework);
          break;
        case 'mobile':
          result.mobile.push(framework);
          break;
        case 'desktop':
          result.desktop.push(framework);
          break;
      }
    }

    return result;
  }
}

export default FrameworkDetector.getInstance();
