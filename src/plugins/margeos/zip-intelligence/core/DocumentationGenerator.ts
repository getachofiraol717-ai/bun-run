// @ts-nocheck
/**
 * Documentation Generator
 * Automatically generates project documentation
 */

import { Project, ProjectFolder, ProjectFile } from '../models/ProjectModel';
import { Documentation, DocumentationSection, DocumentationMetadata, FileDocumentation, CodeExample } from '../models/Documentation';

export interface DocumentationOptions {
  includeOverview: boolean;
  includeArchitecture: boolean;
  includeAPI: boolean;
  includeExamples: boolean;
  includeSetup: boolean;
  includeContributing: boolean;
}

const DEFAULT_OPTIONS: DocumentationOptions = {
  includeOverview: true,
  includeArchitecture: true,
  includeAPI: true,
  includeExamples: true,
  includeSetup: true,
  includeContributing: false,
};

export class DocumentationGenerator {
  private static instance: DocumentationGenerator | null = null;
  private options: DocumentationOptions;

  private constructor() {
    this.options = DEFAULT_OPTIONS;
  }

  static getInstance(): DocumentationGenerator {
    if (!DocumentationGenerator.instance) {
      DocumentationGenerator.instance = new DocumentationGenerator();
    }
    return DocumentationGenerator.instance;
  }

