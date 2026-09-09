// Visual Learning Engine — renderingUtils
// Rendering utilities and helpers

export interface RenderContext {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  scale: number;
}

/**
 * Create render context
 */
export function createRenderContext(
  canvas: HTMLCanvasElement,
  scale: number = 1
): RenderContext | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr * scale;
  canvas.height = rect.height * dpr * scale;

  ctx.scale(dpr * scale, dpr * scale);

  return {
    canvas,
    ctx,
    width: rect.width,
    height: rect.height,
    scale: dpr * scale
  };
}

/**
 * Clear canvas
 */
export function clearCanvas(context: RenderContext, color?: string): void {
  if (!context.ctx) return;

  if (color) {
    context.ctx.fillStyle = color;
    context.ctx.fillRect(0, 0, context.width, context.height);
  } else {
    context.ctx.clearRect(0, 0, context.width, context.height);
  }
}

/**
 * Draw rounded rectangle
 */
export function drawRoundedRect(
  context: RenderContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill?: string,
  stroke?: string,
  strokeWidth: number = 1
): void {
  if (!context.ctx) return;

  context.ctx.beginPath();
  context.ctx.moveTo(x + radius, y);
  context.ctx.lineTo(x + width - radius, y);
  context.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.ctx.lineTo(x + width, y + height - radius);
  context.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.ctx.lineTo(x + radius, y + height);
  context.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.ctx.lineTo(x, y + radius);
  context.ctx.quadraticCurveTo(x, y, x + radius, y);
  context.ctx.closePath();

  if (fill) {
    context.ctx.fillStyle = fill;
    context.ctx.fill();
  }

  if (stroke) {
    context.ctx.strokeStyle = stroke;
    context.ctx.lineWidth = strokeWidth;
    context.ctx.stroke();
  }
}

/**
 * Draw ellipse
 */
export function drawEllipse(
  context: RenderContext,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill?: string,
  stroke?: string,
  strokeWidth: number = 1
): void {
  if (!context.ctx) return;

  context.ctx.beginPath();
  context.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

  if (fill) {
    context.ctx.fillStyle = fill;
    context.ctx.fill();
  }

  if (stroke) {
    context.ctx.strokeStyle = stroke;
    context.ctx.lineWidth = strokeWidth;
    context.ctx.stroke();
  }
}

/**
 * Draw diamond
 */
export function drawDiamond(
  context: RenderContext,
  cx: number,
  cy: number,
  width: number,
  height: number,
  fill?: string,
  stroke?: string,
  strokeWidth: number = 1
): void {
  if (!context.ctx) return;

  context.ctx.beginPath();
  context.ctx.moveTo(cx, cy - height / 2);
  context.ctx.lineTo(cx + width / 2, cy);
  context.ctx.lineTo(cx, cy + height / 2);
  context.ctx.lineTo(cx - width / 2, cy);
  context.ctx.closePath();

  if (fill) {
    context.ctx.fillStyle = fill;
    context.ctx.fill();
  }

  if (stroke) {
    context.ctx.strokeStyle = stroke;
    context.ctx.lineWidth = strokeWidth;
    context.ctx.stroke();
  }
}

/**
 * Draw line
 */
export function drawLine(
  context: RenderContext,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number = 1,
  dashed: boolean = false
): void {
  if (!context.ctx) return;

  context.ctx.beginPath();
  context.ctx.moveTo(x1, y1);
  context.ctx.lineTo(x2, y2);

  context.ctx.strokeStyle = color;
  context.ctx.lineWidth = width;

  if (dashed) {
    context.ctx.setLineDash([5, 5]);
  } else {
    context.ctx.setLineDash([]);
  }

  context.ctx.stroke();
  context.ctx.setLineDash([]);
}

/**
 * Draw arrow
 */
export function drawArrow(
  context: RenderContext,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  headLength: number = 10,
  width: number = 1
): void {
  if (!context.ctx) return;

  const angle = Math.atan2(y2 - y1, x2 - x1);

  context.ctx.beginPath();
  context.ctx.moveTo(x1, y1);
  context.ctx.lineTo(x2, y2);
  context.ctx.strokeStyle = color;
  context.ctx.lineWidth = width;
  context.ctx.stroke();

  // Arrow head
  context.ctx.beginPath();
  context.ctx.moveTo(x2, y2);
  context.ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  context.ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  context.ctx.closePath();
  context.ctx.fillStyle = color;
  context.ctx.fill();
}

