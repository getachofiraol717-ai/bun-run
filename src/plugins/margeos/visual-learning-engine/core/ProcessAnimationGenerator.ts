// @ts-nocheck
// Visual Learning Engine — ProcessAnimationGenerator
// Feature 5: Process Animation Engine

import type { Animation, AnimationFrame, AnimationElement, AnimationAnnotation, AnimationPlayback, AnimationType } from "../models/Animation";

export interface ProcessAnimationInput {
  title: string;
  description?: string;
  type: AnimationType;
  process: {
    steps: {
      label: string;
      description?: string;
      elements?: {
        type: "shape" | "text" | "arrow" | "particle" | "highlight";
        position: { x: number; y: number };
        properties: Record<string, any>;
      }[];
      narration?: string;
    }[];
  };
  options?: {
    frameDuration?: number;
    includeCaptions?: boolean;
    loop?: boolean;
  };
}

/**
 * Generates animations from process steps
 */
export class ProcessAnimationGenerator {
  /**
   * Generate animation from input
   */
  async generate(input: ProcessAnimationInput): Promise<Animation> {
    const options = input.options || {};
    const frameDuration = options.frameDuration || 2;

    const animation: Animation = {
      id: `animation_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: input.type,
      title: input.title,
      description: input.description,

      frames: [],
      currentFrame: 0,

      playback: this.createPlayback(options.loop || false),

      sourceIds: [],
      topicId: undefined,
      conceptId: undefined,

      audioDescription: undefined,
      captions: [],

      duration: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let currentTime = 0;

    // Create frames from process steps
    for (let i = 0; i < Math.min(input.process.steps.length, 20); i++) {
      const step = input.process.steps[i];

      const frame = this.createFrame({
        frameNumber: i,
        timestamp: currentTime,
        elements: step.elements?.map((el, elIndex) => this.createElement({
          id: `el_${i}_${elIndex}`,
          type: el.type,
          visible: true,
          opacity: 1,
          position: el.position,
          scale: 1,
          rotation: 0,
          ...el.properties
        })) || [],
        annotations: [],
        narration: step.narration,
        captions: options.includeCaptions ? [step.description || step.label] : []
      });

      animation.frames.push(frame);
      currentTime += frameDuration;
    }

    animation.duration = currentTime;

    return animation;
  }

  /**
   * Generate animation from diagram
   */
  async generateFromDiagram(diagram: any, options?: {
    highlightNodes?: string[];
    animateFlow?: boolean;
  }): Promise<Animation> {
    const animation: Animation = {
      id: `diagram_animation_${Date.now()}`,
      type: "process",
      title: diagram.title || "Diagram Animation",
      frames: [],
      currentFrame: 0,
      playback: this.createPlayback(false),
      captions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create frames showing nodes appearing one by one
    const nodes = diagram.nodes || [];
    const edges = diagram.edges || [];

    // Frame 1: Show all nodes
    const frame1: AnimationFrame = {
      frameNumber: 0,
      timestamp: 0,
      elements: nodes.map((node: any, i: number) => ({
        id: node.id,
        type: "shape" as const,
        visible: true,
        opacity: 0,
        position: { x: node.x, y: node.y },
        scale: 0.5,
        rotation: 0,
        color: node.color || "#3B82F6"
      })),
      annotations: [],
      captions: [`Starting with ${nodes.length} concepts`]
    };
    animation.frames.push(frame1);

    // Frames 2-N: Show nodes with animations
    let time = 2;
    for (let i = 0; i < Math.min(nodes.length, 10); i++) {
      const node = nodes[i];
      const frame: AnimationFrame = {
        frameNumber: i + 1,
        timestamp: time,
        elements: [{
          id: node.id,
          type: "shape",
          visible: true,
          opacity: 1,
          position: { x: node.x, y: node.y },
          scale: 1,
          rotation: 0,
          color: node.color || "#3B82F6"
        }],
        annotations: [{
          type: "callout",
          x: node.x,
          y: node.y - 30,
          text: node.label,
          color: "#3B82F6"
        }],
        captions: [`${node.label} is highlighted`]
      };
      animation.frames.push(frame);
      time += 2;
    }

    // Final frame: Show connections
    if (options?.animateFlow && edges.length > 0) {
      const finalFrame: AnimationFrame = {
        frameNumber: animation.frames.length,
        timestamp: time,
        elements: [
          ...nodes.map(node => ({
            id: node.id,
            type: "shape" as const,
            visible: true,
            opacity: 1,
            position: { x: node.x, y: node.y },
            scale: 1,
            rotation: 0,
            color: node.color || "#3B82F6"
          })),
          ...edges.slice(0, 10).map(edge => ({
            id: edge.id,
            type: "line" as const,
            visible: true,
            opacity: 1,
            position: { x: 0, y: 0 },
            scale: 1,
            rotation: 0,
            color: "#94A3B8",
            arrowHead: true
          }))
        ],
        annotations: [],
        captions: [`Complete diagram with ${edges.length} connections`]
      };
      animation.frames.push(finalFrame);
    }

    animation.duration = time;

    return animation;
  }

  /**
   * Generate formula solving animation
   */
  async generateFormulaAnimation(formula: {
    formula: string;
    steps: { description: string; result: string }[];
  }): Promise<Animation> {
    const animation: Animation = {
      id: `formula_animation_${Date.now()}`,
      type: "sequence",
      title: `Solving: ${formula.formula}`,
      frames: [],
      currentFrame: 0,
      playback: this.createPlayback(false),
      captions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Initial frame: Show formula
    animation.frames.push({
      frameNumber: 0,
      timestamp: 0,
      elements: [{
        id: "formula",
        type: "text",
        visible: true,
        opacity: 1,
        position: { x: 400, y: 100 },
        scale: 1,
        rotation: 0,
        text: formula.formula,
        fontSize: 24,
        color: "#1F2937"
      }],
      annotations: [],
      captions: ["Starting formula"]
    });

    // Step frames
    let time = 2;
    for (let i = 0; i < formula.steps.length; i++) {
      const step = formula.steps[i];
      animation.frames.push({
        frameNumber: i + 1,
        timestamp: time,
        elements: [{
          id: `step_${i}`,
          type: "text",
          visible: true,
          opacity: 1,
          position: { x: 400, y: 200 + i * 60 },
          scale: 1,
          rotation: 0,
          text: `${i + 1}. ${step.description}`,
          fontSize: 16,
          color: "#374151"
        }],
        annotations: [{
          type: "highlight",
          x: 400,
          y: 200 + i * 60,
          width: 400,
          height: 40,
          color: "#FEF3C7"
        }],
        captions: [step.result]
      });
      time += 3;
    }

    animation.duration = time;

    return animation;
  }

  private createFrame(partial: Partial<AnimationFrame> & { frameNumber: number; timestamp: number }): AnimationFrame {
    return {
      frameNumber: partial.frameNumber,
      timestamp: partial.timestamp,
      elements: partial.elements || [],
      annotations: partial.annotations || [],
      narration: partial.narration,
      captions: partial.captions || [],
      transition: partial.transition,
      ...partial
    };
  }

  private createElement(partial: Partial<AnimationElement> & { id: string; type: AnimationElement["type"]; visible: boolean; opacity: number; position: { x: number; y: number }; scale: number; rotation: number }): AnimationElement {
    return {
      id: partial.id,
      type: partial.type,
      visible: partial.visible,
      opacity: partial.opacity,
      position: partial.position,
      scale: partial.scale,
      rotation: partial.rotation,
      ...partial
    };
  }

  private createPlayback(loop: boolean): AnimationPlayback {
    return {
      playing: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      loop,
      autoplay: false,
      showControls: true,
      showProgress: true,
      muted: false,
      volume: 1
    };
  }
}
