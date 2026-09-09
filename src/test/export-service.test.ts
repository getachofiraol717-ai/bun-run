import { describe, it, expect } from 'vitest';
import { ExportService, exportService } from '@/plugins/margeos/visual-learning-engine/services/ExportService';
import type { Diagram } from '@/plugins/margeos/visual-learning-engine/models/Diagram';
import type { MindMap, ConceptMap, Flowchart } from '@/plugins/margeos/visual-learning-engine/models/MindMap';
import type { Animation } from '@/plugins/margeos/visual-learning-engine/models/Animation';

describe('KU PHASE 9 — Export Service & Format Verification', () => {
  const sampleDiagram: Diagram = {
    id: 'diag-1',
    type: 'process',
    title: 'Photosynthesis Cycle',
    description: 'Light and dark reactions in chloroplasts',
    ariaLabel: 'Photosynthesis Diagram',
    altText: 'Diagram of photosynthesis process',
    width: 800,
    height: 600,
    sourceIds: ['src-1'],
    conceptIds: ['concept-1'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    style: {
      backgroundColor: '#0f172a',
      fontFamily: 'sans-serif',
      fontSize: 14,
      colorScheme: {
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#f59e0b',
        background: '#0f172a',
        text: '#ffffff',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        nodes: ['#3b82f6', '#10b981'],
      },
      nodeStyle: { borderRadius: 8, borderWidth: 2, shadow: false, padding: 8, minWidth: 80, maxWidth: 200 },
      edgeStyle: { strokeWidth: 2, strokeStyle: 'solid', arrowHead: 'arrow', labelPosition: 0.5 },
    },
    nodes: [
      { id: 'node-1', x: 200, y: 300, width: 120, height: 60, label: 'Light Reactions', type: 'process', color: '#3b82f6' },
      { id: 'node-2', x: 500, y: 300, width: 120, height: 60, label: 'Calvin Cycle', type: 'process', color: '#10b981' },
    ],
    edges: [
      { id: 'edge-1', sourceId: 'node-1', targetId: 'node-2', type: 'direct', label: 'ATP + NADPH' },
    ],
  };

  const sampleMindMap: MindMap = {
    id: 'mind-1',
    title: 'Cell Biology',
    description: 'Structure and organelles of plant and animal cells',
    ariaLabel: 'Cell Biology Mind Map',
    rootId: 'root-1',
    layout: {
      type: 'radial',
      spacing: { levelGap: 100, siblingGap: 50, nodeWidth: 140, nodeHeight: 70 },
    },
    centerX: 400,
    centerY: 300,
    radiusStep: 150,
    angleSpread: Math.PI * 2,
    rootText: 'Cell',
    branchCount: 1,
    maxDepth: 1,
    sourceIds: ['src-1'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    style: {
      backgroundColor: '#0f172a',
      fontFamily: 'sans-serif',
      fontSize: 14,
      rootColor: '#8b5cf6',
      branchColors: ['#3b82f6', '#10b981'],
      leafColor: '#f59e0b',
      lineColor: '#94a3b8',
      lineWidth: 2,
      borderRadius: 8,
      padding: 8,
    },
    nodes: new Map([
      ['root-1', { id: 'root-1', x: 400, y: 300, width: 140, height: 70, text: 'Cell', type: 'root', depth: 0, angle: 0, radius: 0, childIds: ['branch-1'] }],
      ['branch-1', { id: 'branch-1', parentId: 'root-1', x: 600, y: 300, width: 120, height: 50, text: 'Nucleus', type: 'branch', depth: 1, angle: 0, radius: 150, childIds: [] }],
    ]),
  };

  const sampleConceptMap: ConceptMap = {
    id: 'concept-1',
    title: 'Thermodynamics Concepts',
    description: 'Laws of energy and entropy',
    ariaLabel: 'Thermodynamics Concept Map',
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    layout: { type: 'force', spacing: 100, clustering: false },
    sourceIds: ['src-1'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    style: {
      backgroundColor: '#0f172a',
      fontFamily: 'sans-serif',
      fontSize: 14,
      nodeBackgroundColor: '#1e293b',
      nodeBorderColor: '#38bdf8',
      linkColor: '#94a3b8',
      linkWidth: 2,
      showLabels: true,
      showArrows: true,
    },
    nodes: new Map([
      ['c1', { id: 'c1', x: 250, y: 300, width: 140, height: 60, concept: 'Energy', shape: 'rectangle', color: '#38bdf8', borderColor: '#0284c7', links: ['c2'], linkLabels: new Map([['c2', 'transforms into']]) }],
      ['c2', { id: 'c2', x: 550, y: 300, width: 140, height: 60, concept: 'Work', shape: 'rectangle', color: '#4ade80', borderColor: '#16a34a', links: [], linkLabels: new Map() }],
    ]),
    links: new Map([
      ['l1', { id: 'l1', sourceId: 'c1', targetId: 'c2', label: 'transforms into', relationshipType: 'causes', color: '#94a3b8', strength: 1, lineStyle: 'solid', arrowHead: true }],
    ]),
  };

  const sampleFlowchart: Flowchart = {
    id: 'flow-1',
    title: 'Scientific Method',
    description: 'Hypothesis testing cycle',
    ariaLabel: 'Scientific Method Flowchart',
    bounds: { x: 0, y: 0, width: 600, height: 800 },
    startNodeId: 'step-1',
    endNodeIds: ['step-2'],
    sourceIds: ['src-1'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    style: {
      backgroundColor: '#0f172a',
      fontFamily: 'sans-serif',
      fontSize: 14,
      linkColor: '#94a3b8',
      nodeColor: '#6366f1',
      decisionColor: '#f59e0b',
      startColor: '#10b981',
      endColor: '#ef4444',
    },
    nodes: new Map([
      ['step-1', { id: 'step-1', x: 300, y: 150, width: 160, height: 50, label: 'Form Hypothesis', type: 'start', shape: 'rectangle', color: '#6366f1', nextIds: ['step-2'], previousIds: [] }],
      ['step-2', { id: 'step-2', x: 300, y: 300, width: 160, height: 50, label: 'Experiment', type: 'end', shape: 'rectangle', color: '#10b981', nextIds: [], previousIds: ['step-1'] }],
    ]),
    links: new Map([
      ['fl-1', { id: 'fl-1', sourceId: 'step-1', targetId: 'step-2', type: 'straight', color: '#94a3b8', lineStyle: 'solid' }],
    ]),
    steps: [
      { stepNumber: 1, nodeId: 'step-1', instruction: 'Formulate a falsifiable test hypothesis', expectedOutcome: 'Clear test conditions' },
      { stepNumber: 2, nodeId: 'step-2', instruction: 'Conduct controlled experiment', expectedOutcome: 'Reproducible dataset' },
    ],
  };

  const sampleAnimation: Animation = {
    id: 'anim-1',
    type: 'process',
    title: 'Wave Propagation',
    description: 'Harmonic oscillation across space',
    currentFrame: 0,
    playback: {
      playing: false,
      currentTime: 0,
      duration: 200,
      playbackRate: 1,
      loop: false,
      autoplay: false,
      showControls: true,
      showProgress: true,
      muted: false,
      volume: 1,
    },
    sourceIds: ['src-1'],
    captions: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    frames: [
      { frameNumber: 0, timestamp: 0, elements: [], annotations: [], captions: [] },
      { frameNumber: 1, timestamp: 100, elements: [], annotations: [], captions: [] },
    ],
    duration: 200,
  };

  const service = new ExportService();

  async function readBlobText(blob: Blob): Promise<string> {
    if (typeof (blob as any).text === 'function') {
      return await (blob as any).text();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(blob);
    });
  }

  describe('1. Supported Formats Advertised', () => {
    it('returns all promised export formats truthfully', () => {
      const formats = service.getSupportedFormats();
      expect(formats).toEqual(['svg', 'png', 'jpg', 'webp', 'json', 'html', 'markdown']);
    });
  });

  describe('2. Diagram Export Across All Formats', () => {
    it('exports Diagram to JSON Blob with valid payload', async () => {
      const result = await service.exportDiagram(sampleDiagram, { format: 'json' });
      expect(result).toBeInstanceOf(Blob);
      const text = await readBlobText(result as Blob);
      const parsed = JSON.parse(text);
      expect(parsed.type).toBe('diagram');
      expect(parsed.metadata.title).toBe(sampleDiagram.title);
      expect(parsed.data.nodes).toHaveLength(2);
    });

    it('exports Diagram to HTML with valid HTML and embedded SVG markup', async () => {
      const result = await service.exportDiagram(sampleDiagram, { format: 'html' });
      expect(typeof result).toBe('string');
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<title>Photosynthesis Cycle</title>');
      expect(result).toContain('<svg');
      expect(result).toContain('Photosynthesis Diagram');
      expect(result).toContain('Light Reactions');
    });

    it('exports Diagram to Markdown with title, nodes, and edges', async () => {
      const result = await service.exportDiagram(sampleDiagram, { format: 'markdown' });
      expect(typeof result).toBe('string');
      expect(result).toContain('# Photosynthesis Cycle');
      expect(result).toContain('**Light Reactions**');
      expect(result).toContain('Light Reactions -> Calvin Cycle (ATP + NADPH)');
    });

    it('exports Diagram to SVG image Blob without throwing "not implemented"', async () => {
      const result = await service.exportDiagram(sampleDiagram, { format: 'svg' });
      expect(result).toBeInstanceOf(Blob);
      expect((result as Blob).type).toContain('image/svg+xml');
      const text = await readBlobText(result as Blob);
      expect(text).toContain('<svg');
      expect(text).toContain('Photosynthesis Diagram');
    });

    it('exports Diagram to PNG, JPG, and WEBP image Blobs without throwing errors', async () => {
      for (const format of ['png', 'jpg', 'webp'] as const) {
        const result = await service.exportDiagram(sampleDiagram, { format });
        expect(result).toBeInstanceOf(Blob);
        expect((result as Blob).size).toBeGreaterThan(0);
        const expectedMime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
        expect((result as Blob).type).toBe(expectedMime);
      }
    });
  });

  describe('3. MindMap Export Across All Formats', () => {
    it('exports MindMap to JSON, HTML, Markdown, and Images (SVG, PNG, JPG, WEBP)', async () => {
      const jsonRes = await service.exportMindMap(sampleMindMap, { format: 'json' });
      expect(jsonRes).toBeInstanceOf(Blob);

      const htmlRes = await service.exportMindMap(sampleMindMap, { format: 'html' });
      expect(htmlRes).toContain('Cell Biology');
      expect(htmlRes).toContain('<svg');

      const mdRes = await service.exportMindMap(sampleMindMap, { format: 'markdown' });
      expect(mdRes).toContain('# Cell Biology');
      expect(mdRes).toContain('- Cell');
      expect(mdRes).toContain('- Nucleus');

      const svgRes = await service.exportMindMap(sampleMindMap, { format: 'svg' });
      expect(svgRes).toBeInstanceOf(Blob);

      const pngRes = await service.exportMindMap(sampleMindMap, { format: 'png' });
      expect(pngRes).toBeInstanceOf(Blob);
    });
  });

  describe('4. ConceptMap & Flowchart Export Across Formats', () => {
    it('exports ConceptMap to HTML with SVG and Markdown', async () => {
      const htmlRes = await service.exportConceptMap(sampleConceptMap, { format: 'html' });
      expect(htmlRes).toContain('Thermodynamics Concepts');
      expect(htmlRes).toContain('<svg');

      const mdRes = await service.exportConceptMap(sampleConceptMap, { format: 'markdown' });
      expect(mdRes).toContain('Energy');
      expect(mdRes).toContain('transforms into');

      const imgRes = await service.exportConceptMap(sampleConceptMap, { format: 'png' });
      expect(imgRes).toBeInstanceOf(Blob);
    });

    it('exports Flowchart to HTML with SVG, Markdown, and Images', async () => {
      const htmlRes = await service.exportFlowchart(sampleFlowchart, { format: 'html' });
      expect(htmlRes).toContain('Scientific Method');
      expect(htmlRes).toContain('<svg');

      const mdRes = await service.exportFlowchart(sampleFlowchart, { format: 'markdown' });
      expect(mdRes).toContain('Formulate a falsifiable test hypothesis');

      const webpRes = await service.exportFlowchart(sampleFlowchart, { format: 'webp' });
      expect(webpRes).toBeInstanceOf(Blob);
    });
  });

  describe('5. Animation Export', () => {
    it('exports Animation to JSON and HTML', async () => {
      const jsonRes = await service.exportAnimation(sampleAnimation, { format: 'json' });
      expect(jsonRes).toBeInstanceOf(Blob);

      const htmlRes = await service.exportAnimation(sampleAnimation, { format: 'html' });
      expect(htmlRes).toContain('Wave Propagation');
      expect(htmlRes).toContain('2 frames');
    });
  });
});