/**
 * Draw curved line (bezier)
 */
export function drawCurvedLine(
  context: RenderContext,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number = 1,
  curvature: number = 0.5
): void {
  if (!context.ctx) return;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cp1x = midX - dy * curvature;
  const cp1y = midY + dx * curvature;
  const cp2x = midX + dy * curvature;
  const cp2y = midY - dx * curvature;

  context.ctx.beginPath();
  context.ctx.moveTo(x1, y1);
  context.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
  context.ctx.strokeStyle = color;
  context.ctx.lineWidth = width;
  context.ctx.stroke();
}

/**
 * Draw text
 */
export function drawText(
  context: RenderContext,
  text: string,
  x: number,
  y: number,
  options: {
    font?: string;
    size?: number;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    bold?: boolean;
    italic?: boolean;
  } = {}
): TextMetrics | null {
  if (!context.ctx) return null;

  const {
    font = "system-ui",
    size = 14,
    color = "#000000",
    align = "center",
    baseline = "middle",
    bold = false,
    italic = false
  } = options;

  const style = `${italic ? "italic " : ""}${bold ? "bold " : ""}${size}px ${font}`;

  context.ctx.font = style;
  context.ctx.fillStyle = color;
  context.ctx.textAlign = align;
  context.ctx.textBaseline = baseline;
  context.ctx.fillText(text, x, y);

  return context.ctx.measureText(text);
}

/**
 * Draw wrapped text
 */
export function drawWrappedText(
  context: RenderContext,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  options: {
    font?: string;
    size?: number;
    color?: string;
    align?: CanvasTextAlign;
  } = {}
): number {
  if (!context.ctx) return 0;

  const { font = "system-ui", size = 14, color = "#000000", align = "left" } = options;
  const style = `${size}px ${font}`;

  context.ctx.font = style;
  context.ctx.fillStyle = color;
  context.ctx.textAlign = align;
  context.ctx.textBaseline = "top";

  const words = text.split(" ");
  let line = "";
  let height = 0;

  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = context.ctx.measureText(testLine);

    if (metrics.width > maxWidth && line !== "") {
      context.ctx.fillText(line.trim(), x, y + height);
      line = word + " ";
      height += lineHeight;
    } else {
      line = testLine;
    }
  }

  context.ctx.fillText(line.trim(), x, y + height);
  return height + lineHeight;
}

/**
 * Draw shadow
 */
export function setShadow(
  context: RenderContext,
  blur: number,
  offsetX: number = 0,
  offsetY: number = 0,
  color: string = "rgba(0,0,0,0.3)"
): void {
  if (!context.ctx) return;

  context.ctx.shadowBlur = blur;
  context.ctx.shadowOffsetX = offsetX;
  context.ctx.shadowOffsetY = offsetY;
  context.ctx.shadowColor = color;
}

/**
 * Clear shadow
 */
export function clearShadow(context: RenderContext): void {
  if (!context.ctx) return;

  context.ctx.shadowBlur = 0;
  context.ctx.shadowOffsetX = 0;
  context.ctx.shadowOffsetY = 0;
  context.ctx.shadowColor = "transparent";
}

/**
 * Convert SVG to data URL
 */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/**
 * Convert canvas to data URL
 */
export function canvasToDataUrl(
  context: RenderContext,
  format: "png" | "jpeg" | "webp" = "png",
  quality: number = 0.92
): string | null {
  if (!context.canvas) return null;
  return context.canvas.toDataURL(`image/${format}`, quality);
}

/**
 * Convert canvas to blob
 */
export async function canvasToBlob(
  context: RenderContext,
  format: "png" | "jpeg" | "webp" = "png",
  quality: number = 0.92
): Promise<Blob | null> {
  if (!context.canvas) return null;

  return new Promise((resolve) => {
    context.canvas!.toBlob(
      (blob) => resolve(blob),
      `image/${format}`,
      quality
    );
  });
}

/**
 * Load image from URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Draw image
 */
export function drawImage(
  context: RenderContext,
  img: HTMLImageElement,
  x: number,
  y: number,
  width?: number,
  height?: number
): void {
  if (!context.ctx) return;

  if (width && height) {
    context.ctx.drawImage(img, x, y, width, height);
  } else {
    context.ctx.drawImage(img, x, y);
  }
}
