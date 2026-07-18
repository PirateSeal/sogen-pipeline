import type { AppConfig, MonitoredTarget } from './config.js';

export type TargetState = 'degraded' | 'healthy' | 'unavailable' | 'unknown';

export interface ProbeResult {
  error?: string;
  latencyMs: number;
  statusCode?: number;
  success: boolean;
  timestamp: number;
}

export interface TargetSnapshot {
  failureCount: number;
  id: string;
  lastProbe: ProbeResult | null;
  sli: number | null;
  state: TargetState;
  successCount: number;
  url: string;
}

export interface MonitorSnapshot {
  globalSli: number | null;
  targets: TargetSnapshot[];
}

export interface ProbeClient {
  probe(target: MonitoredTarget, timeoutMs: number): Promise<ProbeResult>;
}

export interface MonitorDependencies {
  now?: () => number;
  probeClient?: ProbeClient;
}

export class FetchProbeClient implements ProbeClient {
  async probe(target: MonitoredTarget, timeoutMs: number): Promise<ProbeResult> {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(target.url, {
        headers: { 'user-agent': 'slo-watch/0.1' },
        redirect: 'manual',
        signal: controller.signal,
      });

      return {
        latencyMs: Date.now() - startedAt,
        statusCode: response.status,
        success: response.status >= 200 && response.status < 400,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown probe error.',
        latencyMs: Date.now() - startedAt,
        success: false,
        timestamp: Date.now(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function targetState(
  lastProbe: ProbeResult | null,
  sli: number | null,
  sloTarget: number,
): TargetState {
  if (!lastProbe) {
    return 'unknown';
  }

  if (!lastProbe.success) {
    return 'unavailable';
  }

  if (sli !== null && sli < sloTarget) {
    return 'degraded';
  }

  return 'healthy';
}

export class MonitorService {
  private readonly now: () => number;
  private readonly probeClient: ProbeClient;
  private readonly results = new Map<string, ProbeResult[]>();
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly config: AppConfig,
    dependencies: MonitorDependencies = {},
  ) {
    this.now = dependencies.now ?? Date.now;
    this.probeClient = dependencies.probeClient ?? new FetchProbeClient();

    for (const target of config.targets) {
      this.results.set(target.id, []);
    }
  }

  start(): void {
    if (this.timer) {
      return;
    }

    void this.runAll();
    this.timer = setInterval(() => {
      void this.runAll();
    }, this.config.checkIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async runAll(): Promise<void> {
    await Promise.all(
      this.config.targets.map(async (target) => {
        const result = await this.probeClient.probe(
          target,
          this.config.requestTimeoutMs,
        );
        this.record(target.id, result);
      }),
    );
  }

  record(targetId: string, result: ProbeResult): void {
    const targetResults = this.results.get(targetId);
    if (!targetResults) {
      throw new Error(`Cannot record a probe for unknown target: ${targetId}.`);
    }

    targetResults.push(result);
    this.prune(targetResults);
  }

  snapshot(): MonitorSnapshot {
    const targets = this.config.targets.map((target) => {
      const targetResults = this.results.get(target.id) ?? [];
      this.prune(targetResults);
      const lastProbe = targetResults.at(-1) ?? null;
      const successCount = targetResults.filter((result) => result.success).length;
      const failureCount = targetResults.length - successCount;
      const sli =
        targetResults.length === 0 ? null : successCount / targetResults.length;

      return {
        failureCount,
        id: target.id,
        lastProbe,
        sli,
        state: targetState(lastProbe, sli, this.config.sloTarget),
        successCount,
        url: target.url,
      };
    });

    const sampledTargets = targets.filter((target) => target.sli !== null);
    const totalSamples = sampledTargets.reduce(
      (sum, target) => sum + target.successCount + target.failureCount,
      0,
    );
    const totalSuccesses = sampledTargets.reduce(
      (sum, target) => sum + target.successCount,
      0,
    );

    return {
      globalSli: totalSamples === 0 ? null : totalSuccesses / totalSamples,
      targets,
    };
  }

  private prune(targetResults: ProbeResult[]): void {
    const cutoff = this.now() - 60 * 60 * 1_000;
    const firstCurrentIndex = targetResults.findIndex(
      (result) => result.timestamp >= cutoff,
    );

    if (firstCurrentIndex === -1) {
      targetResults.length = 0;
    } else if (firstCurrentIndex > 0) {
      targetResults.splice(0, firstCurrentIndex);
    }
  }
}
