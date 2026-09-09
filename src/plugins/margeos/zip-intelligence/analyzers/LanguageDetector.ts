// @ts-nocheck
/**
 * Language Detector
 * Detects and analyzes programming languages in projects
 */

import { ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface LanguageInfo {
  name: string;
  version?: string;
  files: number;
  lines: number;
  percentage: number;
  fileTypes: string[];
  features: LanguageFeature[];
}

export interface LanguageFeature {
  name: string;
  description: string;
  examples: string[];
}

export class LanguageDetector {
  private static instance: LanguageDetector | null = null;

  private static readonly LANGUAGE_DEFINITIONS: Array<{
    name: string;
    extensions: string[];
    patterns: RegExp[];
    features: string[];
    versionPatterns: Array<{ pattern: RegExp; name: string }>;
  }> = [
    {
      name: 'TypeScript',
      extensions: ['.ts', '.tsx'],
      patterns: [
        /:\s*(string|number|boolean|any|void|never|unknown)\b/,
        /interface\s+\w+/,
        /type\s+\w+\s*=/,
        /enum\s+\w+/,
        /<[A-Z]\w*,?\s*>/,
        /as\s+(string|number|boolean|any)/,
        /import\s+.*\s+from\s+['"].*['"]/,
        /export\s+(default\s+)?(class|function|const|interface|type)/,
      ],
      features: ['Static Typing', 'Interfaces', 'Type Aliases', 'Enums', 'Generics', 'Decorators'],
      versionPatterns: [
        { pattern: /tsconfig\.json.*"target":\s*"ES\d+"/, name: 'ES target version' },
      ],
    },
    {
      name: 'JavaScript',
      extensions: ['.js', '.jsx', '.mjs', '.cjs'],
      patterns: [
        /const\s+\w+\s*=/,
        /let\s+\w+\s*=/,
        /function\s+\w+\s*\(/,
        /=>\s*{/,
        /require\(['"]/,
        /module\.exports/,
        /async\s+(function|\()/,
        /await\s+/,
        /class\s+\w+\s*{/,
      ],
      features: ['ES6+ Features', 'Async/Await', 'Classes', 'Modules', 'Arrow Functions', 'Destructuring'],
      versionPatterns: [
        { pattern: /"engines":\s*{[^}]*"node":\s*"([^"]+)"/, name: 'Node.js engine' },
      ],
    },
    {
      name: 'Python',
      extensions: ['.py', '.pyw'],
      patterns: [
        /def\s+\w+\s*\(/,
        /class\s+\w+.*:/,
        /import\s+\w+/,
        /from\s+\w+\s+import/,
        /if\s+__name__\s*==\s*['"]__main__['"]/,
        /async\s+def/,
        /@\w+\s*\n/,
        /:\s*$/m,
        /print\s*\(/,
      ],
      features: ['Functions', 'Classes', 'Async', 'Decorators', 'List Comprehensions', 'Context Managers'],
      versionPatterns: [
        { pattern: /python_requires\s*=\s*['"]([^'"]+)['"]/, name: 'python_requires' },
        { pattern: /^python\s*==?\s*([\d.]+)/m, name: 'shebang' },
      ],
    },
    {
      name: 'Java',
      extensions: ['.java'],
      patterns: [
        /public\s+(class|interface|enum)\s+\w+/,
        /private\s+(static\s+)?(final\s+)?(\w+)/,
        /package\s+\w+;/,
        /import\s+java\./,
        /System\.out\.println/,
        /@Override/,
        /@Autowired/,
        /extends\s+\w+/,
        /implements\s+\w+/,
      ],
      features: ['OOP', 'Annotations', 'Generics', 'Streams', 'Lambdas', 'Interfaces'],
      versionPatterns: [
        { pattern: /<java\.version>([^<]+)<\/java\.version>/, name: 'maven java.version' },
        { pattern: /sourceCompatibility\s*=\s*JavaVersion\.VERSION_(\w+)/, name: 'gradle source' },
      ],
    },
    {
      name: 'C#',
      extensions: ['.cs', '.csx'],
      patterns: [
        /using\s+System/,
        /namespace\s+\w+/,
        /public\s+(class|interface|struct)\s+\w+/,
        /async\s+Task/,
        /await\s+/,
        /var\s+\w+\s*=/,
        /=>\s*.+/,
        /\{\s*get;\s*set;\s*\}/,
      ],
      features: ['LINQ', 'Async/Await', 'Properties', 'Generics', 'Namespaces', 'Delegates'],
      versionPatterns: [
        { pattern: /<TargetFramework>netcoreapp([^<]+)<\/TargetFramework>/, name: 'netcoreapp' },
        { pattern: /<LangVersion>([^<]+)<\/LangVersion>/, name: 'LangVersion' },
      ],
    },
    {
      name: 'Go',
      extensions: ['.go'],
      patterns: [
        /package\s+\w+/,
        /func\s+(\(\w+\s+\*?\w+\)\s+)?\w+\s*\(/,
        /import\s+\(/,
        /:=\s*/,
        /fmt\.Print/,
        /go\s+\w+/,
        /defer\s+/,
        /goroutine/,
        /chan\s+\w+/,
      ],
      features: ['Goroutines', 'Channels', 'Defer', 'Interfaces', 'Structs', 'Packages'],
      versionPatterns: [
        { pattern: /^go\s+(\d+\.\d+)/m, name: 'go directive' },
        { pattern: /go\s+(\d+\.\d+)/, name: 'go.mod' },
      ],
    },
    {
      name: 'Rust',
      extensions: ['.rs'],
      patterns: [
        /fn\s+\w+\s*\(/,
        /let\s+mut\s+/,
        /impl\s+\w+/,
        /pub\s+(fn|struct|enum|trait|mod)/,
        /->\s*\w+/,
        /::new\(/,
        /use\s+\w+::/,
        /impl\s+\w+\s+for\s+\w+/,
        /match\s+\w+\s*{/,
      ],
      features: ['Ownership', 'Borrowing', 'Lifetimes', 'Traits', 'Pattern Matching', 'Modules'],
      versionPatterns: [
        { pattern: /rust-version\s*=\s*"([^"]+)"/, name: 'rust-version' },
        { pattern: /edition\s*=\s*"(\w+)"/, name: 'edition' },
      ],
    },
    {
      name: 'Ruby',
      extensions: ['.rb', '.rake'],
      patterns: [
        /def\s+\w+/,
        /class\s+\w+\s*<|end/,
        /module\s+\w+/,
        /require\s+['"]/,
        /attr_accessor/,
        /do\s*\|/,
        /@\w+\s*=/,
        /puts\s+/,
      ],
      features: ['Blocks', 'Mixins', 'Symbols', 'Ranges', 'Gems', 'Metaprogramming'],
      versionPatterns: [
        { pattern: /ruby\s*['"]([^'"]+)['"]/, name: 'Gemfile ruby' },
        { pattern: /\.ruby-version/, name: '.ruby-version' },
      ],
    },
    {
      name: 'PHP',
      extensions: ['.php'],
      patterns: [
        /<\?php/,
        /namespace\s+\w+;/,
        /\$\w+\s*=/,
        /function\s+\w+\s*\(/,
        /class\s+\w+\s*(extends|implements)?/,
        /->\w+\(/,
        /use\s+\w+\\/,
        /public\s+(function|static)/,
      ],
      features: ['Classes', 'Namespaces', 'Traits', 'Interfaces', 'Closures', 'Composer'],
      versionPatterns: [
        { pattern: /php_require\s*=\s*['"]([^'"]+)['"]/, name: 'composer php_require' },
        { pattern: /^#!\/.*php(\d+\.\d+)/m, name: 'shebang' },
      ],
    },
    {
      name: 'Swift',
      extensions: ['.swift'],
      patterns: [
        /func\s+\w+\s*\(/,
        /var\s+\w+\s*:/,
        /let\s+\w+\s*[=:]/,
        /class\s+\w+\s*(:|{)/,
        /struct\s+\w+/,
        /enum\s+\w+/,
        /import\s+(Foundation|UIKit|SwiftUI)/,
        /guard\s+let/,
        /if\s+let/,
      ],
      features: ['Optionals', 'Protocols', 'Extensions', 'Closures', 'Generics', 'Async/Await'],
      versionPatterns: [
        { pattern: /swift_version\s*=\s*['"]([^'"]+)['"]/, name: 'swift_version' },
        { pattern: /platform\s+ios\s+'(\d+\.\d+)'/, name: 'platform ios' },
      ],
    },
    {
      name: 'Kotlin',
      extensions: ['.kt', '.kts'],
      patterns: [
        /fun\s+\w+\s*\(/,
        /val\s+\w+\s*[=:]/,
        /var\s+\w+\s*[=:]/,
        /data\s+class/,
        /object\s+\w+/,
        /companion\s+object/,
        /sealed\s+class/,
        /import\s+kotlin\./,
        /suspend\s+fun/,
      ],
      features: ['Null Safety', 'Data Classes', 'Coroutines', 'Extension Functions', 'Smart Casts', 'Sealed Classes'],
      versionPatterns: [
        { pattern: /kotlin\s*=\s*['"]([^'"]+)['"]/, name: 'kotlin version' },
        { pattern: /jvmTarget\s*=\s*['"]([^'"]+)['"]/, name: 'jvmTarget' },
      ],
    },
    {
      name: 'Dart',
      extensions: ['.dart'],
      patterns: [
        /void\s+main\s*\(/,
        /class\s+\w+\s*(extends|implements)?/,
        /final\s+\w+\s*=/,
        /var\s+\w+\s*=/,
        /Widget\s+build\(/,
        /@override/,
        /Future<\w+>/,
        /async\s*{/,
        /await\s+/,
      ],
      features: ['Null Safety', 'Async', 'Widgets', 'Streams', 'Mixins', 'Extensions'],
      versionPatterns: [
        { pattern: /sdk:\s*['"]([^'"]+)['"]/, name: 'sdk constraint' },
      ],
    },
    {
      name: 'HTML',
      extensions: ['.html', '.htm'],
      patterns: [
        /<!DOCTYPE\s+html/i,
        /<html/i,
        /<head>/i,
        /<body>/i,
        /<div>/i,
        /<script>/i,
        /<style>/i,
      ],
      features: ['Semantic HTML', 'Forms', 'Links', 'Media', 'Tables', 'Canvas'],
      versionPatterns: [
        { pattern: /<!DOCTYPE\s+html>\s*<!--\s*html\.([\d.]+)/i, name: 'DOCTYPE version' },
      ],
    },
    {
      name: 'CSS',
      extensions: ['.css'],
      patterns: [
        /[.#@]\w+\s*{/,
        /:\s*(hover|focus|active|before|after)/,
        /@media\s*\(/,
        /@keyframes\s+\w+/,
        /flex\s*:/,
        /grid\s*:/,
        /var\(--/,
      ],
      features: ['Flexbox', 'Grid', 'Variables', 'Animations', 'Media Queries', 'Pseudo-classes'],
      versionPatterns: [
        { pattern: /\*\s*css\s*version\s*:\s*([\d.]+)/i, name: 'CSS version comment' },
      ],
    },
    {
      name: 'SCSS',
      extensions: ['.scss', '.sass'],
      patterns: [
        /\$\w+\s*:/,
        /@mixin\s+\w+/,
        /@include\s+\w+/,
        /&\s*:\w+/,
        /@extend\s+/,
        /@if\s+/,
        /@for\s+/,
        /@each\s+/,
      ],
      features: ['Variables', 'Mixins', 'Nesting', 'Inheritance', 'Conditionals', 'Loops'],
      versionPatterns: [],
    },
    {
      name: 'SQL',
      extensions: ['.sql'],
      patterns: [
        /SELECT\s+/i,
        /INSERT\s+INTO/i,
        /UPDATE\s+\w+\s+SET/i,
        /DELETE\s+FROM/i,
        /CREATE\s+(TABLE|INDEX|VIEW)/i,
        /ALTER\s+TABLE/i,
        /JOIN\s+\w+\s+ON/i,
        /WHERE\s+/i,
      ],
      features: ['CRUD', 'Joins', 'Aggregations', 'Subqueries', 'Transactions', 'Indexes'],
      versionPatterns: [],
    },
    {
      name: 'Shell',
      extensions: ['.sh', '.bash', '.zsh'],
      patterns: [
        /^#!/,
        /\$\w+/,
        /\[\s+\w+\s+\]/,
        /if\s+\[\s+/,
        /for\s+\w+\s+in\s+/,
        /function\s+\w+/,
        /\|\s*(grep|awk|sed)/,
      ],
      features: ['Variables', 'Conditionals', 'Loops', 'Functions', 'Pipes', 'Redirection'],
      versionPatterns: [
        { pattern: /^#!\/bin\/(bash|sh|zsh)([\d.]+)/m, name: 'shebang' },
      ],
    },
  ];

  private constructor() {}

  static getInstance(): LanguageDetector {
    if (!LanguageDetector.instance) {
      LanguageDetector.instance = new LanguageDetector();
    }
    return LanguageDetector.instance;
  }

  detect(folder: ProjectFolder): LanguageInfo[] {
    const files = this.flattenFiles(folder);
    const languages: LanguageInfo[] = [];
    const languageStats: Record<string, { files: Set<string>; lines: number }> = {};

    // Initialize language stats
    for (const def of LanguageDetector.LANGUAGE_DEFINITIONS) {
      languageStats[def.name] = { files: new Set(), lines: 0 };
    }

    // Analyze each file
    for (const file of files) {
      const ext = file.extension.toLowerCase();

      for (const def of LanguageDetector.LANGUAGE_DEFINITIONS) {
        if (def.extensions.includes(ext)) {
          languageStats[def.name].files.add(file.path);
          if (file.content) {
            languageStats[def.name].lines += file.content.split('\n').length;
          }
          break;
        }
      }
    }

    // Calculate totals
    const totalFiles = files.length;
    const totalLines = files.reduce((sum, f) => sum + (f.content?.split('\n').length || 0), 0);

    // Build language info
    for (const [name, stats] of Object.entries(languageStats)) {
      if (stats.files.size === 0) continue;

      const def = LanguageDetector.LANGUAGE_DEFINITIONS.find((d) => d.name === name);
      if (!def) continue;

      const percentage = totalFiles > 0 ? (stats.files.size / totalFiles) * 100 : 0;
      const version = this.detectVersion(files, def.versionPatterns);

      const features: LanguageFeature[] = def.features.slice(0, 4).map((f) => ({
        name: f,
        description: this.getFeatureDescription(name, f),
        examples: this.getFeatureExamples(name, f, files),
      }));

      languages.push({
        name,
        version,
        files: stats.files.size,
        lines: stats.lines,
        percentage: Math.round(percentage * 100) / 100,
        fileTypes: def.extensions,
        features,
      });
    }

    return languages.sort((a, b) => b.percentage - a.percentage);
  }

  private flattenFiles(folder: ProjectFolder): ProjectFile[] {
    const files: ProjectFile[] = [...folder.files];

    for (const subfolder of folder.subfolders) {
      files.push(...this.flattenFiles(subfolder));
    }

    return files;
  }

  private detectVersion(
    files: ProjectFile[],
    versionPatterns: Array<{ pattern: RegExp; name: string }>
  ): string | undefined {
    for (const file of files) {
      if (!file.content) continue;

      for (const { pattern, name } of versionPatterns) {
        const match = file.content.match(pattern);
        if (match && match[1]) {
          return `${name}: ${match[1]}`;
        }
      }
    }

    return undefined;
  }

  private getFeatureDescription(language: string, feature: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      'TypeScript': {
        'Static Typing': 'TypeScript adds static typing to JavaScript, catching errors at compile time.',
        'Interfaces': 'Interfaces define contracts for objects, classes, and functions.',
        'Generics': 'Generics provide type parameters for reusable, type-safe components.',
      },
      'Python': {
        'Functions': 'Python functions are defined with the def keyword and support default arguments.',
        'Async': 'Python supports asynchronous programming with async/await syntax.',
        'Decorators': 'Decorators modify function behavior using @syntax.',
      },
      'JavaScript': {
        'ES6+ Features': 'Modern JavaScript includes arrow functions, destructuring, spread operators.',
        'Async/Await': 'Asynchronous programming with cleaner syntax than callbacks.',
        'Classes': 'ES6 classes provide a cleaner syntax for object-oriented programming.',
      },
      'Rust': {
        'Ownership': 'Rust uses ownership to manage memory without garbage collection.',
        'Borrowing': 'References let you use values without taking ownership.',
        'Lifetimes': 'Lifetimes ensure references are valid for the required duration.',
      },
    };

    return descriptions[language]?.[feature] || `${feature} is a ${language} feature.`;
  }

  private getFeatureExamples(language: string, feature: string, files: ProjectFile[]): string[] {
    const examples: string[] = [];

    // Search for feature examples in code
    const searchPatterns: Record<string, RegExp[]> = {
      'TypeScript': {
        'Interfaces': [/interface\s+\w+\s*{/, /:\s*(string|number|boolean)\b/],
        'Generics': [/<T>/, /:\s*Array<\w+>/],
      },
      'Python': {
        'Functions': [/def\s+\w+\s*\(/],
        'Async': [/async\s+def/, /await\s+/],
      },
      'JavaScript': {
        'ES6+ Features': [/=>/, /\.\.\.\w+/],
        'Async/Await': [/async\s+(function|\()/, /await\s+/],
      },
      'Rust': {
        'Ownership': [/let\s+mut/, /let\s+\w+\s*=\s*\w+::/],
        'Borrowing': [/&(mut\s+)?\w+/, /fn\s+\w+\([^)]*&/],
      },
    };

    const patterns = searchPatterns[language]?.[feature];
    if (patterns) {
      for (const file of files.slice(0, 10)) {
        if (!file.content) continue;

        for (const pattern of patterns) {
          const match = file.content.match(pattern);
          if (match) {
            // Extract surrounding context
            const index = file.content.indexOf(match[0]);
            const start = Math.max(0, index - 20);
            const end = Math.min(file.content.length, index + match[0].length + 40);
            examples.push(file.content.slice(start, end).trim());
            break;
          }
        }

        if (examples.length >= 2) break;
      }
    }

    return examples;
  }

  getLanguageDetails(name: string, folder: ProjectFolder): LanguageInfo | null {
    const languages = this.detect(folder);
    return languages.find((l) => l.name.toLowerCase() === name.toLowerCase()) || null;
  }
}

export default LanguageDetector.getInstance();
