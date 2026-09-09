// Visual Learning Engine — Node Layout Service
// Provides node positioning and layout utilities

export interface LayoutPosition {
  x: number;
  y: number;
}

export interface LayoutBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface NodeDimensions {
  width: number;
  height: number;
}

export class NodeLayoutService {
  /**
   * Calculate bounds from positions
   */
  calculateBounds(positions: LayoutPosition[], dimensions: NodeDimensions): LayoutBounds {
    if (positions.length === 0) {
      return {
        minX: 0, minY: 0, maxX: 0, maxY: 0,
        width: 0, height: 0, centerX: 0, centerY: 0
      };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const pos of positions) {
      minX = Math.min(minX, pos.x - dimensions.width / 2);
      minY = Math.min(minY, pos.y - dimensions.height / 2);
      maxX = Math.max(maxX, pos.x + dimensions.width / 2);
      maxY = Math.max(maxY, pos.y + dimensions.height / 2);
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return {
      minX, minY, maxX, maxY,
      width, height,
      centerX: minX + width / 2,
      centerY: minY + height / 2
    };
  }

  /**
   * Check if two nodes overlap
   */
  nodesOverlap(pos1: LayoutPosition, dim1: NodeDimensions, pos2: LayoutPosition, dim2: NodeDimensions): boolean {
    const halfWidth1 = dim1.width / 2;
    const halfHeight1 = dim1.height / 2;
    const halfWidth2 = dim2.width / 2;
    const halfHeight2 = dim2.height / 2;

    return !(
      pos1.x + halfWidth1 < pos2.x - halfWidth2 ||
      pos1.x - halfWidth1 > pos2.x + halfWidth2 ||
      pos1.y + halfHeight1 < pos2.y - halfHeight2 ||
      pos1.y - halfHeight1 > pos2.y + halfHeight2
    );
  }

  /**
   * Find non-overlapping position
   */
  findNonOverlappingPosition(
    targetPos: LayoutPosition,
    dimensions: NodeDimensions,
    existingPositions: LayoutPosition[],
    existingDimensions: NodeDimensions,
    canvasWidth: number,
    canvasHeight: number,
    maxAttempts: number = 100
  ): LayoutPosition {
    let bestPosition = { ...targetPos };
    let bestDistance = Infinity;

    for (let i = 0; i < maxAttempts; i++) {
      const testPos: LayoutPosition = {
        x: Math.random() * (canvasWidth - dimensions.width) + dimensions.width / 2,
        y: Math.random() * (canvasHeight - dimensions.height) + dimensions.height / 2
      };

      let hasOverlap = false;
      for (let j = 0; j < existingPositions.length; j++) {
        if (this.nodesOverlap(testPos, dimensions, existingPositions[j], existingDimensions[j])) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        const distance = Math.sqrt(
          Math.pow(testPos.x - targetPos.x, 2) +
          Math.pow(testPos.y - targetPos.y, 2)
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPosition = testPos;
        }
      }
    }

    return bestPosition;
  }

  /**
   * Apply radial layout
   */
  applyRadialLayout(
    nodeCount: number,
    centerX: number,
    centerY: number,
    minRadius: number,
    radiusIncrement: number,
    startAngle: number = -Math.PI / 2
  ): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = startAngle + (2 * Math.PI * i) / nodeCount;
      const radius = minRadius + (i % 3) * radiusIncrement;

      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }

    return positions;
  }

  /**
   * Apply grid layout
   */
  applyGridLayout(
    nodeCount: number,
    startX: number,
    startY: number,
    columnWidth: number,
    rowHeight: number,
    columns: number
  ): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);

      positions.push({
        x: startX + col * columnWidth,
        y: startY + row * rowHeight
      });
    }

    return positions;
  }

  /**
   * Calculate hierarchical levels
   */
  calculateHierarchyLevels(
    childCount: number,
    level: number,
    startAngle: number = -Math.PI / 2,
    angleSpread: number = Math.PI / 2
  ): { x: number; y: number; angle: number }[] {
    const results: { x: number; y: number; angle: number }[] = [];
    const halfSpread = angleSpread / 2;

    for (let i = 0; i < childCount; i++) {
      const angle = startAngle - halfSpread + (angleSpread * i) / (childCount - 1 || 1);
      results.push({ x: 0, y: 0, angle });
    }

    return results;
  }

  /**
   * Distance between two points
   */
  distance(p1: LayoutPosition, p2: LayoutPosition): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Angle between two points
   */
  angle(from: LayoutPosition, to: LayoutPosition): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  /**
   * Normalize position within bounds
   */
  normalizePosition(pos: LayoutPosition, bounds: LayoutBounds, padding: number = 20): LayoutPosition {
    return {
      x: Math.max(padding, Math.min(bounds.width - padding, pos.x)),
      y: Math.max(padding, Math.min(bounds.height - padding, pos.y))
    };
  }

  /**
   * Center content within bounds
   */
  centerContent(positions: LayoutPosition[], dimensions: NodeDimensions, bounds: LayoutBounds): LayoutPosition[] {
    const contentBounds = this.calculateBounds(positions, dimensions);
    const offsetX = bounds.centerX - contentBounds.centerX;
    const offsetY = bounds.centerY - contentBounds.centerY;

    return positions.map(pos => ({
      x: pos.x + offsetX,
      y: pos.y + offsetY
    }));
  }
}

// Export singleton instance
export const nodeLayoutService = new NodeLayoutService();
