// Visual Learning Engine — FlowchartGenerator
// Feature 4: Flowchart Generator

import type { Flowchart, FlowchartNode, FlowchartLink, FlowchartStep, FlowchartNodeType } from "../models/MindMap";

export interface FlowchartInput {
  title: string;
  description?: string;
  steps: {
    id: string;
    label: string;
    type: FlowchartNodeType;
    description?: string;
    next?: string;
    yes?: string;
    no?: string;
  }[];
  options?: {
    layout?: "vertical" | "horizontal";
    showSteps?: boolean;
  };
}

/**
 * Generates flowcharts from process steps
 */
export class FlowchartGenerator {
  /**
   * Generate flowchart from input
   */
  async generate(input: FlowchartInput): Promise<Flowchart> {
    const options = input.options || {};
    const isVertical = options.layout !== "horizontal";

    const flowchart: Flowchart = {
      id: `flowchart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: input.title,
      description: input.description,

      startNodeId: "",
      endNodeIds: [],
      nodes: new Map(),
      links: new Map(),

      bounds: { x: 0, y: 0, width: 600, height: 800 },

      style: this.createDefaultStyle(),

      sourceIds: [],
      topicId: undefined,

      ariaLabel: input.title,
      steps: [],

      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create nodes
    const nodeWidth = 180;
    const nodeHeight = 60;
    const verticalGap = 80;
    const horizontalGap = 120;

    let currentY = 50;
    let currentX = 300;
    let stepNumber = 0;

    // First pass: create all nodes
    for (const step of input.steps.slice(0, 20)) {
      const node = this.createNode({
        id: step.id,
        label: step.label,
        type: step.type,
        description: step.description,
        x: currentX,
        y: currentY,
        width: nodeWidth,
        height: nodeHeight,
        nextIds: [],
        previousIds: []
      });

      flowchart.nodes.set(node.id, node);

      // Track start and end nodes
      if (step.type === "start" && !flowchart.startNodeId) {
        flowchart.startNodeId = node.id;
      }
      if (step.type === "end") {
        flowchart.endNodeIds.push(node.id);
      }

      if (isVertical) {
        currentY += nodeHeight + verticalGap;
      } else {
        currentX += nodeWidth + horizontalGap;
      }

      stepNumber++;
    }

    // Second pass: create connections
    let stepIndex = 0;
    for (const step of input.steps.slice(0, 20)) {
      const sourceNode = flowchart.nodes.get(step.id);
      if (!sourceNode) continue;

      // Main flow
      if (step.next) {
        const targetNode = flowchart.nodes.get(step.next);
        if (targetNode) {
          sourceNode.nextIds.push(step.next);
          targetNode.previousIds.push(step.id);

          flowchart.links.set(
            `${step.id}_${step.next}`,
            this.createLink({
              sourceId: step.id,
              targetId: step.next,
              label: ""
            })
          );
        }
      }

      // Decision branches
      if (step.type === "decision") {
        if (step.yes) {
          const yesNode = flowchart.nodes.get(step.yes);
          if (yesNode) {
            sourceNode.yesNextId = step.yes;
            sourceNode.nextIds.push(step.yes);
            yesNode.previousIds.push(step.id);

            flowchart.links.set(
              `${step.id}_${step.yes}`,
              this.createLink({
                sourceId: step.id,
                targetId: step.yes,
                label: "Yes"
              })
            );
          }
        }

        if (step.no) {
          const noNode = flowchart.nodes.get(step.no);
          if (noNode) {
            sourceNode.noNextId = step.no;
            sourceNode.nextIds.push(step.no);
            noNode.previousIds.push(step.id);

            flowchart.links.set(
              `${step.id}_${step.no}`,
              this.createLink({
                sourceId: step.id,
                targetId: step.no,
                label: "No"
              })
            );
          }
        }
      }

      // Add to steps
      if (options.showSteps) {
        flowchart.steps.push({
          stepNumber: stepIndex + 1,
          nodeId: step.id,
          instruction: step.description || step.label,
          expectedOutcome: undefined,
          hint: undefined
        });
      }

      stepIndex++;
    }

    // Calculate bounds
    flowchart.bounds = this.calculateBounds(flowchart);

    return flowchart;
  }

  private createNode(partial: Partial<FlowchartNode> & { id: string; label: string; type: FlowchartNodeType; x: number; y: number }): FlowchartNode {
    return {
      id: partial.id,
      label: partial.label,
      type: partial.type,
      x: partial.x,
      y: partial.y,
      width: partial.width || 180,
      height: partial.height || 60,
      shape: this.getShapeForType(partial.type),
      color: this.getColorForType(partial.type),
      description: partial.description,
      nextIds: partial.nextIds || [],
      previousIds: partial.previousIds || [],
      ...partial
    };
  }

  private createLink(partial: { sourceId: string; targetId: string; label?: string }): FlowchartLink {
    return {
      id: `${partial.sourceId}_${partial.targetId}`,
      sourceId: partial.sourceId,
      targetId: partial.targetId,
      type: "straight",
      label: partial.label,
      labelPosition: "above",
      color: "#64748B",
      lineStyle: "solid"
    };
  }

  private getShapeForType(type: FlowchartNodeType): FlowchartNode["shape"] {
    switch (type) {
      case "start":
      case "end":
        return "oval";
      case "decision":
        return "diamond";
      case "input":
        return "parallelogram";
      case "output":
        return "parallelogram";
      case "subprocess":
        return "rectangle";
      default:
        return "rectangle";
    }
  }

  private getColorForType(type: FlowchartNodeType): string {
    switch (type) {
      case "start":
        return "#22C55E";
      case "end":
        return "#EF4444";
      case "decision":
        return "#F59E0B";
      case "input":
        return "#3B82F6";
      case "output":
        return "#8B5CF6";
      default:
        return "#64748B";
    }
  }

  private calculateBounds(flowchart: Flowchart): { x: number; y: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const node of flowchart.nodes.values()) {
      minX = Math.min(minX, node.x - node.width / 2);
      minY = Math.min(minY, node.y - node.height / 2);
      maxX = Math.max(maxX, node.x + node.width / 2);
      maxY = Math.max(maxY, node.y + node.height / 2);
    }

    return {
      x: minX - 30,
      y: minY - 30,
      width: maxX - minX + 60,
      height: maxY - minY + 60
    };
  }

  private createDefaultStyle(): any {
    return {
      nodeColor: "#64748B",
      decisionColor: "#F59E0B",
      startColor: "#22C55E",
      endColor: "#EF4444",
      linkColor: "#64748B",
      fontSize: 12,
      fontFamily: "Inter, system-ui, sans-serif",
      backgroundColor: "#FFFFFF"
    };
  }
}
