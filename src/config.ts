export interface MonitoredTarget {
  id: string;
  url: string;
}

export interface AppConfig {
  appVersion: string;
  checkIntervalMs: number;
  port: number;
  requestTimeoutMs: number;
  sloTarget: number;
  targets: MonitoredTarget[];
}

type Environment = NodeJS.ProcessEnv;

const targetIdPattern = /^[a-z][a-z0-9-]*$/;

function parseNumber(
  value: string | undefined,
  name: string,
  fallback: number,
): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a finite number.`);
  }

  return parsed;
}

function parsePositiveInteger(
  value: string | undefined,
  name: string,
  fallback: number,
): number {
  const parsed = parseNumber(value, name, fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function parseTargets(value: string | undefined): MonitoredTarget[] {
  if (!value) {
    throw new Error('TARGETS_JSON is required.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('TARGETS_JSON must be valid JSON.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('TARGETS_JSON must contain at least one target.');
  }

  const ids = new Set<string>();

  return parsed.map((target, index) => {
    if (typeof target !== 'object' || target === null) {
      throw new Error(`TARGETS_JSON entry ${index} must be an object.`);
    }

    const { id, url } = target as Record<string, unknown>;
    if (typeof id !== 'string' || !targetIdPattern.test(id)) {
      throw new Error(
        `TARGETS_JSON entry ${index} id must match ${targetIdPattern}.`,
      );
    }

    if (ids.has(id)) {
      throw new Error(`TARGETS_JSON contains duplicate id: ${id}.`);
    }
    ids.add(id);

    if (typeof url !== 'string') {
      throw new Error(`TARGETS_JSON entry ${index} url must be a string.`);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error(`TARGETS_JSON entry ${index} url must be valid.`);
    }

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.username !== '' ||
      parsedUrl.password !== ''
    ) {
      throw new Error(
        `TARGETS_JSON entry ${index} url must be HTTPS and contain no credentials.`,
      );
    }

    return { id, url: parsedUrl.toString() };
  });
}

export function loadConfig(environment: Environment = process.env): AppConfig {
  const port = parsePositiveInteger(environment.PORT, 'PORT', 3000);
  if (port > 65_535) {
    throw new Error('PORT must be at most 65535.');
  }

  const sloTarget = parseNumber(environment.SLO_TARGET, 'SLO_TARGET', 0.995);
  if (sloTarget <= 0 || sloTarget > 1) {
    throw new Error('SLO_TARGET must be greater than 0 and at most 1.');
  }

  return {
    appVersion: environment.APP_VERSION?.trim() || 'dev',
    checkIntervalMs: parsePositiveInteger(
      environment.CHECK_INTERVAL_MS,
      'CHECK_INTERVAL_MS',
      30_000,
    ),
    port,
    requestTimeoutMs: parsePositiveInteger(
      environment.REQUEST_TIMEOUT_MS,
      'REQUEST_TIMEOUT_MS',
      5_000,
    ),
    sloTarget,
    targets: parseTargets(environment.TARGETS_JSON),
  };
}
