// @ts-nocheck
// Visual Learning Engine — VisualLearningEngine
// Main orchestrator for visual learning generation
import type { Diagram, DiagramInput, DiagramOptions, DiagramType } from "../models/Diagram";
import type { MindMap, MindMapNode } from "../models/MindMap";
import type { ConceptMap, ConceptMapNode } from "../models/MindMap";
import type { Flowchart, FlowchartNode } from "../models/MindMap";
import type { Animation, AnimationFrame } from "../models/Animation";
import { DiagramGenerator } from "./DiagramGenerator";
import { MindMapGenerator } from "./MindMapGenerator";
import { ConceptMapGenerator } from "./ConceptMapGenerator";
import { FlowchartGenerator } from "./FlowchartGenerator";
import { ProcessAnimationGenerator } from "./ProcessAnimationGenerator";
import { LayoutEngine } from "./LayoutEngine";
import { RenderingEngine } from "./RenderingEngine";

export interface VisualLearningConfig {
  autoGenerate: boolean;
  cacheEnabled: boolean;
  maxNodes: number;
  layoutAlgorithm: "auto" | "force" | "hierarchical" | "circular";
  accessibilityEnabled: boolean;
  animationEnabled: boolean;
}

const DEFAULT_CONFIG: VisualLearningConfig = {
  autoGenerate: true,
  cacheEnabled: true,
  maxNodes: 100,
  layoutAlgorithm: "auto",
  accessibilityEnabled: true,
  animationEnabled: true
};

export interface EngineResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export interface GenerationRequest {
  type: "diagram" | "mindmap" | "conceptmap" | "flowchart" | "animation";
  input: any;
  options?: any;
}

export interface GenerationResult {
  id: string;
  type: string;
  title: string;
  data: any;
  renderedSvg?: string;
  cached: boolean;
  generatedAt: Date;
}

/**
 * Main Visual Learning Engine
 * Orchestrates all visual learning generation
 */
export class VisualLearningEngine {
  private config: VisualLearningConfig;
  private diagramGenerator: DiagramGenerator;
  private mindMapGenerator: MindMapGenerator;
  private conceptMapGenerator: ConceptMapGenerator;
  private flowchartGenerator: FlowchartGenerator;
  private animationGenerator: ProcessAnimationGenerator;
  private layoutEngine: LayoutEngine;
  private renderingEngine: RenderingEngine;

  // Cache
  private cache: Map<string, GenerationResult> = new Map();

  constructor(config?: Partial<VisualLearningConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.diagramGenerator = new DiagramGenerator();
    this.mindMapGenerator = new MindMapGenerator();
    this.conceptMapGenerator = new ConceptMapGenerator();
    this.flowchartGenerator = new FlowchartGenerator();
    this.animationGenerator = new ProcessAnimationGenerator();
    this.layoutEngine = new LayoutEngine();
    this.renderingEngine = new RenderingEngine();
  }

