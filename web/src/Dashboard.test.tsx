// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dashboard, httpStatusColor, latencyColor, reliabilityColor, timelineX } from './Dashboard.js';

const status = {
  appVersion: 'test-sha', checkIntervalMs: 30_000, globalSli: 0.995, sloTarget: 0.995, windowSeconds: 3600,
  targets: [
    { averageLatencyMs: 11, failureCount: 0, id: 'portfolio', lastProbe: { latencyMs: 12, statusCode: 200, success: true, timestamp: 1_700_000_000_000 }, sli: 1, state: 'healthy' as const, successCount: 1, url: 'https://example.com' },
    { averageLatencyMs: 4_200, failureCount: 1, id: 'checkout', lastProbe: { latencyMs: 5000, success: false, timestamp: 1_700_000_001_000 }, sli: 0.9, state: 'unavailable' as const, successCount: 9, url: 'https://checkout.example.com' },
  ],
};

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('Dashboard', () => {
  it('positions probes against a fixed rolling one-hour window', () => {
    const now = 1_700_000_000_000;
    expect(timelineX(now - 3_600_000, 3600, now)).toBe(4);
    expect(timelineX(now - 1_800_000, 3600, now)).toBe(50);
    expect(timelineX(now, 3600, now)).toBe(96);
  });

  it('clamps probes outside the displayed rolling window', () => {
    const now = 1_700_000_000_000;
    expect(timelineX(now - 3_600_001, 3600, now)).toBe(4);
    expect(timelineX(now + 1, 3600, now)).toBe(96);
  });

  it('maps reliability from green through amber to red', () => {
    expect(reliabilityColor(1)).toBe('var(--dashboard-success)');
    expect(reliabilityColor(0.97)).toContain('var(--dashboard-warning)');
    expect(reliabilityColor(0.92)).toContain('var(--dashboard-critical)');
    expect(reliabilityColor(0.8)).toBe('var(--dashboard-critical)');
  });

  it('uses OKLCH semantic colours for latency and HTTP metrics', () => {
    expect(latencyColor({ latencyMs: 120, success: true, timestamp: 0 })).toBe('var(--dashboard-success)');
    expect(latencyColor({ latencyMs: 500, success: true, timestamp: 0 })).toBe('var(--dashboard-warning)');
    expect(latencyColor({ latencyMs: 900, success: true, timestamp: 0 })).toBe('var(--dashboard-critical)');
    expect(httpStatusColor(200)).toBe('var(--dashboard-success)');
    expect(httpStatusColor(404)).toBe('var(--dashboard-warning)');
    expect(httpStatusColor(503)).toBe('var(--dashboard-critical)');
  });

  it('renders status data returned with a 503 response and selects another target', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(status), { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ id: 'portfolio', results: [], url: status.targets[0].url, windowSeconds: 3600 }))).mockResolvedValueOnce(new Response(JSON.stringify(status), { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ id: 'checkout', results: [status.targets[1].lastProbe], url: status.targets[1].url, windowSeconds: 3600 })));
    vi.stubGlobal('fetch', fetchMock);
    render(<Dashboard />);
    expect(await screen.findByText('Global SLI')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('11 ms')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-shell')).toHaveClass('min-h-dvh', 'overflow-x-hidden');
    expect(screen.getByTestId('target-list')).toHaveClass('lg:overflow-y-auto');
    fireEvent.click(screen.getByRole('button', { name: /checkout/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/targets/checkout/history'));
  });

  it('shows a request error when no status can be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));
    render(<Dashboard />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Network offline');
  });

  it('switches and persists the selected theme', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(status))));
    render(<Dashboard />);
    const button = await screen.findByRole('button', { name: /switch to dark theme/i });
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('slo-watch-theme')).toBe('dark');
  });
});
