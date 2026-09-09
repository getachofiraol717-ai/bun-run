// @ts-nocheck
// Visual Learning Engine — useFlowcharts hook
// Hook for flowchart management

import { useState, useCallback, useEffect } from "react";
import { FlowchartGenerator } from "../core/FlowchartGenerator";
import { LayoutEngine } from "../core/LayoutEngine";
import { RenderingEngine } from "../core/RenderingEngine";
import type { Flowchart, FlowchartNode, FlowchartLink } from "../models/MindMap";

export interface UseFlowchartsOptions {
  autoSave?: boolean;
  saveInterval?: number;
}

export interface UseFlowchartsResult {
  // State
  loading: boolean;
  error: string | null;
  flowcharts: Flowchart[];
  currentFlowchart: Flowchart | null;
  currentSvg: string | null;
  selectedNodeId: string | null;
  currentStepIndex: number;

  // Actions
  createFlowchart: (input: {
    title: string;
    steps: { id: string; label: string; type: string; next?: string; yes?: string; no?: string }[];
  }) => Promise<Flowchart | null>;

  loadFlowchart: (id: string) => Flowchart | null;
  deleteFlowchart: (id: string) => void;
  updateFlowchart: (flowchart: Flowchart) => void;

  // Node operations
  addStep: (step: Omit<FlowchartNode, "id">) => void;
  updateStep: (nodeId: string, updates: Partial<FlowchartNode>) => void;
  deleteStep: (nodeId: string) => void;

  // Navigation
  selectStep: (nodeId: string | null) => void;
  goToStep: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Rendering
  render: () => Promise<string | null>;
}

