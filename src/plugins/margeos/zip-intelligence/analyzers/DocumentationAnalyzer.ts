/**
 * Documentation Analyzer
 * Analyzes and evaluates project documentation
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface DocumentationAnalysis {
  score: number;
  hasReadme: boolean;
  hasContributing: boolean;
  hasLicense: boolean;
  hasChangelog: boolean;
  coverage: DocumentationCoverage;
  quality: DocumentationQuality;
  missing: string[];
  recommendations: string[];
}

export interface DocumentationCoverage {
  readmeScore: number;
  inlineDocumentation: number;
  apiDocumentation: number;
  examples: number;
  overall: number;
}

export interface DocumentationQuality {
  clarity: number;
  completeness: number;
  accuracy: number;
  maintenance: number;
}

export class DocumentationAnalyzer {
  private static instance: DocumentationAnalyzer | null = null;

  private static readonly README_SECTIONS = [
    'description',
    'installation',
    'usage',
    'features',
    'license',
    'contributing',
    'api',
    'examples',
  ];

  private constructor() {}

  static getInstance(): DocumentationAnalyzer {
    if (!DocumentationAnalyzer.instance) {
      DocumentationAnalyzer.instance = new DocumentationAnalyzer();
    }
    return DocumentationAnalyzer.instance;
  }

  analyze(project: Project): DocumentationAnalysis {
    const files = this.flattenFiles(project.rootFolder);

    const hasReadme = this.fileExists(files, ['README.md', 'README.txt', 'README']);
    const hasContributing = this.fileExists(files, ['CONTRIBUTING.md', 'CONTRIBUTING.txt']);
    const hasLicense = this.fileExists(files, ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING']);
    const hasChangelog = this.fileExists(files, ['CHANGELOG.md', 'CHANGELOG', 'HISTORY.md']);

    const coverage = this.analyzeCoverage(project, files, hasReadme);
    const quality = this.analyzeQuality(project, files);
    const missing = this.findMissingDocumentation(hasReadme, hasContributing, hasLicense, hasChangelog);
    const recommendations = this.generateRecommendations(coverage, quality, missing);
    const score = this.calculateScore(coverage, quality, hasReadme);

    return {
      score,
      hasReadme,
      hasContributing,
      hasLicense,
      hasChangelog,
      coverage,
      quality,
      missing,
      recommendations,
    };
  }

  private flattenFiles(folder: ProjectFolder): ProjectFile[] {
    const files: ProjectFile[] = [...folder.files];

    for (const subfolder of folder.subfolders) {
      files.push(...this.flattenFiles(subfolder));
    }

    return files;
  }

  private fileExists(files: ProjectFile[], names: string[]): boolean {
    return files.some((f) => names.includes(f.name));
  }

  private findFile(files: ProjectFile[], names: string[]): ProjectFile | null {
    return files.find((f) => names.includes(f.name)) || null;
  }

  private analyzeCoverage(
    project: Project,
    files: ProjectFile[],
    hasReadme: boolean
  ): DocumentationCoverage {
    // README coverage
    let readmeScore = 0;
    const readme = this.findFile(files, ['README.md', 'README.txt', 'README']);

    if (readme && readme.content) {
      const content = readme.content.toLowerCase();
      let sectionsFound = 0;

      for (const section of DocumentationAnalyzer.README_SECTIONS) {
        if (content.includes(section)) {
          sectionsFound++;
        }
      }

      readmeScore = Math.round((sectionsFound / DocumentationAnalyzer.README_SECTIONS.length) * 100);
    }

    // Inline documentation coverage
    let inlineScore = 0;
    const codeFiles = files.filter((f) => this.isCodeFile(f.extension) && f.content);
    let documentedFiles = 0;

    for (const file of codeFiles) {
      if (file.content) {
        // Check for JSDoc, docstrings, comments
        const hasDocumentation =
          /(\/\*\*[\s\S]*?\*\/|\/\/#{1,3}.*|"""[\s\S]*?"""|'''[\s\S]*?''')/.test(file.content) ||
          /@param|@returns|@example|@deprecated/.test(file.content);

        if (hasDocumentation) {
          documentedFiles++;
        }
      }
    }

    inlineScore = codeFiles.length > 0
      ? Math.round((documentedFiles / codeFiles.length) * 100)
      : 0;

    // API documentation
    let apiScore = 0;
    const apiDocFiles = files.filter((f) =>
      f.name.includes('api') ||
      f.name.includes('types') ||
      f.name.includes('interfaces') ||
      f.extension === '.d.ts'
    );

    if (apiDocFiles.length > 0) {
      apiScore = Math.min(100, apiDocFiles.length * 20);
    }

    // Examples
    let examplesScore = 0;
    const exampleFiles = files.filter((f) =>
      f.name.includes('example') ||
      f.name.includes('demo') ||
      f.name.includes('sample')
    );

    if (exampleFiles.length > 0) {
      examplesScore = Math.min(100, exampleFiles.length * 25);
    }

    const overall = Math.round(
      (readmeScore * 0.3) +
      (inlineScore * 0.3) +
      (apiScore * 0.2) +
      (examplesScore * 0.2)
    );

    return {
      readmeScore,
      inlineDocumentation: inlineScore,
      apiDocumentation: apiScore,
      examples: examplesScore,
      overall,
    };
  }

  private isCodeFile(ext: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.go', '.rs'];
    return codeExtensions.includes(ext.toLowerCase());
  }

  private analyzeQuality(project: Project, files: ProjectFile[]): DocumentationQuality {
    let clarity = 50;
    let completeness = 50;
    let accuracy = 80;
    let maintenance = 50;

    // Check README for quality indicators
    const readme = this.findFile(files, ['README.md', 'README.txt', 'README']);

    if (readme && readme.content) {
      const content = readme.content;
      const lines = content.split('\n');

      // Check for code blocks (indicates better examples)
      const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
      if (codeBlocks > 3) clarity += 20;
      else if (codeBlocks > 0) clarity += 10;

      // Check for badges (indicates maintenance effort)
      if (/!\[[\w\]]\]\(/.test(content)) maintenance += 20;

      // Check for links (indicates thoroughness)
      const links = (content.match(/\[.+\]\(.+\)/g) || []).length;
      if (links > 5) completeness += 20;

      // Check for headers structure
      const headers = (content.match(/^#{1,3}\s+/gm) || []).length;
      if (headers >= 5) completeness += 10;
    }

    // Cap scores
    clarity = Math.min(100, clarity);
    completeness = Math.min(100, completeness);
    accuracy = Math.min(100, accuracy);
    maintenance = Math.min(100, maintenance);

    return {
      clarity: Math.round(clarity),
      completeness: Math.round(completeness),
      accuracy: Math.round(accuracy),
      maintenance: Math.round(maintenance),
    };
  }

  private findMissingDocumentation(
    hasReadme: boolean,
    hasContributing: boolean,
    hasLicense: boolean,
    hasChangelog: boolean
  ): string[] {
    const missing: string[] = [];

    if (!hasReadme) {
      missing.push('README.md - Project overview and getting started guide');
    }

    if (!hasContributing) {
      missing.push('CONTRIBUTING.md - Guidelines for contributing');
    }

    if (!hasLicense) {
      missing.push('LICENSE - Legal information about code usage');
    }

    if (!hasChangelog) {
      missing.push('CHANGELOG.md - Version history and updates');
    }

    return missing;
  }

  private generateRecommendations(
    coverage: DocumentationCoverage,
    quality: DocumentationQuality,
    missing: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Missing file recommendations
    if (missing.length > 0) {
      recommendations.push(
        `Add missing documentation files: ${missing.map((m) => m.split(' - ')[0]).join(', ')}`
      );
    }

    // Coverage recommendations
    if (coverage.readmeScore < 50) {
      recommendations.push(
        'Improve README with more sections (installation, usage, examples, API docs)'
      );
    }

    if (coverage.inlineDocumentation < 30) {
      recommendations.push(
        'Add inline documentation to code - aim for at least 30% coverage'
      );
    }

    if (coverage.apiDocumentation < 50) {
      recommendations.push(
        'Create dedicated API documentation or type definitions'
      );
    }

    if (coverage.examples < 30) {
      recommendations.push(
        'Add code examples demonstrating key features'
      );
    }

    // Quality recommendations
    if (quality.clarity < 70) {
      recommendations.push(
        'Include more code examples and clear explanations in documentation'
      );
    }

    if (quality.maintenance < 60) {
      recommendations.push(
        'Add badges and status indicators to show project health'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Documentation looks good! Continue maintaining and updating it regularly.'
      );
    }

    return recommendations;
  }

  private calculateScore(
    coverage: DocumentationCoverage,
    quality: DocumentationQuality,
    hasReadme: boolean
  ): number {
    if (!hasReadme) return 20;

    const coverageWeight = 0.5;
    const qualityWeight = 0.5;

    const coverageScore = coverage.overall;
    const qualityScore = Math.round(
      (quality.clarity + quality.completeness + quality.accuracy + quality.maintenance) / 4
    );

    return Math.round(coverageScore * coverageWeight + qualityScore * qualityWeight);
  }

  generateDocumentationTemplate(project: Project): string {
    const template = [
      `# ${project.name}`,
      '',
      project.description || 'A software project.',
      '',
      '## Table of Contents',
      '',
      '- [Installation](#installation)',
      '- [Usage](#usage)',
      '- [API](#api)',
      '- [Contributing](#contributing)',
      '- [License](#license)',
      '',
      '## Installation',
      '',
      '```bash',
      'npm install',
      '```',
      '',
      '## Usage',
      '',
      '```javascript',
      `import ${project.name.split(/[-_]/)[0]} from '${project.name}';`,
      '',
      '// Your code here',
      '```',
      '',
      '## API',
      '',
      '### functionName(params)',
      '',
      'Description of the function.',
      '',
      '**Parameters:**',
      '- `param1` (string): Description',
      '',
      '**Returns:** (void)',
      '',
      '## Contributing',
      '',
      '1. Fork the repository',
      '2. Create a feature branch',
      '3. Make your changes',
      '4. Submit a pull request',
      '',
      '## License',
      '',
      'ISC',
    ];

    return template.join('\n');
  }

  getDocumentationReport(analysis: DocumentationAnalysis): string {
    const lines: string[] = [];

    lines.push('# Documentation Analysis Report\n');
    lines.push(`**Overall Score:** ${analysis.score}/100\n`);

    lines.push('## Presence\n');
    lines.push(`- README.md: ${analysis.hasReadme ? '✅' : '❌'}`);
    lines.push(`- CONTRIBUTING.md: ${analysis.hasContributing ? '✅' : '❌'}`);
    lines.push(`- LICENSE: ${analysis.hasLicense ? '✅' : '❌'}`);
    lines.push(`- CHANGELOG.md: ${analysis.hasChangelog ? '✅' : '❌'}\n`);

    lines.push('## Coverage\n');
    lines.push(`- README: ${analysis.coverage.readmeScore}%`);
    lines.push(`- Inline Documentation: ${analysis.coverage.inlineDocumentation}%`);
    lines.push(`- API Documentation: ${analysis.coverage.apiDocumentation}%`);
    lines.push(`- Examples: ${analysis.coverage.examples}%\n`);

    lines.push('## Quality\n');
    lines.push(`- Clarity: ${analysis.quality.clarity}/100`);
    lines.push(`- Completeness: ${analysis.quality.completeness}/100`);
    lines.push(`- Accuracy: ${analysis.quality.accuracy}/100`);
    lines.push(`- Maintenance: ${analysis.quality.maintenance}/100\n`);

    if (analysis.missing.length > 0) {
      lines.push('## Missing Documentation\n');
      for (const item of analysis.missing) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    lines.push('## Recommendations\n');
    for (const rec of analysis.recommendations) {
      lines.push(`- ${rec}`);
    }

    return lines.join('\n');
  }
}

export default DocumentationAnalyzer.getInstance();
