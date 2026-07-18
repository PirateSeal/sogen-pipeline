import { afterEach, describe, expect, it, vi } from 'vitest';

import { getStatus } from './api.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getStatus', () => {
  it('accepts the API unavailable response because it contains a status payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ targets: [] }), { status: 503 })));

    await expect(getStatus()).resolves.toEqual({ targets: [] });
  });

  it('rejects other unsuccessful HTTP responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    await expect(getStatus()).rejects.toThrow('Request failed with status 500.');
  });
});
