// Knowledge Galaxy — Navigation Utilities
// Utility functions for navigating the knowledge galaxy

export interface Position {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export function positionInViewport(position: Position, viewport: Viewport, canvasSize: { width: number; height: number }): boolean {
  const screenX = (position.x - viewport.x) * viewport.zoom + canvasSize.width / 2;
  const screenY = (position.y - viewport.y) * viewport.zoom + canvasSize.height / 2;
  return screenX >= 0 && screenX <= canvasSize.width && screenY >= 0 && screenY <= canvasSize.height;
}

export function screenToWorld(screenPos: Position, viewport: Viewport, canvasSize: { width: number; height: number }): Position {
  return {
    x: (screenPos.x - canvasSize.width / 2) / viewport.zoom + viewport.x,
    y: (screenPos.y - canvasSize.height / 2) / viewport.zoom + viewport.y
  };
}

export function worldToScreen(worldPos: Position, viewport: Viewport, canvasSize: { width: number; height: number }): Position {
  return {
    x: (worldPos.x - viewport.x) * viewport.zoom + canvasSize.width / 2,
    y: (worldPos.y - viewport.y) * viewport.zoom + canvasSize.height / 2
  };
}

export function zoomAtPoint(viewport: Viewport, point: Position, newZoom: number, canvasSize: { width: number; height: number }): Viewport {
  const worldPos = screenToWorld(point, viewport, canvasSize);
  const clampedZoom = Math.max(0.1, Math.min(5, newZoom));
  const newViewport = { ...viewport, zoom: clampedZoom };
  return newViewport;
}

export function panViewport(viewport: Viewport, delta: Position): Viewport {
  return {
    ...viewport,
    x: viewport.x - delta.x / viewport.zoom,
    y: viewport.y - delta.y / viewport.zoom
  };
}

export function fitToContent(positions: Position[], padding: number = 50, canvasSize: { width: number; height: number }): Viewport {
  if (positions.length === 0) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const xs = positions.map(p => p.x);
  const ys = positions.map(p => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;

  const zoomX = canvasSize.width / contentWidth;
  const zoomY = canvasSize.height / contentHeight;
  const zoom = Math.min(zoomX, zoomY, 2);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    x: centerX,
    y: centerY,
    zoom: Math.max(0.1, zoom)
  };
}

export function getZoomLevel(zoom: number): "overview" | "cluster" | "node" | "detail" {
  if (zoom < 0.3) return "overview";
  if (zoom < 0.7) return "cluster";
  if (zoom < 1.5) return "node";
  return "detail";
}

export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
