// @ts-nocheck
// Knowledge Galaxy Engine — Main Export
// Barrel file for all public APIs

// Core Engine
export { KnowledgeGalaxyEngine } from "./core/KnowledgeGalaxyEngine";
export { GalaxyController } from "./core/GalaxyController";
export { KnowledgeGraphBuilder } from "./core/KnowledgeGraphBuilder";
export { NodeGenerator } from "./core/NodeGenerator";
export { RelationshipEngine } from "./core/RelationshipEngine";
export { SkillGraphEngine } from "./core/SkillGraphEngine";
export { LearningPathGraph } from "./core/LearningPathGraph";
export { GalaxyEvolutionEngine } from "./core/GalaxyEvolutionEngine";
export { GalaxyNavigationEngine } from "./core/GalaxyNavigationEngine";
export { KnowledgeRecommendationEngine } from "./core/KnowledgeRecommendationEngine";

// Services
export { GraphGenerationService } from "./services/GraphGenerationService";
export { GraphTraversalService } from "./services/GraphTraversalService";
export { NodeRankingService } from "./services/NodeRankingService";
export { RelationshipAnalysisService } from "./services/RelationshipAnalysisService";
export { RecommendationService } from "./services/RecommendationService";
export { GraphPersistenceService } from "./services/GraphPersistenceService";

// Models
export * from "./models/KnowledgeNode";
export * from "./models/KnowledgeEdge";
export * from "./models/GalaxyCluster";
export * from "./models/SkillNode";
export * from "./models/LearningPath";
export * from "./models/KnowledgeGraph";
export * from "./models/GalaxyState";

// Hooks
export { useKnowledgeGalaxy } from "./hooks/useKnowledgeGalaxy";
export { useKnowledgeNodes } from "./hooks/useKnowledgeNodes";
export { useLearningGraph } from "./hooks/useLearningGraph";
export { useRecommendations } from "./hooks/useRecommendations";
export { useGalaxyNavigation } from "./hooks/useGalaxyNavigation";

// Store
export { galaxyReducer, initialState } from "./store/knowledgeGalaxyStore";
export type { GalaxyState, GalaxyAction } from "./store/knowledgeGalaxyStore";

// Utils
export * from "./utils/graphUtils";
export * from "./utils/nodeUtils";
export * from "./utils/relationshipUtils";
export * from "./utils/clusterUtils";
export * from "./utils/navigationUtils";

// Interfaces
export * from "./interfaces/KnowledgeGraph";
export * from "./interfaces/GalaxyRenderer";
export * from "./interfaces/KnowledgeExplorer";

// Singleton instances
import { KnowledgeGalaxyEngine } from "./core/KnowledgeGalaxyEngine";
import { GalaxyController } from "./core/GalaxyController";
import { KnowledgeGraphBuilder } from "./core/KnowledgeGraphBuilder";
import { RelationshipEngine } from "./core/RelationshipEngine";
import { SkillGraphEngine } from "./core/SkillGraphEngine";
import { LearningPathGraph } from "./core/LearningPathGraph";
import { GalaxyEvolutionEngine } from "./core/GalaxyEvolutionEngine";
import { GalaxyNavigationEngine } from "./core/GalaxyNavigationEngine";
import { KnowledgeRecommendationEngine } from "./core/KnowledgeRecommendationEngine";
import { GraphGenerationService } from "./services/GraphGenerationService";
import { GraphTraversalService } from "./services/GraphTraversalService";
import { NodeRankingService } from "./services/NodeRankingService";
import { RelationshipAnalysisService } from "./services/RelationshipAnalysisService";
import { RecommendationService } from "./services/RecommendationService";
import { GraphPersistenceService } from "./services/GraphPersistenceService";

export const knowledgeGalaxyEngine = KnowledgeGalaxyEngine.getInstance();
export const galaxyController = GalaxyController.getInstance();
export const knowledgeGraphBuilder = KnowledgeGraphBuilder;
export const relationshipEngine = RelationshipEngine;
export const skillGraphEngine = SkillGraphEngine.getInstance();
export const learningPathGraph = LearningPathGraph.getInstance();
export const galaxyEvolutionEngine = GalaxyEvolutionEngine.getInstance();
export const galaxyNavigationEngine = GalaxyNavigationEngine.getInstance();
export const knowledgeRecommendationEngine = KnowledgeRecommendationEngine.getInstance();
export const graphGenerationService = GraphGenerationService.getInstance();
export const graphTraversalService = GraphTraversalService.getInstance();
export const nodeRankingService = NodeRankingService.getInstance();
export const relationshipAnalysisService = RelationshipAnalysisService.getInstance();
export const recommendationService = RecommendationService.getInstance();
export const graphPersistenceService = GraphPersistenceService.getInstance();

// Version info
export const VERSION = "1.0.0";
export const ENGINE_NAME = "MargeOS Knowledge Constellation Engine";

// Default configuration
export const DEFAULT_CONFIG = {
  storageKey: "margeos-knowledge-galaxy",
  maxVisibleNodes: 500,
  defaultZoom: 1,
  minZoom: 0.1,
  maxZoom: 5,
  physicsEnabled: true,
  autoSaveInterval: 60000,
  maxHistorySize: 50,
  defaultViewMode: "galaxy" as const
};
