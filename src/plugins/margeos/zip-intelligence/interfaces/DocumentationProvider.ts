/**
 * Documentation Provider Interface
 * Contract for documentation generation engines and services
 */

import { Project } from '../models/ProjectModel';
import { Documentation } from '../models/Documentation';

export interface IDocumentationProvider {
  generateDocumentation(project: Project): Promise<Documentation>;
  exportMarkdown(doc: Documentation): string;
  exportHTML(doc: Documentation): string;
}

export default IDocumentationProvider;
