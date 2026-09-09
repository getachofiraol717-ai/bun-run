// @ts-nocheck
/**
 * Architecture Analyzer
 * Analyzes and explains project architecture
 */

import { Project, ProjectFolder, ArchitectureReport, ArchitectureLayer, ComponentInfo } from '../models/ProjectModel';

export interface ArchitectureInsights {
  pattern: string;
  layers: ArchitectureLayer[];
  components: ComponentInfo[];
  dependencies: string[];
  dataFlow: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export class ArchitectureAnalyzer {
  private static instance: ArchitectureAnalyzer | null = null;

  private constructor() {}

  static getInstance(): ArchitectureAnalyzer {
    if (!ArchitectureAnalyzer.instance) {
      ArchitectureAnalyzer.instance = new ArchitectureAnalyzer();
    }
    return ArchitectureAnalyzer.instance;
  }

  analyze(project: Project): ArchitectureReport {
    const structure = this.analyzeFolderStructure(project.rootFolder);
    const pattern = this.detectPattern(structure);
    const layers = this.identifyLayers(structure);
    const components = this.identifyComponents(project);
    const flow = this.analyzeDataFlow(structure);

    return {
      pattern: {
        name: pattern.name,
        category: pattern.category,
        description: this.generatePatternDescription(pattern.category),
      },
      description: this.generateArchitectureDescription(project, pattern),
      layers,
      components,
      relationships: this.identifyRelationships(components),
      flow,
      strengths: this.identifyStrengths(project, pattern),
      weaknesses: this.identifyWeaknesses(project, pattern),
      recommendations: this.generateRecommendations(pattern, layers),
    };
  }

  private analyzeFolderStructure(folder: ProjectFolder): FolderStructureNode {
    const node: FolderStructureNode = {
      name: folder.name,
      path: folder.path,
      depth: folder.depth,
      fileCount: folder.files.length,
      subfolders: folder.subfolders.map((s) => this.analyzeFolderStructure(s)),
      hasConfig: folder.files.some((f) => f.name.includes('config')),
      hasTests: folder.files.some((f) => f.name.includes('test') || f.name.includes('spec')),
      hasIndex: folder.files.some((f) => f.name === 'index'),
    };

    return node;
  }

  private detectPattern(structure: FolderStructureNode): { name: string; category: ArchitectureReport['pattern']['category'] } {
    // Detect MVC pattern
    if (this.hasFolder(structure, ['models', 'views', 'controllers']) ||
        this.hasFolder(structure, ['model', 'view', 'controller'])) {
      return { name: 'MVC', category: 'mvc' };
    }

    // Detect Layered Architecture
    if (this.hasFolder(structure, ['presentation', 'business', 'data']) ||
        this.hasFolder(structure, ['ui', 'domain', 'infrastructure']) ||
        this.hasFolder(structure, ['frontend', 'backend', 'api'])) {
      return { name: 'Layered Architecture', category: 'layered' };
    }

    // Detect Component-based
    if (this.hasFolder(structure, ['components', 'pages', 'layouts']) ||
        this.hasFolder(structure, ['widgets', 'screens', 'app'])) {
      return { name: 'Component-based Architecture', category: 'component' };
    }

    // Detect Clean Architecture
    if (this.hasFolder(structure, ['entities', 'usecases', 'interfaces']) ||
        this.hasFolder(structure, ['domain', 'application', 'infrastructure', 'interfaces'])) {
      return { name: 'Clean Architecture', category: 'clean' };
    }

    // Detect Microservices
    if (this.hasMultipleServices(structure)) {
      return { name: 'Microservices Architecture', category: 'microservice' };
    }

    // Default to Modular
    return { name: 'Modular Architecture', category: 'modular' };
  }

  private hasFolder(structure: FolderStructureNode, names: string[]): boolean {
    const allFolders = this.getAllFolderNames(structure);
    return names.some((name) => allFolders.some((f) => f.toLowerCase().includes(name.toLowerCase())));
  }

  private hasMultipleServices(structure: FolderStructureNode): boolean {
    const serviceFolders = this.getAllFolderNames(structure).filter(
      (f) => f.toLowerCase().includes('service') || f.toLowerCase().includes('microservice')
    );
    return serviceFolders.length >= 2;
  }

  private getAllFolderNames(structure: FolderStructureNode): string[] {
    const names = [structure.name];
    for (const subfolder of structure.subfolders) {
      names.push(...this.getAllFolderNames(subfolder));
    }
    return names;
  }

  private identifyLayers(structure: FolderStructureNode): ArchitectureLayer[] {
    const layers: ArchitectureLayer[] = [];
    const depth = structure.depth;

    // Based on common patterns, identify layers
    if (this.hasFolder(structure, ['public', 'src', 'app'])) {
      layers.push({
        name: 'Presentation Layer',
        description: 'Handles UI rendering and user interaction',
        folders: this.getFoldersByCategory(structure, ['ui', 'view', 'component', 'page', 'screen']),
        responsibilities: ['Render UI', 'Handle user input', 'Display data'],
        dependencies: ['Business Logic'],
      });
    }

    if (this.hasFolder(structure, ['logic', 'service', 'business', 'domain'])) {
      layers.push({
        name: 'Business Logic Layer',
        description: 'Contains core application logic and rules',
        folders: this.getFoldersByCategory(structure, ['logic', 'service', 'business', 'domain', 'model']),
        responsibilities: ['Process data', 'Enforce business rules', 'Application workflow'],
        dependencies: ['Data Access'],
      });
    }

    if (this.hasFolder(structure, ['data', 'repository', 'dal', 'persistence'])) {
      layers.push({
        name: 'Data Access Layer',
        description: 'Manages data persistence and retrieval',
        folders: this.getFoldersByCategory(structure, ['data', 'repository', 'dal', 'persistence', 'db']),
        responsibilities: ['Database operations', 'Data mapping', 'Query execution'],
        dependencies: [],
      });
    }

    if (this.hasFolder(structure, ['config', 'util', 'common', 'shared'])) {
      layers.push({
        name: 'Infrastructure Layer',
        description: 'Provides cross-cutting concerns and utilities',
        folders: this.getFoldersByCategory(structure, ['config', 'util', 'common', 'shared', 'lib']),
        responsibilities: ['Configuration', 'Logging', 'Security', 'Utilities'],
        dependencies: [],
      });
    }

    return layers;
  }

  private getFoldersByCategory(structure: FolderStructureNode, categories: string[]): string[] {
    const folders: string[] = [];

    const search = (node: FolderStructureNode) => {
      if (categories.some((cat) => node.name.toLowerCase().includes(cat))) {
        folders.push(node.path);
      }
      for (const subfolder of node.subfolders) {
        search(subfolder);
      }
    };

    search(structure);
    return folders;
  }

  private identifyComponents(project: Project): ComponentInfo[] {
    const components: ComponentInfo[] = [];

    const analyzeFolder = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        if (this.isComponentFile(file)) {
          components.push({
            name: file.name,
            path: file.path,
            type: this.detectComponentType(file),
            description: this.generateComponentDescription(file),
            exports: this.extractExports(file),
          });
        }
      }

      for (const subfolder of folder.subfolders) {
        analyzeFolder(subfolder);
      }
    };

