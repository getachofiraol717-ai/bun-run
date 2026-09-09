// Visual Learning Engine — layoutUtils
// Layout calculation utilities

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle between two points (in radians)
 */
export function angle(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate point at distance and angle from origin
 */
export function pointAtDistance(origin: Point, dist: number, angle: number): Point {
  return {
    x: origin.x + dist * Math.cos(angle),
    y: origin.y + dist * Math.sin(angle)
  };
}

/**
 * Calculate bounding box for points
 */
export function calculateBounds(points: Point[]): Bounds {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Calculate center of points
 */
export function calculateCenter(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const sum = points.reduce((acc, p) => ({
    x: acc.x + p.x,
    y: acc.y + p.y
  }), { x: 0, y: 0 });

  return {
    x: sum.x / points.length,
    y: sum.y / points.length
  };
}

/**
 * Check if two rectangles overlap
 */
export function rectsOverlap(r1: Bounds, r2: Bounds): boolean {
  return !(
    r1.x + r1.width < r2.x ||
    r2.x + r2.width < r1.x ||
    r1.y + r1.height < r2.y ||
    r2.y + r2.height < r1.y
  );
}

/**
 * Check if point is inside rectangle
 */
export function pointInRect(point: Point, rect: Bounds): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Calculate circular layout positions
 */
export function circularLayout(
  count: number,
  center: Point,
  radius: number,
  startAngle: number = -Math.PI / 2
): Point[] {
  const positions: Point[] = [];

  for (let i = 0; i < count; i++) {
    const angle = startAngle + (2 * Math.PI * i) / count;
    positions.push(pointAtDistance(center, radius, angle));
  }

  return positions;
}

/**
 * Calculate grid layout positions
 */
export function gridLayout(
  count: number,
  start: Point,
  cellWidth: number,
  cellHeight: number,
  columns: number
): Point[] {
  const positions: Point[] = [];

  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    positions.push({
      x: start.x + col * cellWidth,
      y: start.y + row * cellHeight
    });
  }

  return positions;
}

/**
 * Calculate radial tree layout
 */
export function radialTreeLayout(
  count: number,
  center: Point,
  levelCount: number,
  baseRadius: number,
  radiusStep: number,
  startAngle: number = -Math.PI / 2,
  angleSpread: number = Math.PI
): Point[] {
  const positions: Point[] = [];
  const halfSpread = angleSpread / 2;

  for (let i = 0; i < count; i++) {
    const level = Math.floor(Math.sqrt(i));
    const siblingsInLevel = count / levelCount;
    const indexInLevel = i % siblingsInLevel;
    const angle = startAngle - halfSpread + (angleSpread * indexInLevel) / (siblingsInLevel - 1 || 1);
    const radius = baseRadius + level * radiusStep;

    positions.push(pointAtDistance(center, radius, angle));
  }

  return positions;
}

/**
 * Calculate hierarchical layout (top-down or left-right)
 */
export function hierarchicalLayout(
  levels: { count: number; spacing: number }[],
  start: Point,
  levelHeight: number,
  direction: "tb" | "bt" | "lr" | "rl" = "tb"
): Point[] {
  const positions: Point[] = [];
  let currentY = start.y;

  for (const level of levels) {
    const levelWidth = level.count * level.spacing;
    let currentX = start.x - levelWidth / 2 + level.spacing / 2;

    for (let i = 0; i < level.count; i++) {
      if (direction === "tb" || direction === "bt") {
        positions.push({ x: currentX, y: currentY });
      } else {
        positions.push({ x: currentY, y: currentX });
      }
      currentX += level.spacing;
    }

    currentY += levelHeight;
  }

  return positions;
}

/**
 * Normalize positions to fit within bounds
 */
export function normalizePositions(
  positions: Point[],
  targetBounds: Bounds,
  padding: number = 10
): Point[] {
  if (positions.length === 0) return [];

  const sourceBounds = calculateBounds(positions);
  const scaleX = (targetBounds.width - padding * 2) / sourceBounds.width;
  const scaleY = (targetBounds.height - padding * 2) / sourceBounds.height;
  const scale = Math.min(scaleX, scaleY, 1);

  const offsetX = targetBounds.x + padding - sourceBounds.x * scale;
  const offsetY = targetBounds.y + padding - sourceBounds.y * scale;

  return positions.map(p => ({
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY
  }));
}

/**
 * Center positions around a point
 */
export function centerPositions(positions: Point[], center: Point): Point[] {
  const currentCenter = calculateCenter(positions);
  const dx = center.x - currentCenter.x;
  const dy = center.y - currentCenter.y;

  return positions.map(p => ({
    x: p.x + dx,
    y: p.y + dy
  }));
}

/**
 * Snap point to grid
 */
export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}

/**
 * Calculate spring force between two points
 */
export function springForce(
  p1: Point,
  p2: Point,
  restLength: number,
  stiffness: number = 0.1
): Point {
  const dist = distance(p1, p2);
  const displacement = dist - restLength;
  const force = stiffness * displacement;
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  return {
    x: force * Math.cos(angle),
    y: force * Math.sin(angle)
  };
}

/**
 * Calculate repulsion force between two points
 */
export function repulsionForce(
  p1: Point,
  p2: Point,
  minDistance: number,
  strength: number = 100
): Point {
  const dist = Math.max(distance(p1, p2), minDistance);
  const force = strength / (dist * dist);
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  return {
    x: force * Math.cos(angle),
    y: force * Math.sin(angle)
  };
}
