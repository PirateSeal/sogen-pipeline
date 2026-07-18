import type { MonitorSnapshot } from './monitor.js';

function label(value: string): string {
  return JSON.stringify(value);
}

export function toPrometheusMetrics(snapshot: MonitorSnapshot): string {
  const lines = [
    '# HELP slo_watch_probe_success Whether the latest probe succeeded (1) or failed (0).',
    '# TYPE slo_watch_probe_success gauge',
    '# HELP slo_watch_probe_latency_milliseconds Latency of the latest probe in milliseconds.',
    '# TYPE slo_watch_probe_latency_milliseconds gauge',
    '# HELP slo_watch_probe_timestamp_seconds Unix timestamp of the latest probe.',
    '# TYPE slo_watch_probe_timestamp_seconds gauge',
    '# HELP slo_watch_sli_ratio Success ratio for the one-hour measurement window.',
    '# TYPE slo_watch_sli_ratio gauge',
    '# HELP slo_watch_probe_results Number of retained probe results by outcome.',
    '# TYPE slo_watch_probe_results gauge',
  ];

  for (const target of snapshot.targets) {
    const targetLabel = `target=${label(target.id)}`;
    const lastProbe = target.lastProbe;

    lines.push(
      `slo_watch_probe_success{${targetLabel}} ${lastProbe?.success ? 1 : 0}`,
      `slo_watch_sli_ratio{${targetLabel}} ${target.sli ?? 0}`,
      `slo_watch_probe_results{${targetLabel},outcome="success"} ${target.successCount}`,
      `slo_watch_probe_results{${targetLabel},outcome="failure"} ${target.failureCount}`,
    );

    if (lastProbe) {
      lines.push(
        `slo_watch_probe_latency_milliseconds{${targetLabel}} ${lastProbe.latencyMs}`,
        `slo_watch_probe_timestamp_seconds{${targetLabel}} ${lastProbe.timestamp / 1_000}`,
      );
    }
  }

  if (snapshot.globalSli !== null) {
    lines.push(`slo_watch_sli_ratio{scope="global"} ${snapshot.globalSli}`);
  }

  return `${lines.join('\n')}\n`;
}