    analyzeFolder(project.rootFolder);
    return components.slice(0, 50); // Limit to top 50 components
  }

  private isComponentFile(file: ProjectFile): boolean {
    const componentExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.py', '.java'];
    return componentExtensions.includes(file.extension.toLowerCase());
  }

  private detectComponentType(file: ProjectFile): ComponentInfo['type'] {
    const name = file.name.toLowerCase();

    if (name.includes('controller') || name.includes('handler')) return 'controller';
    if (name.includes('service') || name.includes('logic')) return 'service';
    if (name.includes('model') || name.includes('entity')) return 'model';
    if (name.includes('component') || name.includes('.tsx') || name.includes('.jsx')) return 'component';
    if (name.includes('util') || name.includes('helper')) return 'utility';
    if (name.includes('config') || name.includes('.config')) return 'config';

    return 'module';
  }

  private generateComponentDescription(file: ProjectFile): string {
    const name = file.name.replace(/\.(js|jsx|ts|tsx|py|java)$/, '');
    const words = name.split(/[-_]/).filter(Boolean);

    if (words.length === 1) {
      return `The ${words[0]} module handles ${this.detectComponentType(file)} responsibilities.`;
    }

    return `The ${words.join(' ')} ${this.detectComponentType(file)} provides related functionality.`;
  }

  private extractExports(file: ProjectFile): string[] {
    if (!file.content) return [];

    const exports: string[] = [];
    const exportMatches = file.content.match(/export\s+(?:default\s+)?(?:class|function|const|interface|type)\s+(\w+)/g);

    if (exportMatches) {
      for (const match of exportMatches) {
        const nameMatch = match.match(/export\s+(?:default\s+)?(?:class|function|const|interface|type)\s+(\w+)/);
        if (nameMatch) {
          exports.push(nameMatch[1]);
        }
      }
    }

    return exports;
  }

  private identifyRelationships(components: ComponentInfo[]): ArchitectureReport['relationships'] {
    const relationships: ArchitectureReport['relationships'] = [];

    // Simplified relationship detection based on imports
    for (const component of components) {
      if (component.exports && component.exports.length > 0) {
        for (const exported of component.exports) {
          relationships.push({
            from: component.path,
            to: exported,
            type: 'imports',
            description: `${component.name} imports ${exported}`,
          });
        }
      }
    }

    return relationships.slice(0, 100);
  }

  private analyzeDataFlow(structure: FolderStructureNode): ArchitectureReport['flow'] {
    const flow: ArchitectureReport['flow'] = [];

    // Common data flow patterns
    flow.push({
      from: 'User Interface',
      to: 'Business Logic',
      data: 'User Actions',
      description: 'User interactions trigger business logic operations',
    });

    flow.push({
      from: 'Business Logic',
      to: 'Data Access',
      data: 'Data Requests',
      description: 'Business logic requests and manipulates data',
    });

    flow.push({
      from: 'Data Access',
      to: 'Database',
      data: 'CRUD Operations',
      description: 'Data access layer handles database operations',
    });

    return flow;
  }

  private generatePatternDescription(category: ArchitectureReport['pattern']['category']): string {
    const descriptions: Record<string, string> = {
      layered: 'Layered architecture separates concerns into distinct layers. Each layer has specific responsibilities and only depends on layers below it.',
      mvc: 'Model-View-Controller pattern separates data (Model), UI (View), and logic (Controller). Commonly used in web applications.',
      component: 'Component-based architecture organizes code into reusable UI components. Each component encapsulates its own logic and styling.',
      modular: 'Modular architecture divides code into independent modules with clear boundaries and well-defined interfaces.',
      microservices: 'Microservices architecture structures the application as a collection of loosely coupled services. Each service is independently deployable.',
      clean: 'Clean Architecture separates code into layers with strict dependency rules. Business logic is at the center and has no dependencies on external concerns.',
    };

    return descriptions[category] || descriptions.modular;
  }

  private generateArchitectureDescription(project: Project, pattern: { name: string; category: ArchitectureReport['pattern']['category'] }): string {
    return `This project follows a ${pattern.name} pattern. ` +
      `The codebase contains ${project.structure.totalFiles} files organized in ${project.structure.totalFolders} folders ` +
      `with a maximum nesting depth of ${project.structure.maxDepth}. ` +
      `The architecture supports ${project.technologyProfile.frameworks.length} framework(s) ` +
      `and uses ${project.technologyProfile.languages.length} programming language(s).`;
  }

  private identifyStrengths(project: Project, pattern: { name: string; category: ArchitectureReport['pattern']['category'] }): string[] {
    const strengths: string[] = [];

    if (project.structure.maxDepth <= 5) {
      strengths.push('Shallow directory structure makes navigation easy');
    }

    if (project.technologyProfile.frameworks.length >= 1) {
      strengths.push('Uses established frameworks for reliability');
    }

    if (this.hasFolder(project.rootFolder, ['test', 'spec'])) {
      strengths.push('Has dedicated testing structure');
    }

    if (this.hasFolder(project.rootFolder, ['docs', 'documentation'])) {
      strengths.push('Includes documentation structure');
    }

    if (pattern.category === 'layered' || pattern.category === 'clean') {
      strengths.push('Clear separation of concerns improves maintainability');
    }

    return strengths.length > 0 ? strengths : ['Well-organized project structure'];
  }

  private identifyWeaknesses(project: Project, pattern: { name: string; category: ArchitectureReport['pattern']['category'] }): string[] {
    const weaknesses: string[] = [];

    if (project.structure.maxDepth > 10) {
      weaknesses.push('Deep directory nesting may indicate overly complex organization');
    }

    if (!this.hasFolder(project.rootFolder, ['test', 'spec'])) {
      weaknesses.push('No dedicated testing structure found');
    }

    if (!this.hasFolder(project.rootFolder, ['docs', 'documentation'])) {
      weaknesses.push('Limited documentation structure');
    }

    if (project.structure.totalFiles > 500 && project.structure.totalFolders < 5) {
      weaknesses.push('Many files in few folders may indicate poor organization');
    }

    return weaknesses;
  }

  private generateRecommendations(pattern: { name: string; category: ArchitectureReport['pattern']['category'] }, layers: ArchitectureLayer[]): ArchitectureReport['recommendations'] {
    const recommendations: ArchitectureReport['recommendations'] = [];

    if (layers.length === 0) {
      recommendations.push({
        title: 'Consider layer separation',
        description: 'Organizing code into logical layers can improve maintainability and testing.',
        priority: 'medium',
        impact: 'Better code organization and separation of concerns',
      });
    }

    recommendations.push({
      title: 'Document component responsibilities',
      description: 'Add clear documentation for each major component to aid understanding.',
      priority: 'low',
      impact: 'Improved developer onboarding and maintenance',
    });

    recommendations.push({
      title: 'Establish dependency rules',
      description: `Define clear dependency rules for the ${pattern.name} architecture.`,
      priority: 'medium',
      impact: 'Prevents circular dependencies and improves maintainability',
    });

    return recommendations;
  }

  explainArchitecture(project: Project): string {
    const report = this.analyze(project);

    let explanation = `# ${project.name} Architecture\n\n`;
    explanation += `## Pattern: ${report.pattern.name}\n\n`;
    explanation += `${report.description}\n\n`;

    if (report.layers.length > 0) {
      explanation += `## Layers\n\n`;
      for (const layer of report.layers) {
        explanation += `### ${layer.name}\n`;
        explanation += `${layer.description}\n`;
        explanation += `**Responsibilities:** ${layer.responsibilities.join(', ')}\n\n`;
      }
    }

    if (report.flow.length > 0) {
      explanation += `## Data Flow\n\n`;
      for (const flow of report.flow) {
        explanation += `**${flow.from} → ${flow.to}:** ${flow.description}\n`;
      }
    }

    if (report.strengths.length > 0) {
      explanation += `\n## Strengths\n\n`;
      for (const strength of report.strengths) {
        explanation += `- ${strength}\n`;
      }
    }

    if (report.weaknesses.length > 0) {
      explanation += `\n## Areas for Improvement\n\n`;
      for (const weakness of report.weaknesses) {
        explanation += `- ${weakness}\n`;
      }
    }

    return explanation;
  }
}

interface FolderStructureNode {
  name: string;
  path: string;
  depth: number;
  fileCount: number;
  subfolders: FolderStructureNode[];
  hasConfig: boolean;
  hasTests: boolean;
  hasIndex: boolean;
}

export default ArchitectureAnalyzer.getInstance();
