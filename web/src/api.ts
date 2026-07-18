export type TargetState = 'degraded' | 'healthy' | 'unavailable' | 'unknown';
export interface ProbeResult { error?: string; latencyMs: number; statusCode?: number; success: boolean; timestamp: number; }
export interface TargetSnapshot { failureCount: number; id: string; lastProbe: ProbeResult | null; sli: number | null; state: TargetState; successCount: number; url: string; }
export interface StatusSnapshot { appVersion: string; checkIntervalMs: number; globalSli: number | null; sloTarget: number; targets: TargetSnapshot[]; windowSeconds: number; }
export interface TargetHistory { id: string; results: ProbeResult[]; url: string; windowSeconds: number; }
async function getJson<T>(path: string): Promise<T> { const response = await fetch(path); if (!response.ok && response.status !== 503) throw new Error(`Request failed with status ${response.status}.`); return response.json() as Promise<T>; }
export const getStatus = () => getJson<StatusSnapshot>('/api/status');
export const getHistory = (targetId: string) => getJson<TargetHistory>(`/api/targets/${encodeURIComponent(targetId)}/history`);
