// Visual Learning Engine — visualLearningStore
// Zustand-like store for visual learning state management

import type { Diagram } from "../models/Diagram";
import type { MindMap } from "../models/MindMap";
import type { ConceptMap } from "../models/MindMap";
import type { Flowchart } from "../models/MindMap";
import type { Animation } from "../models/Animation";

export type VisualizationType = "diagram" | "mindmap" | "conceptmap" | "flowchart" | "animation";

export interface VisualLearningState {
  // Current visualization
  activeVisualizationType: VisualizationType | null;
  activeVisualizationId: string | null;

  // Diagrams
  diagrams: Diagram[];
  activeDiagram: Diagram | null;

  // Mind Maps
  mindMaps: MindMap[];
  activeMindMap: MindMap | null;
  mindMapSelectedNodeId: string | null;

  // Concept Maps
  conceptMaps: ConceptMap[];
  activeConceptMap: ConceptMap | null;
  conceptMapSelectedNodeId: string | null;
  conceptMapSelectedLinkId: string | null;

  // Flowcharts
  flowcharts: Flowchart[];
  activeFlowchart: Flowchart | null;
  flowchartSelectedNodeId: string | null;
  flowchartCurrentStep: number;

  // Animations
  animations: Animation[];
  activeAnimation: Animation | null;
  animationPlaying: boolean;
  animationCurrentFrame: number;
  animationPlaybackRate: number;
  animationLoop: boolean;

  // Rendered SVGs (cached)
  renderedSvgs: Map<string, string>;

  // Settings
  settings: VisualLearningSettings;

  // Loading/Error
  loading: boolean;
  error: string | null;
}

export interface VisualLearningSettings {
  autoSave: boolean;
  autoRender: boolean;
  defaultLayoutAlgorithm: "hierarchical" | "force" | "circular" | "grid";
  defaultColorScheme: string;
  accessibilityMode: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

const DEFAULT_SETTINGS: VisualLearningSettings = {
  autoSave: true,
  autoRender: true,
  defaultLayoutAlgorithm: "hierarchical",
  defaultColorScheme: "default",
  accessibilityMode: false,
  showGrid: false,
  snapToGrid: false,
  gridSize: 20
};

const initialState: VisualLearningState = {
  activeVisualizationType: null,
  activeVisualizationId: null,
  diagrams: [],
  activeDiagram: null,
  mindMaps: [],
  activeMindMap: null,
  mindMapSelectedNodeId: null,
  conceptMaps: [],
  activeConceptMap: null,
  conceptMapSelectedNodeId: null,
  conceptMapSelectedLinkId: null,
  flowcharts: [],
  activeFlowchart: null,
  flowchartSelectedNodeId: null,
  flowchartCurrentStep: 0,
  animations: [],
  activeAnimation: null,
  animationPlaying: false,
  animationCurrentFrame: 0,
  animationPlaybackRate: 1,
  animationLoop: false,
  renderedSvgs: new Map(),
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null
};

type StoreListener<T> = (state: T) => void;

class VisualLearningStore {
  private state: VisualLearningState;
  private listeners: Set<StoreListener<VisualLearningState>> = new Set();

  constructor() {
    this.state = this.loadState() || { ...initialState };
    this.state.renderedSvgs = new Map();
  }

  // Get current state
  getState(): VisualLearningState {
    return this.state;
  }

  // Subscribe to state changes
  subscribe(listener: StoreListener<VisualLearningState>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Load state from localStorage
  private loadState(): VisualLearningState | null {
    try {
      const saved = localStorage.getItem("visualLearningState");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          ...parsed,
          renderedSvgs: new Map()
        };
      }
    } catch (e) {
      console.error("Failed to load visual learning state:", e);
    }
    return null;
  }

