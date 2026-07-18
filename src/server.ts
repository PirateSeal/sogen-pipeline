import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { MonitorService } from './monitor.js';

const config = loadConfig();
const monitor = new MonitorService(config);
const app = buildApp({ config, monitor });

async function start(): Promise<void> {
  monitor.start();
  await app.listen({ host: '0.0.0.0', port: config.port });
}

async function shutdown(): Promise<void> {
  monitor.stop();
  await app.close();
}

process.once('SIGINT', () => {
  void shutdown();
});
process.once('SIGTERM', () => {
  void shutdown();
});

try {
  await start();
} catch (error: unknown) {
  app.log.error(error);
  await shutdown();
  process.exitCode = 1;
}
