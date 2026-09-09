// Knowledge Galaxy Models Barrel Exports
export * from './GalaxyCluster';
export * from './GalaxyState';
export * from './KnowledgeEdge';
export * from './KnowledgeGraph';

// Explicitly re-export from KnowledgeNode, excluding 'Position' (canonical in GalaxyCluster)
// and 'NodeStatus' (canonical in LearningPath) to avoid ambiguity.
export type {
  NodeType,
  MasteryLevel,
  KnowledgeNode,
  KnowledgeNodeExtended,
} from './KnowledgeNode';
export {
  createKnowledgeNode,
  NODE_TYPE_CONFIG,
  STATUS_CONFIG,
  MASTERY_CONFIG,
  validateKnowledgeNode,
  compareNodes,
  isSubjectNode,
  isChapterNode,
  isConceptNode,
  isSkillNode,
  isFormulaNode,
  isLearnableNode,
  isMasteredNode,
  isInProgressNode,
} from './KnowledgeNode';

export * from './LearningPath';
export * from './SkillNode';
