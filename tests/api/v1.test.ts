import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

vi.mock('@/services/geminiService', () => ({
  auditDiagram: vi.fn(),
  fixDiagramSyntax: vi.fn(),
  imageToDiagram: vi.fn(),
  generateDiagramCode: vi.fn(),
}));

import { auditDiagram, fixDiagramSyntax, imageToDiagram } from '@/services/geminiService';
import auditHandler from '@/api/v1/audit';
import fixSyntaxHandler from '@/api/v1/fix-syntax';
import imageToDiagramHandler from '@/api/v1/image-to-diagram';

function makeReq(body: unknown, method = 'POST'): VercelRequest {
  return { method, body } as unknown as VercelRequest;
}

function makeRes() {
  const res = {
    _status: 0,
    _json: null as unknown,
    status(code: number) {
      this._status = code;
      return this;
    },
    json(data: unknown) {
      this._json = data;
      return this;
    },
    setHeader: vi.fn(),
  };
  return res as unknown as VercelResponse & { _status: number; _json: unknown };
}

describe('API /v1/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('returns 405 for non-POST', async () => {
    const res = makeRes();
    await auditHandler(makeReq({}, 'GET'), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(405);
  });

  it('returns 503 when API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.API_KEY;
    delete process.env.VITE_GEMINI_API_KEY;
    const res = makeRes();
    await auditHandler(makeReq({ code: 'graph TD; A-->B' }), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(503);
  });

  it('returns 400 when code is missing', async () => {
    const res = makeRes();
    await auditHandler(makeReq({}), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(400);
  });

  it('calls auditDiagram and returns report on success', async () => {
    const mockReport = { score: 80, summary: 'Good', risks: [], strengths: [], improvements: [] };
    vi.mocked(auditDiagram).mockResolvedValue(mockReport);
    const res = makeRes();
    await auditHandler(makeReq({ code: 'graph TD; A-->B' }), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(200);
    expect((res as ReturnType<typeof makeRes>)._json).toEqual(mockReport);
  });

  it('returns 500 when auditDiagram throws', async () => {
    vi.mocked(auditDiagram).mockRejectedValue(new Error('Gemini error'));
    const res = makeRes();
    await auditHandler(makeReq({ code: 'graph TD; A-->B' }), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(500);
  });
});

describe('API /v1/fix-syntax', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('returns 400 when errorMessage is missing', async () => {
    const res = makeRes();
    await fixSyntaxHandler(makeReq({ code: 'graph TD; A-->B' }), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(400);
  });

  it('calls fixDiagramSyntax and returns fixed code', async () => {
    vi.mocked(fixDiagramSyntax).mockResolvedValue('graph TD; A-->B');
    const res = makeRes();
    await fixSyntaxHandler(makeReq({ code: 'bad code', errorMessage: 'syntax error' }), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(200);
    expect((res as ReturnType<typeof makeRes>)._json).toEqual({ code: 'graph TD; A-->B' });
  });
});

describe('API /v1/image-to-diagram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('returns 400 when image is missing', async () => {
    const res = makeRes();
    await imageToDiagramHandler(makeReq({ mimeType: 'image/png' }), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(400);
  });

  it('returns 400 when mimeType is missing', async () => {
    const res = makeRes();
    await imageToDiagramHandler(makeReq({ image: 'base64data' }), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(400);
  });

  it('calls imageToDiagram and returns code', async () => {
    vi.mocked(imageToDiagram).mockResolvedValue('graph TD; A-->B');
    const res = makeRes();
    await imageToDiagramHandler(makeReq({ image: 'base64data', mimeType: 'image/png' }), res);
    expect((res as ReturnType<typeof makeRes>)._status).toBe(200);
    expect((res as ReturnType<typeof makeRes>)._json).toEqual({ code: 'graph TD; A-->B' });
  });
});
