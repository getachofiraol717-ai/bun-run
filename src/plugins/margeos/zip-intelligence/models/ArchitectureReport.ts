/**
 * Architecture Report Model
 * Represents the architectural structure, design patterns, components, and data flow of a project
 */

import { ArchitecturePattern, ArchitectureLayer, ComponentInfo, ComponentRelationship, DataFlow, ArchitectureRecommendation } from './ProjectModel';

export interface ArchitectureReport {
  id: string;
  projectId: string;
  pattern: ArchitecturePattern;
  description: string;
  layers: ArchitectureLayer[];
  components: ComponentInfo[];
  relationships: ComponentRelationship[];
  flow: DataFlow[];
  strengths: string[];
  weaknesses: string[];
  recommendations: ArchitectureRecommendation[];
  createdAt: Date;
}

export function createArchitectureReport(
  id: string,
  projectId: string,
  patternName: string = 'Modular Architecture',
  category: ArchitecturePattern['category'] = 'modular'
): ArchitectureReport {
  return {
    id,
    projectId,
    pattern: {
      name: patternName,
      category,
      description: `Discovered architectural pattern: ${patternName}`,
    },
    description: `Analysis report for project ${projectId} architectural design.`,
    layers: [],
    components: [],
    relationships: [],
    flow: [],
    strengths: ['Clear module separation', 'Maintainable component hierarchy'],
    weaknesses: [],
    recommendations: [],
    createdAt: new Date(),
  };
}

export default {
  createArchitectureReport,
};
