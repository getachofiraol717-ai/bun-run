// @ts-nocheck
// Visual Learning Engine — useConceptMaps hook
// Hook for concept map management

import { useState, useCallback, useEffect } from "react";
import { ConceptMapGenerator } from "../core/ConceptMapGenerator";
import { LayoutEngine } from "../core/LayoutEngine";
import { RenderingEngine } from "../core/RenderingEngine";
import type { ConceptMap, ConceptMapNode, ConceptMapLink } from "../models/MindMap";

export interface UseConceptMapsOptions {
  autoSave?: boolean;
  saveInterval?: number;
}

export interface UseConceptMapsResult {
  // State
  loading: boolean;
  error: string | null;
  conceptMaps: ConceptMap[];
  currentConceptMap: ConceptMap | null;
  currentSvg: string | null;
  selectedNodeId: string | null;
  selectedLinkId: string | null;

  // Actions
  createConceptMap: (input: {
    title: string;
    concepts: { id: string; name: string; definition?: string }[];
    relationships: { source: string; target: string; label: string; type: string }[];
  }) => Promise<ConceptMap | null>;

  loadConceptMap: (id: string) => ConceptMap | null;
  deleteConceptMap: (id: string) => void;
  updateConceptMap: (conceptMap: ConceptMap) => void;

  // Node operations
  addConcept: (concept: Omit<ConceptMapNode, "links" | "linkLabels">) => void;
  updateConcept: (nodeId: string, updates: Partial<ConceptMapNode>) => void;
  deleteConcept: (nodeId: string) => void;

  // Link operations
  addRelationship: (link: Omit<ConceptMapLink, "id">) => void;
  updateRelationship: (linkId: string, updates: Partial<ConceptMapLink>) => void;
  deleteRelationship: (linkId: string) => void;

  // Selection
  selectConcept: (nodeId: string | null) => void;
  selectRelationship: (linkId: string | null) => void;

  // Rendering
  render: () => Promise<string | null>;

  // Layout
  changeLayout: (layout: "force" | "hierarchical" | "circular" | "grid") => void;
}

