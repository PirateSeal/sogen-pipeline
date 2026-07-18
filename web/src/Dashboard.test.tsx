// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dashboard } from './Dashboard.js';

const status = {
  appVersion: 'test-sha', checkIntervalMs: 30_000, globalSli: 0.995, sloTarget: 0.995, windowSeconds: 3600,
  targets: [
    { failureCount: 0, id: 'portfolio', lastProbe: { latencyMs: 12, statusCode: 200, success: true, timestamp: 1_700_000_000_000 }, sli: 1, state: 'healthy' as const, successCount: 1, url: 'https://example.com' },
    { failureCount: 1, id: 'checkout', lastProbe: { latencyMs: 5000, success: false, timestamp: 1_700_000_001_000 }, sli: 0.9, state: 'unavailable' as const, successCount: 9, url: 'https://checkout.example.com' },
  ],
};

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('Dashboard', () => {
  it('renders status data returned with a 503 response and selects another target', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(status), { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ id: 'portfolio', results: [], url: status.targets[0].url, windowSeconds: 3600 }))).mockResolvedValueOnce(new Response(JSON.stringify(status), { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ id: 'checkout', results: [status.targets[1].lastProbe], url: status.targets[1].url, windowSeconds: 3600 })));
    vi.stubGlobal('fetch', fetchMock);
    render(<Dashboard />);
    expect(await screen.findByText('Global SLI')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
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