  /**
   * Generate visualization from input data
   */
  async generateVisualization(request: GenerationRequest): Promise<EngineResult<GenerationResult>> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached && this.config.cacheEnabled) {
        return { success: true, data: cached };
      }

      let result: GenerationResult;

      switch (request.type) {
        case "diagram":
          result = await this.generateDiagram(request.input as DiagramInput, request.options);
          break;
        case "mindmap":
          result = await this.generateMindMap(request.input, request.options);
          break;
        case "conceptmap":
          result = await this.generateConceptMap(request.input, request.options);
          break;
        case "flowchart":
          result = await this.generateFlowchart(request.input, request.options);
          break;
        case "animation":
          result = await this.generateAnimation(request.input, request.options);
          break;
        default:
          return { success: false, error: `Unknown visualization type: ${request.type}` };
      }

      // Cache result
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, result);
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Generation failed"
      };
    }
  }

  /**
   * Generate diagram from source data
   */
  async generateDiagram(input: DiagramInput, options?: DiagramOptions): Promise<GenerationResult> {
    // Generate diagram
    const diagram = await this.diagramGenerator.generate(input, options);

    // Apply layout
    await this.layoutEngine.applyLayout(diagram, options?.layout || "auto");

    // Generate SVG
    const renderedSvg = await this.renderingEngine.renderDiagramToSvg(diagram);

    // Generate accessibility text
    const accessibilityText = this.generateAccessibilityText(diagram);

    return {
      id: diagram.id,
      type: "diagram",
      title: diagram.title,
      data: diagram,
      renderedSvg,
      cached: false,
      generatedAt: new Date()
    };
  }

  /**
   * Generate mind map from concepts
   */
  async generateMindMap(input: {
    title: string;
    centralConcept: string;
    concepts: { name: string; children?: string[]; details?: string }[];
  }, options?: any): Promise<GenerationResult> {
    // Generate mind map
    const mindMap = await this.mindMapGenerator.generate(input);

    // Apply radial layout
    await this.layoutEngine.applyMindMapLayout(mindMap);

    // Generate SVG
    const renderedSvg = await this.renderingEngine.renderMindMapToSvg(mindMap);

    return {
      id: mindMap.id,
      type: "mindmap",
      title: mindMap.title,
      data: mindMap,
      renderedSvg,
      cached: false,
      generatedAt: new Date()
    };
  }

  /**
   * Generate concept map from relationships
   */
  async generateConceptMap(input: {
    title: string;
    concepts: { id: string; name: string; definition?: string }[];
    relationships: { source: string; target: string; label: string; type: string }[];
  }, options?: any): Promise<GenerationResult> {
    // Generate concept map
    const conceptMap = await this.conceptMapGenerator.generate(input);

    // Apply force layout
    await this.layoutEngine.applyConceptMapLayout(conceptMap);

    // Generate SVG
    const renderedSvg = await this.renderingEngine.renderConceptMapToSvg(conceptMap);

    return {
      id: conceptMap.id,
      type: "conceptmap",
      title: conceptMap.title,
      data: conceptMap,
      renderedSvg,
      cached: false,
      generatedAt: new Date()
    };
  }

  /**
   * Generate flowchart from process
   */
  async generateFlowchart(input: {
    title: string;
    steps: { id: string; label: string; type: string; next?: string; yes?: string; no?: string }[];
  }, options?: any): Promise<GenerationResult> {
    // Generate flowchart
    const flowchart = await this.flowchartGenerator.generate(input);

    // Apply layout
    await this.layoutEngine.applyFlowchartLayout(flowchart);

    // Generate SVG
    const renderedSvg = await this.renderingEngine.renderFlowchartToSvg(flowchart);

    return {
      id: flowchart.id,
      type: "flowchart",
      title: flowchart.title,
      data: flowchart,
      renderedSvg,
      cached: false,
      generatedAt: new Date()
    };
  }

  /**
   * Generate animation from process
   */
  async generateAnimation(input: {
    title: string;
    frames: AnimationFrame[];
  }, options?: any): Promise<GenerationResult> {
    // Generate animation
    const animation = await this.animationGenerator.generate(input);

    return {
      id: animation.id,
      type: "animation",
      title: animation.title,
      data: animation,
      cached: false,
      generatedAt: new Date()
    };
  }

  /**
   * Generate diagram from Smart PDF Engine analysis
   */
  async generateFromPDFAnalysis(analysis: {
    documentId: string;
    concepts: any[];
    formulas: any[];
    chapters: any[];
  }): Promise<EngineResult<Diagram[]>> {
    try {
      const diagrams: Diagram[] = [];

      // Generate concept relationship diagram
      if (analysis.concepts.length > 0) {
        const diagram = await this.generateDiagram({
          type: "relationship",
          title: `Concepts in Document`,
          sourceData: {
            concepts: analysis.concepts.map((c: any) => ({
              name: c.name,
              definition: c.definition,
              related: c.relatedTopics
            }))
          }
        });
        if (diagram.success && diagram.data) {
          diagrams.push(diagram.data.data as Diagram);
        }
      }

      // Generate formula diagram
      if (analysis.formulas.length > 0) {
        const diagram = await this.generateDiagram({
          type: "scientific",
          title: `Formulas in Document`,
          sourceData: {
            formulas: analysis.formulas.map((f: any) => ({
              formula: f.formula,
              variables: f.variables
            }))
          }
        });
        if (diagram.success && diagram.data) {
          diagrams.push(diagram.data.data as Diagram);
        }
      }

      return { success: true, data: diagrams };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Generation failed"
      };
    }
  }

  /**
   * Generate visualization from Formula Engine
   */
  async generateFormulaVisualization(formula: {
    formula: string;
    variables: { symbol: string; name: string; unit?: string }[];
    solvingSteps?: { step: string; formula: string }[];
  }): Promise<EngineResult<Diagram>> {
    try {
      const result = await this.generateDiagram({
        type: "relationship",
        title: `Formula: ${formula.formula}`,
        sourceData: {
          formulas: [{
            formula: formula.formula,
            variables: formula.variables.map(v => v.symbol)
          }],
          processes: formula.solvingSteps?.map((step, i) => ({
            step: `${i + 1}. ${step.step}`,
            inputs: formula.variables.map(v => v.symbol),
            outputs: [formula.formula]
          }))
        }
      });

      if (result.success && result.data) {
        return { success: true, data: result.data.data as Diagram };
      }
      return { success: false, error: "Failed to generate visualization" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Generation failed"
      };
    }
  }

  /**
   * Generate visualization from Reference Book Engine
   */
  async generateFromReferenceBooks(sources: {
    concepts: { name: string; definition: string; sourceId: string }[];
    relationships: { source: string; target: string; type: string }[];
  }): Promise<EngineResult<ConceptMap>> {
    try {
      const result = await this.generateConceptMap({
        title: "Multi-Source Concept Map",
        concepts: sources.concepts.map(c => ({
          id: c.name,
          name: c.name,
          definition: c.definition
        })),
        relationships: sources.relationships
      });

      if (result.success && result.data) {
        return { success: true, data: result.data.data as ConceptMap };
      }
      return { success: false, error: "Failed to generate concept map" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Generation failed"
      };
    }
  }

  /**
   * Generate accessibility text for diagram
   */
  private generateAccessibilityText(diagram: Diagram): string {
    const parts: string[] = [];

    parts.push(`Diagram: ${diagram.title}`);

    if (diagram.description) {
      parts.push(diagram.description);
    }

    parts.push(`Contains ${diagram.nodes.length} elements.`);

    // Describe nodes
    for (const node of diagram.nodes.slice(0, 10)) {
      parts.push(`- ${node.label}`);
    }

    if (diagram.nodes.length > 10) {
      parts.push(`... and ${diagram.nodes.length - 10} more elements.`);
    }

    return parts.join(". ");
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(request: GenerationRequest): string {
    return `${request.type}_${JSON.stringify(request.input)}_${JSON.stringify(request.options)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track hits
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VisualLearningConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): VisualLearningConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const visualLearningEngine = new VisualLearningEngine();
