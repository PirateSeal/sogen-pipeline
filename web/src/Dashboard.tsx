import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getHistory,
  getStatus,
  type ProbeResult,
  type StatusSnapshot,
  type TargetHistory,
  type TargetSnapshot,
} from './api.js';

const refreshIntervalMs = 30_000;
const themeStorageKey = 'slo-watch-theme';

type Theme = 'dark' | 'light';

function initialTheme(): Theme {
  const savedTheme = window.localStorage.getItem(themeStorageKey);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return theme === 'dark' ? (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M20 11a8 8 0 0 0-14.8-4.2L3 9m0-5v5h5M4 13a8 8 0 0 0 14.8 4.2L21 15m0 5v-5h-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

const stateLabels: Record<TargetSnapshot['state'], string> = {
  degraded: 'Degraded',
  healthy: 'Healthy',
  unavailable: 'Unavailable',
  unknown: 'Awaiting data',
};

function percentage(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(2)}%`;
}

function dateTime(value: number | null | undefined): string {
  return value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(value)
    : 'No probe yet';
}

function stateCounts(targets: TargetSnapshot[]) {
  return targets.reduce(
    (counts, target) => ({ ...counts, [target.state]: counts[target.state] + 1 }),
    { degraded: 0, healthy: 0, unavailable: 0, unknown: 0 },
  );
}

function HistoryChart({ results }: { results: ProbeResult[] }) {
  if (results.length === 0) {
    return <p className="grid flex-1 place-items-center text-center text-sm text-[var(--dashboard-muted)]">No probes have been retained for this target yet.</p>;
  }

  const maximumLatency = Math.max(...results.map((result) => result.latencyMs), 1);
  const point = (result: ProbeResult, index: number) => {
    const x = results.length === 1 ? 50 : (index / (results.length - 1)) * 100;
    const y = 90 - (result.latencyMs / maximumLatency) * 75;
    return { x, y };
  };

  return (
    <svg
      aria-label="Latency history for the selected target"
      className="my-4 h-36 w-full overflow-visible"
      role="img"
      viewBox="0 0 100 100"
    >
      <line stroke="var(--dashboard-border)" strokeWidth=".6" x1="0" x2="100" y1="90" y2="90" />
      <polyline
        fill="none"
        points={results.map((result, index) => {
          const { x, y } = point(result, index);
          return `${x},${y}`;
        }).join(' ')}
        stroke="var(--dashboard-primary)"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
      {results.map((result, index) => {
        const { x, y } = point(result, index);
        return (
          <circle
            cx={x}
            cy={y}
            fill={result.success ? 'var(--dashboard-success)' : 'var(--dashboard-critical)'}
            key={`${result.timestamp}-${index}`}
            r="2.2"
          />
        );
      })}
    </svg>
  );
}

function TargetCard({
  selected,
  target,
  onSelect,
}: {
  selected: boolean;
  target: TargetSnapshot;
  onSelect: () => void;
}) {
  return (
    <button
      className={`grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl border p-4 text-left transition-colors ${selected ? 'border-[var(--dashboard-primary)] bg-[var(--dashboard-primary-subtle)]' : 'border-[var(--dashboard-border)] bg-[var(--dashboard-surface-raised)] hover:bg-[var(--dashboard-primary-subtle)]'}`}
      onClick={onSelect}
      type="button"
    >
      <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 rounded-full ${target.state === 'healthy' ? 'bg-[var(--dashboard-success)]' : target.state === 'degraded' ? 'bg-[var(--dashboard-warning)]' : target.state === 'unavailable' ? 'bg-[var(--dashboard-critical)]' : 'bg-[var(--dashboard-muted)]'}`} />
      <span className="flex items-center justify-between gap-3">
        <strong>{target.id}</strong>
        <span className={`text-xs font-bold uppercase tracking-wider ${target.state === 'healthy' ? 'text-[var(--dashboard-success)]' : target.state === 'degraded' ? 'text-[var(--dashboard-warning)]' : target.state === 'unavailable' ? 'text-[var(--dashboard-critical)]' : 'text-[var(--dashboard-muted)]'}`}>{stateLabels[target.state]}</span>
      </span>
      <span className="col-start-2 truncate text-xs text-[var(--dashboard-muted)]">{target.url}</span>
      <span className="col-start-2 mt-2 flex gap-10 text-sm">
        <span className="grid gap-0.5"><small className="text-[10px] font-bold uppercase tracking-wider text-[var(--dashboard-muted)]">SLI</small>{percentage(target.sli)}</span>
        <span className="grid gap-0.5"><small className="text-[10px] font-bold uppercase tracking-wider text-[var(--dashboard-muted)]">Latency</small>{target.lastProbe ? `${target.lastProbe.latencyMs} ms` : '—'}</span>
      </span>
    </button>
  );
}

