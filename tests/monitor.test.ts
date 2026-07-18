import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppConfig } from '../src/config.js';
import {
  type ProbeClient,
  type ProbeResult,
  FetchProbeClient,
  MonitorService,
} from '../src/monitor.js';

const config: AppConfig = {
  appVersion: 'test',
  checkIntervalMs: 30_000,
  port: 3000,
  requestTimeoutMs: 5_000,
  sloTarget: 0.995,
  targets: [
    { id: 'portfolio', url: 'https://tcousin.com' },
    { id: 'vs-calculator', url: 'https://vs-calculator.tcousin.com' },
    { id: 'sc-haul', url: 'https://sc-haul.tcousin.com' },
  ],
};

class StubProbeClient implements ProbeClient {
  constructor(private readonly results: ProbeResult[]) {}

  async probe(
    ...arguments_: Parameters<ProbeClient['probe']>
  ): Promise<ProbeResult> {
    void arguments_;
    const result = this.results.shift();
    if (!result) {
      throw new Error('No result configured for probe.');
    }
    return result;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('MonitorService', () => {
  it('records a probe result for every configured target', async () => {
    const now = 1_000_000;
    const monitor = new MonitorService(config, {
      now: () => now,
      probeClient: new StubProbeClient(
        config.targets.map(() => ({
          latencyMs: 42,
          statusCode: 200,
          success: true,
          timestamp: now,
        })),
      ),
    });

    await monitor.runAll();

    expect(monitor.snapshot()).toMatchObject({
      globalSli: 1,
      targets: [
        { averageLatencyMs: 42, id: 'portfolio', state: 'healthy', successCount: 1 },
        { averageLatencyMs: 42, id: 'vs-calculator', state: 'healthy', successCount: 1 },
        { averageLatencyMs: 42, id: 'sc-haul', state: 'healthy', successCount: 1 },
      ],
    });
  });

  it('marks the latest failed target as unavailable', () => {
    const now = 2_000_000;
    const monitor = new MonitorService(config, { now: () => now });

    monitor.record('portfolio', {
      error: 'Request timed out',
      latencyMs: 5_000,
      success: false,
      timestamp: now,
    });

    expect(monitor.snapshot().targets[0]).toMatchObject({
      failureCount: 1,
      state: 'unavailable',
    });
  });

  it('prunes results older than one hour', () => {
    let now = 10_000_000;
    const monitor = new MonitorService(config, { now: () => now });

    monitor.record('portfolio', {
      latencyMs: 100,
      statusCode: 200,
      success: true,
      timestamp: now - 60 * 60 * 1_000 - 1,
    });
    now += 1;
    monitor.record('portfolio', {
      latencyMs: 100,
      statusCode: 500,
      success: false,
      timestamp: now,
    });

    expect(monitor.snapshot().targets[0]).toMatchObject({
      failureCount: 1,
      successCount: 0,
    });
    expect(monitor.history('portfolio')?.results).toHaveLength(1);
  });

  it('returns a copy of the retained history for a known target', () => {
    const now = 3_000_000;
    const monitor = new MonitorService(config, { now: () => now });
    monitor.record('portfolio', {
      latencyMs: 42,
      statusCode: 200,
      success: true,
      timestamp: now,
    });

    const history = monitor.history('portfolio');
    expect(history).toMatchObject({
      id: 'portfolio',
      results: [{ latencyMs: 42, success: true }],
      url: 'https://tcousin.com',
    });

    history?.results.pop();
    expect(monitor.history('portfolio')?.results).toHaveLength(1);
    expect(monitor.history('unknown')).toBeNull();
  });

  it('records a timeout as a failed probe without following redirects', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const probe = new FetchProbeClient().probe(config.targets[0], 5);
    await vi.advanceTimersByTimeAsync(5);

    await expect(probe).resolves.toMatchObject({ success: false });
    expect(fetchMock).toHaveBeenCalledWith(
      config.targets[0].url,
      expect.objectContaining({ redirect: 'manual' }),
    );
  });
});