export function useConceptMaps(options?: UseConceptMapsOptions): UseConceptMapsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conceptMaps, setConceptMaps] = useState<ConceptMap[]>([]);
  const [currentConceptMap, setCurrentConceptMap] = useState<ConceptMap | null>(null);
  const [currentSvg, setCurrentSvg] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  const conceptMapGenerator = useState(() => new ConceptMapGenerator())[0];
  const layoutEngine = useState(() => new LayoutEngine())[0];
  const renderingEngine = useState(() => new RenderingEngine())[0];

  // Create concept map
  const createConceptMap = useCallback(async (input: {
    title: string;
    concepts: { id: string; name: string; definition?: string }[];
    relationships: { source: string; target: string; label: string; type: string }[];
  }): Promise<ConceptMap | null> => {
    setLoading(true);
    setError(null);

    try {
      const conceptMap = await conceptMapGenerator.generate(input);
      await layoutEngine.applyConceptMapLayout(conceptMap);
      const svg = await renderingEngine.renderConceptMapToSvg(conceptMap);

      setConceptMaps(prev => [...prev, conceptMap]);
      setCurrentConceptMap(conceptMap);
      setCurrentSvg(svg);

      return conceptMap;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create concept map");
      return null;
    } finally {
      setLoading(false);
    }
  }, [conceptMapGenerator, layoutEngine, renderingEngine]);

  // Load concept map from list
  const loadConceptMap = useCallback((id: string): ConceptMap | null => {
    const found = conceptMaps.find(cm => cm.id === id);
    if (found) {
      setCurrentConceptMap(found);
      return found;
    }
    return null;
  }, [conceptMaps]);

  // Delete concept map
  const deleteConceptMap = useCallback((id: string) => {
    setConceptMaps(prev => prev.filter(cm => cm.id !== id));
    if (currentConceptMap?.id === id) {
      setCurrentConceptMap(null);
      setCurrentSvg(null);
    }
  }, [currentConceptMap]);

  // Update concept map
  const updateConceptMap = useCallback((conceptMap: ConceptMap) => {
    setConceptMaps(prev => prev.map(cm => cm.id === conceptMap.id ? conceptMap : cm));
    if (currentConceptMap?.id === conceptMap.id) {
      setCurrentConceptMap(conceptMap);
    }
  }, [currentConceptMap]);

  // Add concept
  const addConcept = useCallback((concept: Omit<ConceptMapNode, "links" | "linkLabels">) => {
    if (!currentConceptMap) return;

    const newNode: ConceptMapNode = {
      ...concept,
      links: [],
      linkLabels: new Map()
    };

    const updatedNodes = new Map(currentConceptMap.nodes);
    updatedNodes.set(newNode.id, newNode);

    const updatedConceptMap = {
      ...currentConceptMap,
      nodes: updatedNodes,
      updatedAt: new Date()
    };

    updateConceptMap(updatedConceptMap);
  }, [currentConceptMap, updateConceptMap]);

  // Update concept
  const updateConcept = useCallback((nodeId: string, updates: Partial<ConceptMapNode>) => {
    if (!currentConceptMap) return;

    const node = currentConceptMap.nodes.get(nodeId);
    if (!node) return;

    const updatedNodes = new Map(currentConceptMap.nodes);
    updatedNodes.set(nodeId, { ...node, ...updates });

    const updatedConceptMap = {
      ...currentConceptMap,
      nodes: updatedNodes,
      updatedAt: new Date()
    };

    updateConceptMap(updatedConceptMap);
  }, [currentConceptMap, updateConceptMap]);

  // Delete concept
  const deleteConcept = useCallback((nodeId: string) => {
    if (!currentConceptMap) return;

    const updatedNodes = new Map(currentConceptMap.nodes);
    const updatedLinks = new Map(currentConceptMap.links);

    // Remove concept
    updatedNodes.delete(nodeId);

    // Remove related links
    for (const [linkId, link] of updatedLinks) {
      if (link.sourceId === nodeId || link.targetId === nodeId) {
        updatedLinks.delete(linkId);
      }
    }

    // Update connected concepts
    for (const [id, node] of updatedNodes) {
      if (node.links.includes(nodeId)) {
        node.links = node.links.filter(l => l !== nodeId);
        updatedNodes.set(id, node);
      }
    }

    const updatedConceptMap = {
      ...currentConceptMap,
      nodes: updatedNodes,
      links: updatedLinks,
      updatedAt: new Date()
    };

    updateConceptMap(updatedConceptMap);
  }, [currentConceptMap, updateConceptMap]);

  // Add relationship
  const addRelationship = useCallback((link: Omit<ConceptMapLink, "id">) => {
    if (!currentConceptMap) return;

    const newLink: ConceptMapLink = {
      ...link,
      id: `link-${Date.now()}`
    };

    const updatedLinks = new Map(currentConceptMap.links);
    updatedLinks.set(newLink.id, newLink);

    // Update connected concepts
    const updatedNodes = new Map(currentConceptMap.nodes);
    const sourceNode = updatedNodes.get(newLink.sourceId);
    const targetNode = updatedNodes.get(newLink.targetId);

    if (sourceNode) {
      sourceNode.links.push(newLink.targetId);
      sourceNode.linkLabels.set(newLink.targetId, newLink.label);
      updatedNodes.set(newLink.sourceId, sourceNode);
    }

    if (targetNode) {
      targetNode.links.push(newLink.sourceId);
      targetNode.linkLabels.set(newLink.sourceId, newLink.label);
      updatedNodes.set(newLink.targetId, targetNode);
    }

    const updatedConceptMap = {
      ...currentConceptMap,
      nodes: updatedNodes,
      links: updatedLinks,
      updatedAt: new Date()
    };

    updateConceptMap(updatedConceptMap);
  }, [currentConceptMap, updateConceptMap]);

  // Update relationship
  const updateRelationship = useCallback((linkId: string, updates: Partial<ConceptMapLink>) => {
    if (!currentConceptMap) return;

    const link = currentConceptMap.links.get(linkId);
    if (!link) return;

    const updatedLinks = new Map(currentConceptMap.links);
    updatedLinks.set(linkId, { ...link, ...updates });

    const updatedConceptMap = {
      ...currentConceptMap,
      links: updatedLinks,
      updatedAt: new Date()
    };

    updateConceptMap(updatedConceptMap);
  }, [currentConceptMap, updateConceptMap]);

  // Delete relationship
  const deleteRelationship = useCallback((linkId: string) => {
    if (!currentConceptMap) return;

    const link = currentConceptMap.links.get(linkId);
    if (!link) return;

    const updatedLinks = new Map(currentConceptMap.links);
    updatedLinks.delete(linkId);

    // Update connected concepts
    const updatedNodes = new Map(currentConceptMap.nodes);
    const sourceNode = updatedNodes.get(link.sourceId);
    const targetNode = updatedNodes.get(link.targetId);

    if (sourceNode) {
      sourceNode.links = sourceNode.links.filter(l => l !== link.targetId);
      sourceNode.linkLabels.delete(link.targetId);
      updatedNodes.set(link.sourceId, sourceNode);
    }

    if (targetNode) {
      targetNode.links = targetNode.links.filter(l => l !== link.sourceId);
      targetNode.linkLabels.delete(link.sourceId);
      updatedNodes.set(link.targetId, targetNode);
    }

    const updatedConceptMap = {
      ...currentConceptMap,
      nodes: updatedNodes,
      links: updatedLinks,
      updatedAt: new Date()
    };

    updateConceptMap(updatedConceptMap);
  }, [currentConceptMap, updateConceptMap]);

  // Select concept
  const selectConcept = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Select relationship
  const selectRelationship = useCallback((linkId: string | null) => {
    setSelectedLinkId(linkId);
  }, []);

  // Render current concept map
  const render = useCallback(async (): Promise<string | null> => {
    if (!currentConceptMap) return null;

    try {
      const svg = await renderingEngine.renderConceptMapToSvg(currentConceptMap);
      setCurrentSvg(svg);
      return svg;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render concept map");
      return null;
    }
  }, [currentConceptMap, renderingEngine]);

  // Change layout
  const changeLayout = useCallback((layout: "force" | "hierarchical" | "circular" | "grid") => {
    if (!currentConceptMap) return;

    const updatedConceptMap = {
      ...currentConceptMap,
      layout: { ...currentConceptMap.layout, type: layout },
      updatedAt: new Date()
    };

    updateConceptMap(updatedConceptMap);
  }, [currentConceptMap, updateConceptMap]);

  // Auto-save effect
  useEffect(() => {
    if (!options?.autoSave) return;

    const interval = setInterval(() => {
      if (currentConceptMap) {
        localStorage.setItem(`conceptmap-${currentConceptMap.id}`, JSON.stringify(currentConceptMap));
      }
    }, options.saveInterval || 5000);

    return () => clearInterval(interval);
  }, [currentConceptMap, options?.autoSave, options?.saveInterval]);

  return {
    loading,
    error,
    conceptMaps,
    currentConceptMap,
    currentSvg,
    selectedNodeId,
    selectedLinkId,
    createConceptMap,
    loadConceptMap,
    deleteConceptMap,
    updateConceptMap,
    addConcept,
    updateConcept,
    deleteConcept,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    selectConcept,
    selectRelationship,
    render,
    changeLayout
  };
}
