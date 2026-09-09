// Visual Learning Engine — useMindMaps hook
// Hook for mind map management

import { useState, useCallback, useEffect } from "react";
import { MindMapGenerator } from "../core/MindMapGenerator";
import { LayoutEngine } from "../core/LayoutEngine";
import { RenderingEngine } from "../core/RenderingEngine";
import type { MindMap, MindMapNode } from "../models/MindMap";

export interface UseMindMapsOptions {
  autoSave?: boolean;
  saveInterval?: number;
}

export interface UseMindMapsResult {
  // State
  loading: boolean;
  error: string | null;
  mindMaps: MindMap[];
  currentMindMap: MindMap | null;
  currentSvg: string | null;
  selectedNodeId: string | null;

  // Actions
  createMindMap: (input: {
    title: string;
    centralConcept: string;
    concepts: { name: string; children?: string[]; details?: string }[];
  }) => Promise<MindMap | null>;

  loadMindMap: (id: string) => MindMap | null;
  deleteMindMap: (id: string) => void;
  updateMindMap: (mindMap: MindMap) => void;

  // Node operations
  addNode: (parentId: string, text: string) => void;
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => void;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, x: number, y: number) => void;
  collapseNode: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;

  // Selection
  selectNode: (nodeId: string | null) => void;

  // Rendering
  render: () => Promise<string | null>;

  // Layout
  changeLayout: (layout: "radial" | "tree" | "horizontal" | "vertical") => void;
}

