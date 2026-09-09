/**
 * Documentation Model
 * Generated documentation for projects
 */

export interface Documentation {
  id: string;
  projectId: string;
  createdAt: Date;
  updatedAt?: Date;
  sections: DocumentationSection[];
  metadata: DocumentationMetadata;
  files: FileDocumentation[];
  accessibility: AccessibilityInfo;
}

export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  level: number; // 1 for h1, 2 for h2, etc.
  order: number;
  subsections?: DocumentationSection[];
  relatedFiles?: string[];
  examples?: CodeExample[];
}

export interface DocumentationMetadata {
  projectName: string;
  projectDescription?: string;
  version?: string;
  author?: string;
  license?: string;
  repository?: string;
  generatedAt: Date;
  lastUpdated?: Date;
  language: string;
  tags: string[];
}

export interface FileDocumentation {
  path: string;
  name: string;
  summary: string;
  description?: string;
  purpose: string;
  exports?: ExportDocumentation[];
  imports?: ImportReference[];
  dependencies?: string[];
  usage?: string;
  examples?: CodeExample[];
  notes?: string[];
}

export interface ExportDocumentation {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'constant' | 'variable';
  signature?: string;
  description: string;
  parameters?: ParameterDocumentation[];
  returns?: string;
  throws?: string[];
  examples?: CodeExample[];
  notes?: string[];
}

export interface ParameterDocumentation {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
  default?: string;
}

export interface ImportReference {
  module: string;
  imports: string[];
}

export interface CodeExample {
  title: string;
  code: string;
  language: string;
  description?: string;
  caption?: string;
  highlightedLines?: number[];
}

export interface AccessibilityInfo {
  compatible: boolean;
  screenReaderFriendly: boolean;
  keyboardNavigable: boolean;
  highContrastCompatible: boolean;
  arLabelsPresent: boolean;
  ariaDescriptions?: string[];
  recommendations: string[];
}

// Section templates
export interface SectionTemplate {
  id: string;
  title: string;
  level: number;
  content: string;
  required: boolean;
}

export const DOCUMENTATION_SECTIONS: SectionTemplate[] = [
  {
    id: 'overview',
    title: 'Project Overview',
    level: 1,
    content: 'General description of the project',
    required: true,
  },
  {
    id: 'installation',
    title: 'Installation',
    level: 1,
    content: 'How to set up and install the project',
    required: true,
  },
  {
    id: 'usage',
    title: 'Usage',
    level: 1,
    content: 'How to use the project',
    required: true,
  },
  {
    id: 'architecture',
    title: 'Architecture',
    level: 1,
    content: 'Project architecture and design',
    required: false,
  },
  {
    id: 'structure',
    title: 'Project Structure',
    level: 1,
    content: 'Folder and file organization',
    required: true,
  },
  {
    id: 'api',
    title: 'API Reference',
    level: 1,
    content: 'API documentation',
    required: false,
  },
  {
    id: 'configuration',
    title: 'Configuration',
    level: 1,
    content: 'Configuration options',
    required: false,
  },
  {
    id: 'contributing',
    title: 'Contributing',
    level: 1,
    content: 'How to contribute',
    required: false,
  },
  {
    id: 'license',
    title: 'License',
    level: 1,
    content: 'License information',
    required: false,
  },
];

// Helper functions
export function createDocumentation(
  id: string,
  projectId: string,
  projectName: string
): Documentation {
  return {
    id,
    projectId,
    createdAt: new Date(),
    sections: [],
    metadata: {
      projectName,
      generatedAt: new Date(),
      language: 'en',
      tags: [],
    },
    files: [],
    accessibility: {
      compatible: true,
      screenReaderFriendly: true,
      keyboardNavigable: true,
      highContrastCompatible: true,
      arLabelsPresent: false,
      recommendations: [],
    },
  };
}

export function generateSection(
  template: SectionTemplate,
  content: string,
  order: number,
  relatedFiles?: string[],
  examples?: CodeExample[]
): DocumentationSection {
  return {
    id: template.id,
    title: template.title,
    content,
    level: template.level,
    order,
    relatedFiles,
    examples,
  };
}

export function generateReadme(documentation: Documentation): string {
  const lines: string[] = [];

  // Project title
  lines.push(`# ${documentation.metadata.projectName}`);
  lines.push('');

  // Description
  if (documentation.metadata.projectDescription) {
    lines.push(documentation.metadata.projectDescription);
    lines.push('');
  }

  // Table of contents
  lines.push('## Table of Contents');
  lines.push('');
  for (const section of documentation.sections) {
    const indent = '  '.repeat(section.level - 1);
    lines.push(`${indent}- [${section.title}](#${section.id})`);
  }
  lines.push('');

  // Sections
  for (const section of documentation.sections) {
    const hashes = '#'.repeat(section.level);
    lines.push(`${hashes} ${section.title}`);
    lines.push('');
    lines.push(section.content);
    lines.push('');
  }

  return lines.join('\n');
}

export function generateMarkdown(documentation: Documentation): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`title: ${documentation.metadata.projectName}`);
  lines.push(`description: ${documentation.metadata.projectDescription || ''}`);
  lines.push(`version: ${documentation.metadata.version || '1.0.0'}`);
  lines.push(`language: ${documentation.metadata.language}`);
  lines.push(`tags: [${documentation.metadata.tags.join(', ')}]`);
  lines.push('---');
  lines.push('');

  // Content
  lines.push(generateReadme(documentation));

  return lines.join('\n');
}

export function generateHTML(documentation: Documentation): string {
  const sections = documentation.sections
    .map((s) => `
      <section id="${s.id}">
        <h${s.level}>${s.title}</h${s.level}>
        <div class="content">
          ${s.content.split('\n').map((p) => `<p>${p}</p>`).join('')}
        </div>
      </section>
    `)
    .join('');

  return `
    <article class="documentation" role="document" aria-label="${documentation.metadata.projectName} Documentation">
      <header>
        <h1>${documentation.metadata.projectName}</h1>
        ${documentation.metadata.projectDescription ? `<p>${documentation.metadata.projectDescription}</p>` : ''}
      </header>
      <nav aria-label="Table of Contents">
        <ul>
          ${documentation.sections.map((s) => `<li><a href="#${s.id}">${s.title}</a></li>`).join('')}
        </ul>
      </nav>
      <main>
        ${sections}
      </main>
    </article>
  `;
}

export function createAccessibilityReport(documentation: Documentation): AccessibilityInfo {
  const recommendations: string[] = [];

  // Check ARIA labels
  if (!documentation.accessibility.arLabelsPresent) {
    recommendations.push('Add ARIA labels to interactive elements');
  }

  // Check headings
  const hasProperHeadings = documentation.sections.every(
    (s) => s.level >= 1 && s.level <= 6
  );
  if (!hasProperHeadings) {
    recommendations.push('Ensure all headings follow proper hierarchy (h1-h6)');
  }

  // Check code examples
  const hasCodeExamples = documentation.sections.some((s) => s.examples?.length);
  if (!hasCodeExamples) {
    recommendations.push('Add code examples to improve understanding');
  }

  return {
    ...documentation.accessibility,
    recommendations,
  };
}

export default {
  createDocumentation,
  generateSection,
  generateReadme,
  generateMarkdown,
  generateHTML,
  createAccessibilityReport,
  DOCUMENTATION_SECTIONS,
};
