import { generateVisualData } from "../generators/VisualGenerator";
import { generateDiagramData } from "../generators/DiagramGenerator";

export class VisualizationService {
  static createConceptMap(topic: string) {
    return generateVisualData({ topic, type: "conceptmap" });
  }

  static createMindMap(topic: string) {
    return generateVisualData({ topic, type: "mindmap" });
  }

  static createFlowchart(topic: string) {
    return generateVisualData({ topic, type: "flowchart" });
  }

  static createDiagram(title: string) {
    return generateDiagramData({ title });
  }
}
