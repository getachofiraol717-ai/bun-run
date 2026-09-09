// @ts-nocheck
/**
 * MargeOS Master Subsystems Barrel & Registry
 * Exports all 16 MargeOS subsystem engines and helper accessors.
 */

// 1. Accessibility Engine
export * as AccessibilityPlugin from './accessibility-engine';
export { AccessibilityEngine, accessibilityEngine, useAccessibility } from './accessibility-engine';

// 2. AI Tutor Engine
export * as AITutorPlugin from './ai-tutor-engine';
export { AITutorEngine, preparePageSession, teachBlock } from './ai-tutor-engine';

// 4. Classroom Engine
export * as ClassroomPlugin from './classroom-engine';
export { ClassroomController, MargeOSIntegration } from './classroom-engine';

// 5. Communication Engine
export * as CommunicationPlugin from './communication-engine';
export { CommunicationHub } from './communication-engine';

// 6. Exam Simulator
export * as ExamSimulatorPlugin from './exam-simulator';
export { ExamSimulatorEngine, ExamController, useExamSimulator } from './exam-simulator';

// 7. Formula Engine
export * as FormulaPlugin from './formula-engine';
export { enrichFormula, enrichFormulas, solveFormula, useFormulaEngine } from './formula-engine';

// 8. Knowledge Galaxy
export * as KnowledgeGalaxyPlugin from './knowledge-galaxy';
export { KnowledgeGalaxyEngine, galaxyController, useKnowledgeGalaxy } from './knowledge-galaxy';

// 9. Quiz Engine
export * as QuizPlugin from './quiz-engine';
export { QuizEngine, getQuizController, useQuiz, useQuizStore } from './quiz-engine';

// 10. Reference Book Engine
export * as ReferenceBookPlugin from './reference-book-engine';
export { ReferenceBookEngine, SourceAnalyzer, SourceComparator } from './reference-book-engine';

// 11. Smart PDF Engine
export * as SmartPDFPlugin from './smart-pdf-engine';
export { analyzePDF, runAnalysis, usePDFAnalysis, useLearningPath } from './smart-pdf-engine';

// 12. Study Companion
export * as StudyCompanionPlugin from './study-companion';
export { StudyCompanionEngine, studyCompanionController, useStudyCompanion } from './study-companion';

// 13. Terminal Sandbox
export * as TerminalSandboxPlugin from './terminal-sandbox';
export { TerminalSandboxEngine, ExecutionOrchestrator, useTerminal } from './terminal-sandbox';

// 14. Visual Learning Engine
export * as VisualLearningPlugin from './visual-learning-engine';
export { VisualLearningEngine, visualLearningEngine, useVisualLearning } from './visual-learning-engine';

// 15. VS Code Workspace
export * as VSCodeWorkspacePlugin from './vscode-workspace';
export { WorkspaceEngine, getWorkspaceEngine, useWorkspaceStore, FileSystemService } from './vscode-workspace';

// 16. ZIP Intelligence
export * as ZipIntelligencePlugin from './zip-intelligence';
export { default as zipIntelligenceEngine, useProjectAnalysis } from './zip-intelligence';

// 17. Civilization Engine (Learning Civilization Layer)
export * as CivilizationPlugin from './civilization-engine';
export { CivilizationEngine, CivilizationController, useCivilization, useQuests, usePlanets, useAchievements } from './civilization-engine';

// Top-Level MargeOS UI Panels & Components
export { AgentPanel } from './AgentPanel';
export { AnalyticsPanel } from './AnalyticsPanel';
export { CollaborationPanel } from './CollaborationPanel';
export { ExecutionMonitor } from './ExecutionMonitor';
export { FileExplorer } from './FileExplorer';
export { MargeOSShell } from './MargeOSShell';
export { MargeOSTutorCard } from './MargeOSTutorCard';
export { MemoryPanel } from './MemoryPanel';
export { SandboxPanel } from './SandboxPanel';
export { SessionViewer } from './SessionViewer';
export { TerminalPanel } from './TerminalPanel';
export { TutorPanel } from './TutorPanel';
export { WorkspacePanel } from './WorkspacePanel';
export { ZipIntelligencePanel } from './ZipIntelligencePanel';

// Core Orchestrators & Client Bridges
export * from './agentClient';
export * from './analyticsUtils';
export * from './engines';
export * from './orchestrator';
export * from './sandboxRunner';
export * from './tutorUtils';
export * from './types';


