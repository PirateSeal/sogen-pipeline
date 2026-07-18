import Fastify from 'fastify';

import type { AppConfig } from './config.js';
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
    },
  }));

  app.get('/healthz', async () => ({ status: 'ok' }));

  app.get('/readyz', async () => ({
    monitoredTargetCount: monitor.snapshot().targets.length,
    status: 'ready',
  }));

  return app;
}
