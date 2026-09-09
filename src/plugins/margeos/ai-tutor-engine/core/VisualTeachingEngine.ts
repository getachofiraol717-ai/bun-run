import { VisualizationService } from "../services/VisualizationService";

export class VisualTeachingEngine {
  static buildVisuals(topic: string) {
    return {
      conceptMap: VisualizationService.createConceptMap(topic),
      mindMap: VisualizationService.createMindMap(topic),
      flowchart: VisualizationService.createFlowchart(topic),
      diagram: VisualizationService.createDiagram(topic),
    };
  }
}
