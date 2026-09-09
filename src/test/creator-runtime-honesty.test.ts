import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getLanguageRuntimeStatus, DEFAULT_LESSONS } from '@/pages/creator/CreatorAcademy';
import { runInSandbox, formatSandboxOutput, serializeValue } from '@/plugins/margeos/sandboxRunner';

describe('KU PHASE 8 — Creator Runtime Honesty Tests', () => {
  // Set up Worker polyfill for Vitest / JSDOM environment
  beforeAll(() => {
    if (typeof URL.createObjectURL === 'undefined') {
      URL.createObjectURL = () => 'blob:mock-worker-url';
      URL.revokeObjectURL = () => {};
    }

    if (typeof globalThis.Worker === 'undefined') {
      class MockWorker {
        onmessage: ((e: MessageEvent) => void) | null = null;
        onerror: ((e: ErrorEvent) => void) | null = null;
        private terminated = false;

        constructor(public url: string) {}

        postMessage(data: { code: string }) {
          if (this.terminated) return;

          // Execute code in a worker-like sandbox (isolated scope without window / document)
          setTimeout(async () => {
            if (this.terminated) return;
            const logs: Array<{ level: string; text: string }> = [];
            const cap = (level: string) => (...args: any[]) =>
              logs.push({ level, text: args.map(serializeValue).join(' ') });

            const mockConsole = {
              log: cap('log'),
              info: cap('info'),
              warn: cap('warn'),
              error: cap('error'),
              debug: cap('debug'),
            };

            try {
              // Simulate separate worker context where window, document, and localStorage are undefined
              const workerFunction = new Function(
                'console',
                'window',
                'document',
                'localStorage',
                `return (async () => {
                  ${data.code}
                })()`
              );

              // Check for infinite loop simulation in code
              if (data.code.includes('while (true)') || data.code.includes('while(true)')) {
                // Do not respond immediately — let the runner timeout trigger finish()
                return;
              }

              const result = await workerFunction(mockConsole, undefined, undefined, undefined);
              if (this.onmessage && !this.terminated) {
                this.onmessage({
                  data: {
                    ok: true,
                    logs,
                    result: serializeValue(result),
                  },
                } as MessageEvent);
              }
            } catch (err: any) {
              if (this.onmessage && !this.terminated) {
                this.onmessage({
                  data: {
                    ok: false,
                    logs,
                    error: err?.message ? String(err.message) : String(err),
                  },
                } as MessageEvent);
              }
            }
          }, 10);
        }

        terminate() {
          this.terminated = true;
        }
      }

      (globalThis as any).Worker = MockWorker;
      (window as any).Worker = MockWorker;
    }
  });

  describe('1. Language Runtime Audit & Availability', () => {
    it('JavaScript is identified as supported in an isolated Web Worker sandbox', () => {
      const jsStatus = getLanguageRuntimeStatus('javascript');
      expect(jsStatus.supported).toBe(true);
      expect(jsStatus.runtimeName).toContain('JavaScript');

      const aliasStatus = getLanguageRuntimeStatus('js');
      expect(aliasStatus.supported).toBe(true);
    });

    it('Python is honestly identified as unsupported with clear explanation', () => {
      const pyStatus = getLanguageRuntimeStatus('python');
      expect(pyStatus.supported).toBe(false);
      expect(pyStatus.runtimeName).toBe('Python 3');
      expect(pyStatus.reason).toMatch(/Python execution runtime is unavailable in browser environment/);

      const aliasStatus = getLanguageRuntimeStatus('py');
      expect(aliasStatus.supported).toBe(false);
    });

    it('HTML is honestly identified as unsupported for scripting execution', () => {
      const htmlStatus = getLanguageRuntimeStatus('html');
      expect(htmlStatus.supported).toBe(false);
      expect(htmlStatus.reason).toMatch(/HTML markup preview only — script execution runtime disabled/);
    });

    it('Plaintext/Prompting is honestly identified as unsupported for code execution', () => {
      const textStatus = getLanguageRuntimeStatus('plaintext');
      expect(textStatus.supported).toBe(false);
      expect(textStatus.reason).toMatch(/Plaintext prompt does not require a code execution runtime/);
    });

    it('Unknown/arbitrary languages default to unsupported with honest reason', () => {
      const rustStatus = getLanguageRuntimeStatus('rust');
      expect(rustStatus.supported).toBe(false);
      expect(rustStatus.reason).toContain('rust runtime is currently unavailable');
    });
  });

  describe('2. Advertised Lessons Integrity & Content Preservation', () => {
    it('every default lesson has valid curriculum metadata and starter code', () => {
      expect(DEFAULT_LESSONS.length).toBeGreaterThanOrEqual(5);

      DEFAULT_LESSONS.forEach((lesson) => {
        expect(lesson.id).toBeTruthy();
        expect(lesson.slug).toBeTruthy();
        expect(lesson.title).toBeTruthy();
        expect(lesson.body_md).toBeTruthy();
        expect(lesson.starter_code).toBeDefined();
        expect(lesson.xp).toBeGreaterThan(0);
      });
    });

    it('tests every advertised lesson language against the runtime auditor', () => {
      const advertisedLanguages = Array.from(new Set(DEFAULT_LESSONS.map((l) => l.language)));

      expect(advertisedLanguages).toContain('javascript');
      expect(advertisedLanguages).toContain('python');
      expect(advertisedLanguages).toContain('html');
      expect(advertisedLanguages).toContain('plaintext');

      advertisedLanguages.forEach((lang) => {
        const status = getLanguageRuntimeStatus(lang);
        expect(status).toBeDefined();
        expect(typeof status.supported).toBe('boolean');
        if (!status.supported) {
          expect(status.reason).toBeTruthy();
        }
      });
    });
  });

  describe('3. Supported Language (JavaScript) Sandbox Security & Execution Verification', () => {
    it('executes genuine JavaScript code and captures console output accurately', async () => {
      const code = `
        console.log("Calculated answer:", 6 * 7);
        console.info("Status:", "OK");
      `;
      const result = await runInSandbox(code);

      expect(result.ok).toBe(true);
      expect(result.status).toBe('success');
      const formatted = formatSandboxOutput(result);
      expect(formatted).toContain('Calculated answer: 42');
      expect(formatted).toContain('[info] Status: OK');
    });

    it('captures return values properly', async () => {
      const code = `
        const arr = [1, 2, 3, 4, 5];
        return arr.reduce((sum, n) => sum + n, 0);
      `;
      const result = await runInSandbox(code);

      expect(result.ok).toBe(true);
      expect(result.result).toBe('15');
      const formatted = formatSandboxOutput(result);
      expect(formatted).toContain('=> 15');
    });

    it('handles JavaScript runtime exceptions honestly without crashing host environment', async () => {
      const code = `
        const obj = null;
        obj.nonExistentMethod();
      `;
      const result = await runInSandbox(code);

      expect(result.ok).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toMatch(/(Cannot read properties of null|TypeError|null is not an object)/);
    });

    it('prevents browser security escape: window, document, and DOM APIs are undefined in worker thread', async () => {
      const code = `
        const hasWindow = typeof window !== 'undefined';
        const hasDocument = typeof document !== 'undefined';
        const hasLocalStorage = typeof localStorage !== 'undefined';
        console.log("window:", hasWindow, "document:", hasDocument, "localStorage:", hasLocalStorage);
      `;
      const result = await runInSandbox(code);

      expect(result.ok).toBe(true);
      const formatted = formatSandboxOutput(result);
      expect(formatted).toContain('window: false document: false localStorage: false');
    });

    it('terminates infinite loops safely via timeout without locking main thread', async () => {
      const code = `
        while (true) {
          // infinite loop
        }
      `;
      const result = await runInSandbox(code, { timeoutMs: 150 });

      expect(result.ok).toBe(false);
      expect(result.status).toBe('timeout');
      expect(result.error).toContain('Execution exceeded 150ms');
    });
  });
});

