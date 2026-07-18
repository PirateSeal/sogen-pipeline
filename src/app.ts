import Fastify from 'fastify';

import type { AppConfig } from './config.js';
import { toPrometheusMetrics } from './metrics.js';
import type { MonitorService } from './monitor.js';

export interface AppDependencies {
  config: AppConfig;
  monitor: MonitorService;
}

export function buildApp({ config, monitor }: AppDependencies) {
  const app = Fastify({ logger: true });

  app.get('/', async () => ({
    name: 'SLO Watch',
    version: config.appVersion,
    endpoints: {
      health: '/healthz',
      metrics: '/metrics',
      readiness: '/readyz',
      status: '/api/status',
      targetHistory: '/api/targets/:targetId/history',
    },
  }));

  app.get('/healthz', async () => ({ status: 'ok' }));

  app.get('/readyz', async () => ({
    monitoredTargetCount: monitor.snapshot().targets.length,
    status: 'ready',
  }));

  app.get('/api/status', async (_request, reply) => {
    const snapshot = monitor.snapshot();
    const hasUnavailableTarget = snapshot.targets.some(
      (target) => target.state === 'unknown' || target.state === 'unavailable',
    );

    return reply.code(hasUnavailableTarget ? 503 : 200).send({
      ...snapshot,
      appVersion: config.appVersion,
      checkIntervalMs: config.checkIntervalMs,
      sloTarget: config.sloTarget,
      windowSeconds: 60 * 60,
    });
  });

  app.get<{ Params: { targetId: string } }>(
    '/api/targets/:targetId/history',
    async (request, reply) => {
      const history = monitor.history(request.params.targetId);
      if (!history) {
        return reply.code(404).send({
          error: 'Monitoring target not found.',
          targetId: request.params.targetId,
        });
      }

      return {
        ...history,
        windowSeconds: 60 * 60,
      };
    },
  );

  app.get('/metrics', async (_request, reply) =>
    reply
      .type('text/plain; version=0.0.4; charset=utf-8')
      .send(toPrometheusMetrics(monitor.snapshot())),
  );

  return app;
}