  // Save state to localStorage
  private saveState(): void {
    if (!this.state.settings.autoSave) return;
    try {
      const { renderedSvgs, ...stateToSave } = this.state;
      localStorage.setItem("visualLearningState", JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save visual learning state:", e);
    }
  }

  // Set state
  private setState(updates: Partial<VisualLearningState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
    this.saveState();
  }

  // Actions - Diagrams
  setDiagrams(diagrams: Diagram[]): void {
    this.setState({ diagrams });
  }

  addDiagram(diagram: Diagram): void {
    this.setState({ diagrams: [...this.state.diagrams, diagram] });
  }

  updateDiagram(diagram: Diagram): void {
    this.setState({
      diagrams: this.state.diagrams.map(d => d.id === diagram.id ? diagram : d),
      activeDiagram: this.state.activeDiagram?.id === diagram.id ? diagram : this.state.activeDiagram
    });
  }

  deleteDiagram(id: string): void {
    this.setState({
      diagrams: this.state.diagrams.filter(d => d.id !== id),
      activeDiagram: this.state.activeDiagram?.id === id ? null : this.state.activeDiagram
    });
  }

  setActiveDiagram(diagram: Diagram | null): void {
    this.setState({
      activeDiagram: diagram,
      activeVisualizationType: diagram ? "diagram" : null,
      activeVisualizationId: diagram?.id || null
    });
  }

  // Actions - Mind Maps
  setMindMaps(mindMaps: MindMap[]): void {
    this.setState({ mindMaps });
  }

  addMindMap(mindMap: MindMap): void {
    this.setState({ mindMaps: [...this.state.mindMaps, mindMap] });
  }

  updateMindMap(mindMap: MindMap): void {
    this.setState({
      mindMaps: this.state.mindMaps.map(m => m.id === mindMap.id ? mindMap : m),
      activeMindMap: this.state.activeMindMap?.id === mindMap.id ? mindMap : this.state.activeMindMap
    });
  }

  deleteMindMap(id: string): void {
    this.setState({
      mindMaps: this.state.mindMaps.filter(m => m.id !== id),
      activeMindMap: this.state.activeMindMap?.id === id ? null : this.state.activeMindMap
    });
  }

  setActiveMindMap(mindMap: MindMap | null): void {
    this.setState({
      activeMindMap: mindMap,
      mindMapSelectedNodeId: null,
      activeVisualizationType: mindMap ? "mindmap" : null,
      activeVisualizationId: mindMap?.id || null
    });
  }

  setMindMapSelectedNode(nodeId: string | null): void {
    this.setState({ mindMapSelectedNodeId: nodeId });
  }

  // Actions - Concept Maps
  setConceptMaps(conceptMaps: ConceptMap[]): void {
    this.setState({ conceptMaps });
  }

  addConceptMap(conceptMap: ConceptMap): void {
    this.setState({ conceptMaps: [...this.state.conceptMaps, conceptMap] });
  }

  updateConceptMap(conceptMap: ConceptMap): void {
    this.setState({
      conceptMaps: this.state.conceptMaps.map(c => c.id === conceptMap.id ? conceptMap : c),
      activeConceptMap: this.state.activeConceptMap?.id === conceptMap.id ? conceptMap : this.state.activeConceptMap
    });
  }

  deleteConceptMap(id: string): void {
    this.setState({
      conceptMaps: this.state.conceptMaps.filter(c => c.id !== id),
      activeConceptMap: this.state.activeConceptMap?.id === id ? null : this.state.activeConceptMap
    });
  }

  setActiveConceptMap(conceptMap: ConceptMap | null): void {
    this.setState({
      activeConceptMap: conceptMap,
      conceptMapSelectedNodeId: null,
      conceptMapSelectedLinkId: null,
      activeVisualizationType: conceptMap ? "conceptmap" : null,
      activeVisualizationId: conceptMap?.id || null
    });
  }

  setConceptMapSelectedNode(nodeId: string | null): void {
    this.setState({ conceptMapSelectedNodeId: nodeId });
  }

  setConceptMapSelectedLink(linkId: string | null): void {
    this.setState({ conceptMapSelectedLinkId: linkId });
  }

  // Actions - Flowcharts
  setFlowcharts(flowcharts: Flowchart[]): void {
    this.setState({ flowcharts });
  }

  addFlowchart(flowchart: Flowchart): void {
    this.setState({ flowcharts: [...this.state.flowcharts, flowchart] });
  }

  updateFlowchart(flowchart: Flowchart): void {
    this.setState({
      flowcharts: this.state.flowcharts.map(f => f.id === flowchart.id ? flowchart : f),
      activeFlowchart: this.state.activeFlowchart?.id === flowchart.id ? flowchart : this.state.activeFlowchart
    });
  }

  deleteFlowchart(id: string): void {
    this.setState({
      flowcharts: this.state.flowcharts.filter(f => f.id !== id),
      activeFlowchart: this.state.activeFlowchart?.id === id ? null : this.state.activeFlowchart
    });
  }

  setActiveFlowchart(flowchart: Flowchart | null): void {
    this.setState({
      activeFlowchart: flowchart,
      flowchartSelectedNodeId: null,
      flowchartCurrentStep: 0,
      activeVisualizationType: flowchart ? "flowchart" : null,
      activeVisualizationId: flowchart?.id || null
    });
  }

  setFlowchartSelectedNode(nodeId: string | null): void {
    this.setState({ flowchartSelectedNodeId: nodeId });
  }

  setFlowchartCurrentStep(step: number): void {
    this.setState({ flowchartCurrentStep: step });
  }

  // Actions - Animations
  setAnimations(animations: Animation[]): void {
    this.setState({ animations });
  }

  addAnimation(animation: Animation): void {
    this.setState({ animations: [...this.state.animations, animation] });
  }

  updateAnimation(animation: Animation): void {
    this.setState({
      animations: this.state.animations.map(a => a.id === animation.id ? animation : a),
      activeAnimation: this.state.activeAnimation?.id === animation.id ? animation : this.state.activeAnimation
    });
  }

  deleteAnimation(id: string): void {
    this.setState({
      animations: this.state.animations.filter(a => a.id !== id),
      activeAnimation: this.state.activeAnimation?.id === id ? null : this.state.activeAnimation
    });
  }

  setActiveAnimation(animation: Animation | null): void {
    this.setState({
      activeAnimation: animation,
      animationCurrentFrame: 0,
      animationPlaying: false,
      activeVisualizationType: animation ? "animation" : null,
      activeVisualizationId: animation?.id || null
    });
  }

  setAnimationPlaying(playing: boolean): void {
    this.setState({ animationPlaying: playing });
  }

  setAnimationCurrentFrame(frame: number): void {
    this.setState({ animationCurrentFrame: frame });
  }

  setAnimationPlaybackRate(rate: number): void {
    this.setState({ animationPlaybackRate: rate });
  }

  setAnimationLoop(loop: boolean): void {
    this.setState({ animationLoop: loop });
  }

  // Actions - Rendered SVgs
  setRenderedSvg(id: string, svg: string): void {
    const newMap = new Map(this.state.renderedSvgs);
    newMap.set(id, svg);
    this.setState({ renderedSvgs: newMap });
  }

  getRenderedSvg(id: string): string | undefined {
    return this.state.renderedSvgs.get(id);
  }

  clearRenderedSvgs(): void {
    this.setState({ renderedSvgs: new Map() });
  }

  // Actions - Settings
  updateSettings(settings: Partial<VisualLearningSettings>): void {
    this.setState({ settings: { ...this.state.settings, ...settings } });
  }

  // Actions - Loading/Error
  setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  setError(error: string | null): void {
    this.setState({ error });
  }

  clearError(): void {
    this.setState({ error: null });
  }

  // Actions - Active visualization
  setActiveVisualization(type: VisualizationType | null, id: string | null): void {
    this.setState({
      activeVisualizationType: type,
      activeVisualizationId: id
    });
  }

  // Reset state
  reset(): void {
    this.state = { ...initialState, renderedSvgs: new Map() };
    this.notifyListeners();
    localStorage.removeItem("visualLearningState");
  }

  // Get statistics
  getStats(): {
    diagramCount: number;
    mindMapCount: number;
    conceptMapCount: number;
    flowchartCount: number;
    animationCount: number;
  } {
    return {
      diagramCount: this.state.diagrams.length,
      mindMapCount: this.state.mindMaps.length,
      conceptMapCount: this.state.conceptMaps.length,
      flowchartCount: this.state.flowcharts.length,
      animationCount: this.state.animations.length
    };
  }
}

// Export singleton instance
export const visualLearningStore = new VisualLearningStore();

// Export hooks
export function useVisualLearningStore(): VisualLearningState {
  return visualLearningStore.getState();
}

export function useVisualLearningStoreWithActions() {
  const store = visualLearningStore;

  return {
    ...store,
    useStore: () => store.getState(),
    subscribe: store.subscribe.bind(store)
  };
}
