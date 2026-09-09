/**
 * Project Analyzer Interface
 * Contract for project analysis engines
 */

import { Project } from '../models/ProjectModel';
import { AnalysisReport } from '../models/AnalysisReport';
import { BugReport } from '../models/BugReport';

export interface IProjectAnalyzer {
  analyze(project: Project): Promise<AnalysisReport>;
  detectBugs(project: Project): Promise<BugReport>;
  calculateMetrics(project: Project): Promise<Record<string, number>>;
}

export default IProjectAnalyzer;