export function Dashboard() {
  const [status, setStatus] = useState<StatusSnapshot | null>(null);
  const [history, setHistory] = useState<TargetHistory | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const selectedTargetIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const load = useCallback(async (targetId?: string | null) => {
    try {
      setError(null);
      const nextStatus = await getStatus();
      const nextTargetId =
        targetId ?? selectedTargetIdRef.current ?? nextStatus.targets[0]?.id ?? null;
      setStatus(nextStatus);
      setSelectedTargetId(nextTargetId);
      selectedTargetIdRef.current = nextTargetId;
      setUpdatedAt(Date.now());
      setHistory(nextTargetId ? await getHistory(nextTargetId) : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load monitoring data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), refreshIntervalMs);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const selectedTarget = status?.targets.find((target) => target.id === selectedTargetId) ?? null;
  const counts = useMemo(() => stateCounts(status?.targets ?? []), [status?.targets]);

  return (
    <main className="relative flex min-h-dvh min-w-0 flex-col gap-4 overflow-x-hidden bg-[radial-gradient(circle_at_top_left,var(--dashboard-primary-subtle),transparent_34%),radial-gradient(circle_at_bottom_right,var(--dashboard-secondary-subtle),transparent_30%),var(--dashboard-canvas)] px-4 py-5 sm:px-6 lg:h-dvh lg:overflow-hidden lg:px-8 lg:py-6" data-testid="dashboard-shell">
      <header className="flex shrink-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--dashboard-secondary)]">Reliability dashboard</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">SLO Watch</h1></div>
        <div className="flex w-full items-center justify-between gap-3 text-left text-sm text-[var(--dashboard-muted)] sm:w-auto sm:justify-normal sm:text-right">
          <p>Version <strong className="text-[var(--dashboard-foreground)]">{status?.appVersion ?? '—'}</strong><br /><span>Updated {dateTime(updatedAt)}</span></p>
          <button aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-raised)] text-[var(--dashboard-foreground)] transition-colors hover:bg-[var(--dashboard-secondary-subtle)]" onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} type="button"><ThemeIcon theme={theme} /></button>
          <button aria-label="Refresh monitoring data" className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--dashboard-primary)] text-[var(--dashboard-primary-contrast)] shadow-sm transition-[filter] hover:brightness-95 disabled:cursor-wait disabled:opacity-50" disabled={isLoading} onClick={() => void load()} title="Refresh monitoring data" type="button"><RefreshIcon /></button>
        </div>
      </header>
      {error && <div className="shrink-0 rounded-lg border border-[var(--dashboard-critical)] bg-[var(--dashboard-critical-subtle)] px-4 py-2 text-sm" role="alert">{error} {status ? 'Showing the latest available data.' : ''}</div>}
      {status?.targets.some((target) => target.state === 'unavailable' || target.state === 'unknown') && <div className="shrink-0 rounded-lg border border-[var(--dashboard-warning)] bg-[var(--dashboard-warning-subtle)] px-4 py-2 text-sm" role="status">One or more monitored targets need attention.</div>}
      <section aria-label="SLO summary" className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[['Global SLI', percentage(status?.globalSli ?? null), 'Past hour'], ['SLO target', status ? percentage(status.sloTarget) : '—', 'Availability objective'], ['Healthy targets', String(counts.healthy), `${status?.targets.length ?? 0} configured`], ['Need attention', String(counts.degraded + counts.unavailable + counts.unknown), 'Degraded, unavailable, or waiting']].map(([label, value, detail]) => <article className="rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-raised)] px-5 py-3 shadow-sm" key={label}><p className="text-sm text-[var(--dashboard-muted)]">{label}</p><strong className="my-1 block text-2xl tracking-tight">{value}</strong><small className="text-[10px] font-bold uppercase tracking-wider text-[var(--dashboard-muted)]">{detail}</small></article>)}
      </section>
      <section className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
        <section aria-labelledby="targets-heading" className="flex min-h-0 flex-col">
          <div className="mb-3 flex shrink-0 items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--dashboard-secondary)]">Monitored services</p><h2 className="mt-1 text-xl font-semibold" id="targets-heading">Targets</h2></div><span className="shrink-0 text-xs text-[var(--dashboard-muted)]">{status?.checkIntervalMs ? `Checked every ${status.checkIntervalMs / 1000}s` : ''}</span></div>
          {isLoading && !status ? <div className="grid min-h-48 place-items-center rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] text-[var(--dashboard-muted)] lg:min-h-0 lg:flex-1">Loading monitoring data…</div> : <div className="space-y-2 lg:min-h-0 lg:overflow-y-auto lg:pr-2" data-testid="target-list">{status?.targets.map((target) => <TargetCard key={target.id} onSelect={() => void load(target.id)} selected={target.id === selectedTargetId} target={target} />)}</div>}
        </section>
        <aside aria-labelledby="details-heading" className="flex min-h-80 flex-col overflow-hidden rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-raised)] p-5 shadow-sm lg:min-h-0">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--dashboard-secondary)]">Selected target</p><h2 className="mt-1 text-xl font-semibold" id="details-heading">{selectedTarget?.id ?? 'No target selected'}</h2>
          {selectedTarget && <><div className="mt-3 flex items-center gap-2 font-bold"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${selectedTarget.state === 'healthy' ? 'bg-[var(--dashboard-success)]' : selectedTarget.state === 'degraded' ? 'bg-[var(--dashboard-warning)]' : selectedTarget.state === 'unavailable' ? 'bg-[var(--dashboard-critical)]' : 'bg-[var(--dashboard-muted)]'}`} /><span>{stateLabels[selectedTarget.state]}</span></div><p className="mt-1 truncate text-xs text-[var(--dashboard-muted)]">{selectedTarget.url}</p><HistoryChart results={history?.results ?? []} /><div className="grid shrink-0 gap-3 border-t border-[var(--dashboard-border)] pt-3 text-sm"><span className="grid gap-0.5"><small className="text-[10px] font-bold uppercase tracking-wider text-[var(--dashboard-muted)]">Latest probe</small>{dateTime(selectedTarget.lastProbe?.timestamp)}</span><span className="grid gap-0.5"><small className="text-[10px] font-bold uppercase tracking-wider text-[var(--dashboard-muted)]">HTTP status</small>{selectedTarget.lastProbe?.statusCode ?? '—'}</span><span className="grid gap-0.5"><small className="text-[10px] font-bold uppercase tracking-wider text-[var(--dashboard-muted)]">Successes / failures</small>{selectedTarget.successCount} / {selectedTarget.failureCount}</span></div></>}
        </aside>
      </section>
    </main>
  );
}