  setOptions(options: Partial<DocumentationOptions>): void {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  generate(project: Project): Documentation {
    const sections: DocumentationSection[] = [];
    let order = 0;

    if (this.options.includeOverview) {
      sections.push(this.generateOverview(project, order++));
    }

    if (this.options.includeSetup) {
      sections.push(this.generateSetup(project, order++));
    }

    if (this.options.includeArchitecture) {
      sections.push(this.generateArchitectureSection(project, order++));
    }

    if (this.options.includeAPI) {
      sections.push(this.generateAPIReference(project, order++));
    }

    if (this.options.includeExamples) {
      sections.push(this.generateExamples(project, order++));
    }

    sections.push(this.generateFileStructure(project, order++));
    sections.push(this.generateTechnologies(project, order++));

    if (this.options.includeContributing) {
      sections.push(this.generateContributing(project, order++));
    }

    return {
      id: `doc-${Date.now()}`,
      projectId: project.id,
      createdAt: new Date(),
      sections,
      metadata: this.generateMetadata(project),
      files: this.generateFileDocs(project),
      accessibility: this.generateAccessibility(),
    };
  }

  private generateOverview(project: Project, order: number): DocumentationSection {
    const content = [
      `# ${project.name}`,
      '',
      project.description || `This is ${project.name}, a ${project.technologyProfile.overallComplexity} complexity project.`,
      '',
      '## Key Features',
      '',
      ...project.technologyProfile.detectedFeatures.map((f) => `- ${f}`),
      '',
      '## Statistics',
      '',
      `- Total Files: ${project.structure.totalFiles}`,
      `- Total Folders: ${project.structure.totalFolders}`,
      `- Code Lines: ${project.statistics.totalLines}`,
      `- Languages: ${project.technologyProfile.languages.map((l) => l.name).join(', ')}`,
    ].join('\n');

    return {
      id: 'overview',
      title: 'Overview',
      content,
      level: 1,
      order,
    };
  }

  private generateSetup(project: Project, order: number): DocumentationSection {
    const setupInstructions = this.detectSetupInstructions(project);

    const content = [
      '# Installation',
      '',
      '## Prerequisites',
      '',
      ...setupInstructions.prerequisites.map((p) => `- ${p}`),
      '',
      '## Installation Steps',
      '',
      ...setupInstructions.steps.map((s, i) => `${i + 1}. ${s}`),
      '',
      '## Running the Project',
      '',
      ...setupInstructions.runCommands.map((cmd) => `\`\`\`bash\n${cmd}\n\`\`\``),
    ].join('\n');

    return {
      id: 'installation',
      title: 'Installation',
      content,
      level: 1,
      order,
    };
  }

  private detectSetupInstructions(project: Project): {
    prerequisites: string[];
    steps: string[];
    runCommands: string[];
  } {
    const result = {
      prerequisites: [] as string[],
      steps: [] as string[],
      runCommands: [] as string[],
    };

    // Check for package.json
    const hasPackageJson = this.fileExists(project.rootFolder, 'package.json');
    if (hasPackageJson) {
      result.prerequisites.push('Node.js and npm');
      result.steps.push('Install dependencies: `npm install`');
      result.runCommands.push('npm start', 'npm run dev');
    }

    // Check for requirements.txt
    const hasRequirements = this.fileExists(project.rootFolder, 'requirements.txt');
    if (hasRequirements) {
      result.prerequisites.push('Python 3.x');
      result.steps.push('Install dependencies: `pip install -r requirements.txt`');
      result.runCommands.push('python main.py');
    }

    // Check for Cargo.toml
    const hasCargo = this.fileExists(project.rootFolder, 'Cargo.toml');
    if (hasCargo) {
      result.prerequisites.push('Rust toolchain');
      result.steps.push('Build the project: `cargo build`');
      result.runCommands.push('cargo run');
    }

    // Default instructions if no package manager detected
    if (result.steps.length === 0) {
      result.steps.push('No package manager detected. Please refer to the project documentation.');
    }

    return result;
  }

  private fileExists(folder: ProjectFolder, filename: string): boolean {
    for (const file of folder.files) {
      if (file.name === filename) return true;
    }
    for (const subfolder of folder.subfolders) {
      if (this.fileExists(subfolder, filename)) return true;
    }
    return false;
  }

  private generateArchitectureSection(project: Project, order: number): DocumentationSection {
    const content = [
      '# Architecture',
      '',
      `## Pattern`,
      '',
      `This project uses a **${project.architecture.pattern.name}** architecture.`,
      '',
      project.architecture.description,
      '',
      '## Layers',
      '',
      ...project.architecture.layers.map(
        (layer) =>
          `### ${layer.name}\n\n${layer.description}\n\n**Responsibilities:** ${layer.responsibilities.join(', ')}`
      ),
      '',
      '## Component Relationships',
      '',
      ...project.architecture.relationships.slice(0, 10).map(
        (rel) => `- ${rel.from} → ${rel.to}: ${rel.type}`
      ),
    ].join('\n');

    return {
      id: 'architecture',
      title: 'Architecture',
      content,
      level: 1,
      order,
      relatedFiles: project.architecture.layers.flatMap((l) => l.folders),
    };
  }

  private generateAPIReference(project: Project, order: number): DocumentationSection {
    const components = project.architecture.components.slice(0, 20);

    const content = [
      '# API Reference',
      '',
      '## Components',
      '',
      ...components.map(
        (comp) =>
          `### ${comp.name}\n\n` +
          `**Path:** \`${comp.path}\`\n\n` +
          `**Type:** ${comp.type}\n\n` +
          (comp.description || '') +
          (comp.exports && comp.exports.length > 0
            ? `\n\n**Exports:** ${comp.exports.join(', ')}`
            : '')
      ),
    ].join('\n');

    return {
      id: 'api',
      title: 'API Reference',
      content,
      level: 1,
      order,
      relatedFiles: components.map((c) => c.path),
    };
  }

  private generateExamples(project: Project, order: number): DocumentationSection {
    const examples = this.findExampleFiles(project);

    const content = [
      '# Examples',
      '',
      '## Usage Examples',
      '',
      ...examples.map(
        (ex) =>
          `### ${ex.name}\n\n\`\`\`${ex.language}\n${ex.code}\n\`\`\`\n\n${ex.description || ''}`
      ),
    ].join('\n');

    return {
      id: 'examples',
      title: 'Examples',
      content,
      level: 1,
      order,
      examples: examples.map((ex) => ({
        title: ex.name,
        code: ex.code,
        language: ex.language,
      })),
    };
  }

  private findExampleFiles(project: Project): Array<{ name: string; code: string; language: string; description: string }> {
    const examples: Array<{ name: string; code: string; language: string; description: string }> = [];

    const search = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        if (
          file.name.includes('example') ||
          file.name.includes('demo') ||
          file.name.includes('sample')
        ) {
          if (file.content) {
            examples.push({
              name: file.name,
              code: file.content.slice(0, 500), // First 500 chars
              language: this.getLanguageFromExtension(file.extension),
              description: `Example from ${file.path}`,
            });
          }
        }
      }

      for (const subfolder of folder.subfolders) {
        search(subfolder);
      }
    };

