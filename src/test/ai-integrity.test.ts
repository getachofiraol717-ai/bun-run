import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiStream } from '@/pages/creator/aiClient';
import { generateProjectWithAITutor } from '@/plugins/margeos/ai-tutor-engine/services/ProjectGeneratorService';

describe('KU PHASE 6 — AI Integrity Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('aiStream does not return fabricated citations or fake code when backend AI fails, but throws honest error', async () => {
    // Mock global fetch to fail as if AI endpoints are unreachable / 500 error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      body: null,
      text: async () => 'Service Unavailable',
    });

    await expect(
      aiStream({
        mode: 'research',
        messages: [{ role: 'user', content: 'Generate quantum computing citations' }],
      })
    ).rejects.toThrow(/AI service is currently unavailable/);
  });

  it('aiStream does not return fake JSON project scaffold when AI endpoint fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    });

    await expect(
      aiStream({
        mode: 'coding',
        messages: [
          { role: 'system', content: 'Generate JSON Project' },
          { role: 'user', content: 'Build a physics simulator' },
        ],
      })
    ).rejects.toThrow(/AI service is currently unavailable/);
  });

  it('ProjectGeneratorService throws honest error instead of synthesizing fake project manifest when AI returns no text', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    });

    await expect(
      generateProjectWithAITutor({
        prompt: 'Build an astronomy simulation',
        subject: 'Physics',
      })
    ).rejects.toThrow();
  });
});
