/**
 * Architecture Provider Interface
 * Contract for architectural pattern recognition and dependency mapping
 */

import { Project } from '../models/ProjectModel';
import { ArchitectureReport } from '../models/ArchitectureReport';
import { DependencyGraph } from '../models/DependencyGraph';

export interface IArchitectureProvider {
  analyzeArchitecture(project: Project): Promise<ArchitectureReport>;
  buildDependencyGraph(project: Project): Promise<DependencyGraph>;
  identifyPatterns(project: Project): string[];
}

export default IArchitectureProvider;