export function useFlowcharts(options?: UseFlowchartsOptions): UseFlowchartsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowcharts, setFlowcharts] = useState<Flowchart[]>([]);
  const [currentFlowchart, setCurrentFlowchart] = useState<Flowchart | null>(null);
  const [currentSvg, setCurrentSvg] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const flowchartGenerator = useState(() => new FlowchartGenerator())[0];
  const layoutEngine = useState(() => new LayoutEngine())[0];
  const renderingEngine = useState(() => new RenderingEngine())[0];

  // Create flowchart
  const createFlowchart = useCallback(async (input: {
    title: string;
    steps: { id: string; label: string; type: string; next?: string; yes?: string; no?: string }[];
  }): Promise<Flowchart | null> => {
    setLoading(true);
    setError(null);

    try {
      const flowchart = await flowchartGenerator.generate(input);
      await layoutEngine.applyFlowchartLayout(flowchart);
      const svg = await renderingEngine.renderFlowchartToSvg(flowchart);

      setFlowcharts(prev => [...prev, flowchart]);
      setCurrentFlowchart(flowchart);
      setCurrentSvg(svg);
      setCurrentStepIndex(0);

      return flowchart;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flowchart");
      return null;
    } finally {
      setLoading(false);
    }
  }, [flowchartGenerator, layoutEngine, renderingEngine]);

  // Load flowchart from list
  const loadFlowchart = useCallback((id: string): Flowchart | null => {
    const found = flowcharts.find(f => f.id === id);
    if (found) {
      setCurrentFlowchart(found);
      setCurrentStepIndex(0);
      return found;
    }
    return null;
  }, [flowcharts]);

  // Delete flowchart
  const deleteFlowchart = useCallback((id: string) => {
    setFlowcharts(prev => prev.filter(f => f.id !== id));
    if (currentFlowchart?.id === id) {
      setCurrentFlowchart(null);
      setCurrentSvg(null);
    }
  }, [currentFlowchart]);

  // Update flowchart
  const updateFlowchart = useCallback((flowchart: Flowchart) => {
    setFlowcharts(prev => prev.map(f => f.id === flowchart.id ? flowchart : f));
    if (currentFlowchart?.id === flowchart.id) {
      setCurrentFlowchart(flowchart);
    }
  }, [currentFlowchart]);

  // Add step
  const addStep = useCallback((step: Omit<FlowchartNode, "id">) => {
    if (!currentFlowchart) return;

    const newNode: FlowchartNode = {
      ...step,
      id: `step-${Date.now()}`
    };

    const updatedNodes = new Map(currentFlowchart.nodes);
    updatedNodes.set(newNode.id, newNode);

    // Add step to steps array
    const updatedSteps = [
      ...currentFlowchart.steps,
      {
        stepNumber: currentFlowchart.steps.length + 1,
        nodeId: newNode.id,
        instruction: newNode.label,
        expectedOutcome: newNode.description
      }
    ];

    const updatedFlowchart = {
      ...currentFlowchart,
      nodes: updatedNodes,
      steps: updatedSteps,
      updatedAt: new Date()
    };

    updateFlowchart(updatedFlowchart);
  }, [currentFlowchart, updateFlowchart]);

  // Update step
  const updateStep = useCallback((nodeId: string, updates: Partial<FlowchartNode>) => {
    if (!currentFlowchart) return;

    const node = currentFlowchart.nodes.get(nodeId);
    if (!node) return;

    const updatedNodes = new Map(currentFlowchart.nodes);
    updatedNodes.set(nodeId, { ...node, ...updates });

    // Update steps array
    const updatedSteps = currentFlowchart.steps.map(step => {
      if (step.nodeId === nodeId) {
        return {
          ...step,
          instruction: updates.label || step.instruction,
          expectedOutcome: updates.description || step.expectedOutcome
        };
      }
      return step;
    });

    const updatedFlowchart = {
      ...currentFlowchart,
      nodes: updatedNodes,
      steps: updatedSteps,
      updatedAt: new Date()
    };

    updateFlowchart(updatedFlowchart);
  }, [currentFlowchart, updateFlowchart]);

  // Delete step
  const deleteStep = useCallback((nodeId: string) => {
    if (!currentFlowchart) return;

    const updatedNodes = new Map(currentFlowchart.nodes);
    const updatedLinks = new Map(currentFlowchart.links);

    // Remove node
    updatedNodes.delete(nodeId);

    // Remove related links
    for (const [linkId, link] of updatedLinks) {
      if (link.sourceId === nodeId || link.targetId === nodeId) {
        updatedLinks.delete(linkId);
      }
    }

    // Update steps array
    const updatedSteps = currentFlowchart.steps
      .filter(step => step.nodeId !== nodeId)
      .map((step, index) => ({
        ...step,
        stepNumber: index + 1
      }));

    // Update next/previous IDs in remaining nodes
    for (const [id, node] of updatedNodes) {
      if (node.nextIds.includes(nodeId)) {
        node.nextIds = node.nextIds.filter(nId => nId !== nodeId);
        updatedNodes.set(id, node);
      }
      if (node.previousIds.includes(nodeId)) {
        node.previousIds = node.previousIds.filter(nId => nId !== nodeId);
        updatedNodes.set(id, node);
      }
    }

    const updatedFlowchart = {
      ...currentFlowchart,
      nodes: updatedNodes,
      links: updatedLinks,
      steps: updatedSteps,
      updatedAt: new Date()
    };

    updateFlowchart(updatedFlowchart);
  }, [currentFlowchart, updateFlowchart]);

  // Select step
  const selectStep = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Go to step
  const goToStep = useCallback((index: number) => {
    if (!currentFlowchart) return;
    if (index >= 0 && index < currentFlowchart.steps.length) {
      setCurrentStepIndex(index);
    }
  }, [currentFlowchart]);

  // Next step
  const nextStep = useCallback(() => {
    if (!currentFlowchart) return;
    if (currentStepIndex < currentFlowchart.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentFlowchart, currentStepIndex]);

  // Previous step
  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  // Render current flowchart
  const render = useCallback(async (): Promise<string | null> => {
    if (!currentFlowchart) return null;

    try {
      const svg = await renderingEngine.renderFlowchartToSvg(currentFlowchart);
      setCurrentSvg(svg);
      return svg;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render flowchart");
      return null;
    }
  }, [currentFlowchart, renderingEngine]);

  // Auto-save effect
  useEffect(() => {
    if (!options?.autoSave) return;

    const interval = setInterval(() => {
      if (currentFlowchart) {
        localStorage.setItem(`flowchart-${currentFlowchart.id}`, JSON.stringify(currentFlowchart));
      }
    }, options.saveInterval || 5000);

    return () => clearInterval(interval);
  }, [currentFlowchart, options?.autoSave, options?.saveInterval]);

  return {
    loading,
    error,
    flowcharts,
    currentFlowchart,
    currentSvg,
    selectedNodeId,
    currentStepIndex,
    createFlowchart,
    loadFlowchart,
    deleteFlowchart,
    updateFlowchart,
    addStep,
    updateStep,
    deleteStep,
    selectStep,
    goToStep,
    nextStep,
    previousStep,
    render
  };
}
