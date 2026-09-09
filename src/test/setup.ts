import '@testing-library/jest-dom';

// Global mocks for localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock HTMLCanvasElement.prototype.getContext for jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (contextType: string) {
    if (contextType === '2d') {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (x: number, y: number, w: number, h: number) => ({
          data: new Array(w * h * 4).fill(0),
        }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        fill: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        measureText: (text: string) => ({ width: text.length * 8 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  } as any;

  HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback, type = 'image/png') {
    const mockBlob = new Blob(['mock-canvas-bytes'], { type });
    setTimeout(() => callback(mockBlob), 0);
  };

  HTMLCanvasElement.prototype.toDataURL = function (type = 'image/png') {
    return `data:${type};base64,bW9ja2RhdGE=`;
  };
}

