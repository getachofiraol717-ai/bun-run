import { describe, it, expect } from 'vitest';
import { ExportService, exportService } from '@/plugins/margeos/visual-learning-engine/services/ExportService';
import type { Diagram } from '@/plugins/margeos/visual-learning-engine/models/Diagram';
import type { MindMap, ConceptMap, Flowchart } from '@/plugins/margeos/visual-learning-engine/models/MindMap';
import type { Animation } from '@/plugins/margeos/visual-learning-engine/models/Animation';

describe('KU PHASE 9 — Export Service & Format Verification', () => {
  const sampleDiagram: Diagram = {
    id: 'diag-1',
    title: 'Photosynthesis Cycle',
    description: 'Light and dark reactions in chloroplasts',
    ariaLabel: 'Photosynthesis Diagram',
    width: 800,
    height: 600,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    style: {
      backgroundColor: '#0f172a',
      fontFamily: 'sans-serif',
      fontSize: 14,
      text: '#ffffff',
      nodeStyle: { borderRadius: 8, borderWidth: 2 },
      colorScheme: { nodes: ['#3b82f6', '#10b981'] },
    },
    nodes: [
      { id: 'node-1', x: 200, y: 300, width: 120, height: 60, label: 'Light Reactions', type: 'process', color: '#3b82f6' },
      { id: 'node-2', x: 500, y: 300, width: 120, height: 60, label: 'Calvin Cycle', type: 'process', color: '#10b981' },
    ],
    edges: [
      { id: 'edge-1', sourceId: 'node-1', targetId: 'node-2', type: 'straight', label: 'ATP + NADPH' },
    ],
  };

  const sampleMindMap: MindMap = {
    id: 'mind-1',
    title: 'Cell Biology',
    description: 'Structure and organelles of plant and animal cells',
    ariaLabel: 'Cell Biology Mind Map',
    rootId: 'root-1',
    width: 800,
    height: 600,
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
    },
    nodes: new Map([
      ['root-1', { id: 'root-1', x: 400, y: 300, width: 140, height: 70, text: 'Cell', type: 'root', depth: 0, childrenIds: ['branch-1'] }],
      ['branch-1', { id: 'branch-1', parentId: 'root-1', x: 600, y: 300, width: 120, height: 50, text: 'Nucleus', type: 'branch', depth: 1, childrenIds: [] }],
    ]),
  };

  const sampleConceptMap: ConceptMap = {
    id: 'concept-1',
    title: 'Thermodynamics Concepts',
    description: 'Laws of energy and entropy',
    ariaLabel: 'Thermodynamics Concept Map',
    bounds: { width: 800, height: 600 },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    style: {
      backgroundColor: '#0f172a',
      fontFamily: 'sans-serif',
      fontSize: 14,
    },
    nodes: new Map([
      ['c1', { id: 'c1', x: 250, y: 300, width: 140, height: 60, concept: 'Energy', shape: 'rect', color: '#38bdf8', borderColor: '#0284c7' }],
      ['c2', { id: 'c2', x: 550, y: 300, width: 140, height: 60, concept: 'Work', shape: 'rect', color: '#4ade80', borderColor: '#16a34a' }],
    ]),
    links: new Map([
      ['l1', { id: 'l1', sourceId: 'c1', targetId: 'c2', label: 'transforms into', color: '#94a3b8', strength: 1, lineStyle: 'solid' }],
    ]),
  };

  const sampleFlowchart: Flowchart = {
    id: 'flow-1',
    title: 'Scientific Method',
    description: 'Hypothesis testing cycle',
    ariaLabel: 'Scientific Method Flowchart',
    bounds: { width: 600, height: 800 },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    style: {
      backgroundColor: '#0f172a',
      fontFamily: 'sans-serif',
      fontSize: 14,
      linkColor: '#94a3b8',
    },
    nodes: new Map([
      ['step-1', { id: 'step-1', x: 300, y: 150, width: 160, height: 50, label: 'Form Hypothesis', shape: 'rect', color: '#6366f1' }],
      ['step-2', { id: 'step-2', x: 300, y: 300, width: 160, height: 50, label: 'Experiment', shape: 'rect', color: '#10b981' }],
    ]),
    links: new Map([
      ['fl-1', { id: 'fl-1', sourceId: 'step-1', targetId: 'step-2' }],
    ]),
    steps: [
      { id: 's1', instruction: 'Formulate a falsifiable test hypothesis', expectedOutcome: 'Clear test conditions' },
      { id: 's2', instruction: 'Conduct controlled experiment', expectedOutcome: 'Reproducible dataset' },
    ],
  };

  const sampleAnimation: Animation = {
    id: 'anim-1',
    title: 'Wave Propagation',
    description: 'Harmonic oscillation across space',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    frames: [
      { id: 'f1', duration: 100, elements: [] },
      { id: 'f2', duration: 100, elements: [] },
    ],
    duration: 200,
    fps: 30,
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