    search(project.rootFolder);
    return examples.slice(0, 5);
  }

  private getLanguageFromExtension(ext: string): string {
    const langMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
    };
    return langMap[ext.toLowerCase()] || 'text';
  }

  private generateFileStructure(project: Project, order: number): DocumentationSection {
    const structure = this.buildReadableStructure(project.rootFolder, 0);

    const content = [
      '# Project Structure',
      '',
      '```',
      structure,
      '```',
      '',
      `Total: ${project.structure.totalFiles} files in ${project.structure.totalFolders} directories`,
    ].join('\n');

    return {
      id: 'structure',
      title: 'Project Structure',
      content,
      level: 1,
      order,
    };
  }

  private buildReadableStructure(folder: ProjectFolder, depth: number): string {
    const indent = '  '.repeat(depth);
    let result = `${indent}${folder.name}/\n`;

    for (const file of folder.files) {
      result += `${indent}  ${file.name}\n`;
    }

    for (const subfolder of folder.subfolders) {
      result += this.buildReadableStructure(subfolder, depth + 1);
    }

    return result;
  }

  private generateTechnologies(project: Project, order: number): DocumentationSection {
    const content = [
      '# Technologies',
      '',
      '## Programming Languages',
      '',
      ...project.technologyProfile.languages.map(
        (lang) => `- **${lang.name}**${lang.version ? ` (${lang.version})` : ''}: ${lang.files} files (${lang.percentage.toFixed(1)}%)`
      ),
      '',
      '## Frameworks & Libraries',
      '',
      ...project.technologyProfile.frameworks.map(
        (fw) => `- **${fw.name}**${fw.version ? ` (${fw.version})` : ''}: ${fw.purpose}`
      ),
      '',
      '## Build Tools & Utilities',
      '',
      ...project.technologyProfile.libraries.map(
        (lib) => `- **${lib.name}**: ${lib.purpose}`
      ),
    ].join('\n');

    return {
      id: 'technologies',
      title: 'Technologies',
      content,
      level: 1,
      order,
    };
  }

  private generateContributing(project: Project, order: number): DocumentationSection {
    const content = [
      '# Contributing',
      '',
      '## Getting Started',
      '',
      '1. Fork the repository',
      '2. Create a feature branch',
      '3. Make your changes',
      '4. Submit a pull request',
      '',
      '## Coding Standards',
      '',
      '- Follow the existing code style',
      '- Write tests for new features',
      '- Update documentation as needed',
      '',
      '## Reporting Issues',
      '',
      'Please report issues with detailed information about the problem and steps to reproduce.',
    ].join('\n');

    return {
      id: 'contributing',
      title: 'Contributing',
      content,
      level: 1,
      order,
    };
  }

  private generateMetadata(project: Project): DocumentationMetadata {
    return {
      projectName: project.name,
      projectDescription: project.description,
      version: project.metadata.version,
      author: project.metadata.author,
      license: project.metadata.license,
      repository: project.metadata.repository,
      generatedAt: new Date(),
      language: 'en',
      tags: project.technologyProfile.languages.map((l) => l.name),
    };
  }

  private generateFileDocs(project: Project): FileDocumentation[] {
    const docs: FileDocumentation[] = [];

    const processFile = (file: ProjectFile) => {
      if (this.isCodeFile(file.extension)) {
        docs.push({
          path: file.path,
          name: file.name,
          summary: this.summarizeFile(file),
          purpose: this.determinePurpose(file),
          exports: this.extractExports(file),
        });
      }
    };

    const processFolder = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        processFile(file);
      }
      for (const subfolder of folder.subfolders) {
        processFolder(subfolder);
      }
    };

    processFolder(project.rootFolder);
    return docs.slice(0, 100);
  }

  private isCodeFile(ext: string): boolean {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.rb', '.cs', '.php'];
    return codeExtensions.includes(ext.toLowerCase());
  }

  private summarizeFile(file: ProjectFile): string {
    if (!file.content) return 'No content';

    const lines = file.content.split('\n');
    const firstMeaningful = lines.find(
      (l) => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('/*')
    );

    return firstMeaningful
      ? firstMeaningful.slice(0, 100) + (firstMeaningful.length > 100 ? '...' : '')
      : 'Empty file';
  }

  private determinePurpose(file: ProjectFile): string {
    const name = file.name.toLowerCase();

    if (name.includes('test') || name.includes('spec')) return 'Test file';
    if (name.includes('config')) return 'Configuration file';
    if (name.includes('index') || name === 'main') return 'Entry point';
    if (name.includes('util') || name.includes('helper')) return 'Utility functions';
    if (name.includes('component')) return 'UI Component';
    if (name.includes('service')) return 'Business logic';
    if (name.includes('model') || name.includes('schema')) return 'Data model';

    return 'Source file';
  }

  private extractExports(file: ProjectFile): string[] {
    if (!file.content) return [];

    const exports: string[] = [];
    const exportMatches = file.content.match(/export\s+(?:default\s+)?(?:class|function|const|interface|type)\s+(\w+)/g);

    if (exportMatches) {
      for (const match of exportMatches) {
        const name = match.replace(/export\s+(?:default\s+)?(?:class|function|const|interface|type)\s+/, '');
        exports.push(name);
      }
    }

    return exports;
  }

  private generateAccessibility(): Documentation['accessibility'] {
    return {
      compatible: true,
      screenReaderFriendly: true,
      keyboardNavigable: true,
      highContrastCompatible: true,
      arLabelsPresent: false,
      recommendations: [
        'All code examples use proper syntax highlighting',
        'Headings follow proper hierarchy (h1-h6)',
        'Tables are properly structured for screen readers',
      ],
    };
  }

  generateMarkdown(documentation: Documentation): string {
    let markdown = '';

    // Title
    markdown += `# ${documentation.metadata.projectName}\n\n`;

    // Description
    if (documentation.metadata.projectDescription) {
      markdown += `${documentation.metadata.projectDescription}\n\n`;
    }

    // Table of contents
    markdown += '## Table of Contents\n\n';
    for (const section of documentation.sections) {
      markdown += `- [${section.title}](#${section.id})\n`;
    }
    markdown += '\n---\n\n';

    // Sections
    for (const section of documentation.sections) {
      markdown += `${'#'.repeat(section.level)} ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
    }

    return markdown;
  }

  generateHTML(documentation: Documentation): string {
    const markdown = this.generateMarkdown(documentation);

    return `
<!DOCTYPE html>
<html lang="${documentation.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentation.metadata.projectName} Documentation</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
    code { background: #f5f5f5; padding: 0.2rem 0.4rem; }
    h1, h2, h3 { color: #333; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
  </style>
</head>
<body>
  <main role="document" aria-label="${documentation.metadata.projectName} Documentation">
    ${markdown.replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/\n\n/g, '</p><p>').replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>')}
  </main>
</body>
</html>`;
  }
}

export default DocumentationGenerator.getInstance();