export function useMindMaps(options?: UseMindMapsOptions): UseMindMapsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [currentMindMap, setCurrentMindMap] = useState<MindMap | null>(null);
  const [currentSvg, setCurrentSvg] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const mindMapGenerator = useState(() => new MindMapGenerator())[0];
  const layoutEngine = useState(() => new LayoutEngine())[0];
  const renderingEngine = useState(() => new RenderingEngine())[0];

  // Create mind map
  const createMindMap = useCallback(async (input: {
    title: string;
    centralConcept: string;
    concepts: { name: string; children?: string[]; details?: string }[];
  }): Promise<MindMap | null> => {
    setLoading(true);
    setError(null);

    try {
      const mindMap = await mindMapGenerator.generate(input);
      await layoutEngine.applyMindMapLayout(mindMap);
      const svg = await renderingEngine.renderMindMapToSvg(mindMap);

      setMindMaps(prev => [...prev, mindMap]);
      setCurrentMindMap(mindMap);
      setCurrentSvg(svg);

      return mindMap;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create mind map");
      return null;
    } finally {
      setLoading(false);
    }
  }, [mindMapGenerator, layoutEngine, renderingEngine]);

  // Load mind map from list
  const loadMindMap = useCallback((id: string): MindMap | null => {
    const found = mindMaps.find(mm => mm.id === id);
    if (found) {
      setCurrentMindMap(found);
      return found;
    }
    return null;
  }, [mindMaps]);

  // Delete mind map
  const deleteMindMap = useCallback((id: string) => {
    setMindMaps(prev => prev.filter(mm => mm.id !== id));
    if (currentMindMap?.id === id) {
      setCurrentMindMap(null);
      setCurrentSvg(null);
    }
  }, [currentMindMap]);

  // Update mind map
  const updateMindMap = useCallback((mindMap: MindMap) => {
    setMindMaps(prev => prev.map(mm => mm.id === mindMap.id ? mindMap : mm));
    if (currentMindMap?.id === mindMap.id) {
      setCurrentMindMap(mindMap);
    }
  }, [currentMindMap]);

  // Add node
  const addNode = useCallback((parentId: string, text: string) => {
    if (!currentMindMap) return;

    const parent = currentMindMap.nodes.get(parentId);
    if (!parent) return;

    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      text,
      type: "leaf",
      x: parent.x + 100,
      y: parent.y,
      width: 120,
      height: 40,
      depth: parent.depth + 1,
      angle: 0,
      radius: 0,
      parentId,
      childIds: []
    };

    const updatedNodes = new Map(currentMindMap.nodes);
    updatedNodes.set(newNode.id, newNode);
    parent.childIds.push(newNode.id);
    updatedNodes.set(parentId, parent);

    const updatedMindMap = {
      ...currentMindMap,
      nodes: updatedNodes,
      updatedAt: new Date()
    };

    updateMindMap(updatedMindMap);
  }, [currentMindMap, updateMindMap]);

  // Update node
  const updateNode = useCallback((nodeId: string, updates: Partial<MindMapNode>) => {
    if (!currentMindMap) return;

    const node = currentMindMap.nodes.get(nodeId);
    if (!node) return;

    const updatedNodes = new Map(currentMindMap.nodes);
    updatedNodes.set(nodeId, { ...node, ...updates });

    const updatedMindMap = {
      ...currentMindMap,
      nodes: updatedNodes,
      updatedAt: new Date()
    };

    updateMindMap(updatedMindMap);
  }, [currentMindMap, updateMindMap]);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    if (!currentMindMap) return;

    const node = currentMindMap.nodes.get(nodeId);
    if (!node) return;

    const updatedNodes = new Map(currentMindMap.nodes);

    // Remove from parent's children
    if (node.parentId) {
      const parent = updatedNodes.get(node.parentId);
      if (parent) {
        parent.childIds = parent.childIds.filter(id => id !== nodeId);
        updatedNodes.set(node.parentId, parent);
      }
    }

    // Delete all descendants
    const toDelete = [nodeId];
    const findDescendants = (id: string) => {
      const n = updatedNodes.get(id);
      if (n) {
        n.childIds.forEach(childId => {
          toDelete.push(childId);
          findDescendants(childId);
        });
      }
    };
    findDescendants(nodeId);

    toDelete.forEach(id => updatedNodes.delete(id));

    const updatedMindMap = {
      ...currentMindMap,
      nodes: updatedNodes,
      updatedAt: new Date()
    };

    updateMindMap(updatedMindMap);
  }, [currentMindMap, updateMindMap]);

  // Move node
  const moveNode = useCallback((nodeId: string, x: number, y: number) => {
    updateNode(nodeId, { x, y });
  }, [updateNode]);

  // Collapse node
  const collapseNode = useCallback((nodeId: string) => {
    updateNode(nodeId, { collapsed: true });
  }, [updateNode]);

  // Expand node
  const expandNode = useCallback((nodeId: string) => {
    updateNode(nodeId, { collapsed: false });
  }, [updateNode]);

  // Select node
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Render current mind map
  const render = useCallback(async (): Promise<string | null> => {
    if (!currentMindMap) return null;

    try {
      const svg = await renderingEngine.renderMindMapToSvg(currentMindMap);
      setCurrentSvg(svg);
      return svg;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render mind map");
      return null;
    }
  }, [currentMindMap, renderingEngine]);

  // Change layout
  const changeLayout = useCallback((layout: "radial" | "tree" | "horizontal" | "vertical") => {
    if (!currentMindMap) return;

    const updatedMindMap = {
      ...currentMindMap,
      layout: { ...currentMindMap.layout, type: layout },
      updatedAt: new Date()
    };

    updateMindMap(updatedMindMap);
  }, [currentMindMap, updateMindMap]);

  // Auto-save effect
  useEffect(() => {
    if (!options?.autoSave) return;

    const interval = setInterval(() => {
      if (currentMindMap) {
        localStorage.setItem(`mindmap-${currentMindMap.id}`, JSON.stringify(currentMindMap));
      }
    }, options.saveInterval || 5000);

    return () => clearInterval(interval);
  }, [currentMindMap, options?.autoSave, options?.saveInterval]);

  return {
    loading,
    error,
    mindMaps,
    currentMindMap,
    currentSvg,
    selectedNodeId,
    createMindMap,
    loadMindMap,
    deleteMindMap,
    updateMindMap,
    addNode,
    updateNode,
    deleteNode,
    moveNode,
    collapseNode,
    expandNode,
    selectNode,
    render,
    changeLayout
  };
}
