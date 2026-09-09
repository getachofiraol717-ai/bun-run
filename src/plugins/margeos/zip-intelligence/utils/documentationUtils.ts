/**
 * Documentation Utilities
 * Helper functions for documentation generation and formatting
 */

import { Documentation, DocumentationSection } from '../models/Documentation';

export interface TocItem {
  id: string;
  title: string;
  level: number;
  children: TocItem[];
}

/**
 * Generate table of contents from sections
 */
export function generateTableOfContents(sections: DocumentationSection[]): TocItem[] {
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const section of sections) {
    const item: TocItem = {
      id: section.id,
      title: section.title,
      level: section.level,
      children: [],
    };

    // Pop items from stack until we find a parent
    while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  }

  return root;
}

/**
 * Format markdown to plain text
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Collapse multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract code examples from documentation
 */
export function extractCodeExamples(markdown: string): Array<{
  language: string;
  code: string;
  description?: string;
}> {
  const examples: Array<{ language: string; code: string; description?: string }> = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    examples.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }

  return examples;
}

/**
 * Validate documentation completeness
 */
export function validateDocumentation(documentation: Documentation): {
  valid: boolean;
  missingSections: string[];
  warnings: string[];
} {
  const requiredSections = ['overview', 'installation', 'usage'];
  const recommendedSections = ['api', 'examples', 'contributing'];

  const existingIds = new Set(documentation.sections.map((s) => s.id));
  const missingSections: string[] = [];

  for (const required of requiredSections) {
    if (!existingIds.has(required)) {
      missingSections.push(required);
    }
  }

  const warnings: string[] = [];

  // Check for empty sections
  for (const section of documentation.sections) {
    if (section.content.length < 50) {
      warnings.push(`Section "${section.title}" has minimal content`);
    }
  }

  // Check for recommended sections
  for (const recommended of recommendedSections) {
    if (!existingIds.has(recommended)) {
      warnings.push(`Recommended section missing: ${recommended}`);
    }
  }

  return {
    valid: missingSections.length === 0,
    missingSections,
    warnings,
  };
}

/**
 * Generate README template
 */
export function generateReadmeTemplate(projectName: string): string {
  return `# ${projectName}

## Overview

Brief description of the project.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`javascript
// Example code
\`\`\`

## API

Description of the API.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC
`;
}

/**
 * Generate changelog entry
 */
export function generateChangelogEntry(version: string, changes: string[]): string {
  const date = new Date().toISOString().split('T')[0];

  const lines = [
    `## [${version}] - ${date}`,
    '',
  ];

  for (const change of changes) {
    lines.push(`- ${change}`);
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Render documentation to HTML
 */
export function renderToHtml(documentation: Documentation): string {
  const sections = documentation.sections
    .map((section) => {
      const content = section.content
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold/italic
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        // Paragraphs
        .replace(/\n\n/g, '</p><p>')
        // Line breaks
        .replace(/\n/g, '<br/>');

      return `<section id="${section.id}">${content}</section>`;
    })
    .join('\n');

  return `
<!DOCTYPE html>
<html lang="${documentation.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentation.metadata.projectName}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    h2 { margin-top: 2rem; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
    ul { padding-left: 1.5rem; }
    a { color: #0066cc; }
    section { margin-bottom: 2rem; }
  </style>
</head>
<body>
  <h1>${documentation.metadata.projectName}</h1>
  ${documentation.metadata.projectDescription ? `<p>${documentation.metadata.projectDescription}</p>` : ''}
  ${sections}
</body>
</html>
  `.trim();
}

/**
 * Calculate documentation score
 */
export function calculateDocumentationScore(documentation: Documentation): number {
  let score = 0;
  const sections = documentation.sections;

  // Base score for having sections
  score += Math.min(sections.length * 5, 30);

  // Check for important sections
  const sectionIds = sections.map((s) => s.id);
  if (sectionIds.includes('overview')) score += 15;
  if (sectionIds.includes('installation')) score += 15;
  if (sectionIds.includes('usage')) score += 15;
  if (sectionIds.includes('api')) score += 10;
  if (sectionIds.includes('examples')) score += 10;

  // Content length bonus
  const totalContent = sections.reduce((sum, s) => sum + s.content.length, 0);
  if (totalContent > 5000) score += 10;
  else if (totalContent > 2000) score += 5;

  // Code examples bonus
  const hasCode = sections.some((s) => s.content.includes('```'));
  if (hasCode) score += 5;

  return Math.min(100, score);
}

export default {
  generateTableOfContents,
  markdownToPlainText,
  extractCodeExamples,
  validateDocumentation,
  generateReadmeTemplate,
  generateChangelogEntry,
  renderToHtml,
  calculateDocumentationScore,
};
