import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import type { AppConfig } from '../src/config.js';
import { MonitorService } from '../src/monitor.js';

const config: AppConfig = {
  appVersion: 'test-sha',
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

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

function createApp() {
  const monitor = new MonitorService(config);
  const app = buildApp({ config, monitor });
  apps.push(app);
  return { app, monitor };
}

describe('HTTP routes', () => {
  it('keeps health and readiness independent from target results', async () => {
    const { app } = createApp();

    await expect(app.inject('/healthz')).resolves.toMatchObject({ statusCode: 200 });
    await expect(app.inject('/readyz')).resolves.toMatchObject({ statusCode: 200 });
  });

  it('returns 503 until all targets have an initial successful probe', async () => {
    const { app, monitor } = createApp();
    monitor.record('portfolio', {
      latencyMs: 10,
      statusCode: 200,
      success: true,
      timestamp: Date.now(),
    });

    await expect(app.inject('/api/status')).resolves.toMatchObject({
      statusCode: 503,
    });
  });

  it('returns 200 when every target is healthy and includes the version', async () => {
    const { app, monitor } = createApp();
    for (const target of config.targets) {
      monitor.record(target.id, {
        latencyMs: 10,
        statusCode: 302,
        success: true,
        timestamp: Date.now(),
      });
    }

    const response = await app.inject('/api/status');

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ appVersion: 'test-sha', globalSli: 1 });
  });

  it('returns 503 when the latest probe fails', async () => {
    const { app, monitor } = createApp();
    for (const target of config.targets) {
      monitor.record(target.id, {
        latencyMs: 10,
        statusCode: 200,
        success: true,
        timestamp: Date.now(),
      });
    }
    monitor.record('sc-haul', {
      latencyMs: 5_000,
      success: false,
      timestamp: Date.now(),
    });

    await expect(app.inject('/api/status')).resolves.toMatchObject({
      statusCode: 503,
    });
  });

  it('serves Prometheus text metrics', async () => {
    const { app, monitor } = createApp();
    monitor.record('portfolio', {
      latencyMs: 10,
      statusCode: 200,
      success: true,
      timestamp: Date.now(),
    });

    const response = await app.inject('/metrics');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.body).toContain('slo_watch_probe_success{target="portfolio"} 1');
  });

  it('returns retained history for a configured target', async () => {
    const { app, monitor } = createApp();
    monitor.record('portfolio', {
      latencyMs: 12,
      statusCode: 200,
      success: true,
      timestamp: Date.now(),
    });

    const response = await app.inject('/api/targets/portfolio/history');

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: 'portfolio',
      results: [{ latencyMs: 12, success: true }],
      windowSeconds: 3600,
    });
  });

  it('returns 404 for an unknown target history', async () => {
    const { app } = createApp();

    const response = await app.inject('/api/targets/unknown/history');

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'Monitoring target not found.',
      targetId: 'unknown',
    });
  });
});
