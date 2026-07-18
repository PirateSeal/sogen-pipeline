import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';

const targets = JSON.stringify([
  { id: 'portfolio', url: 'https://tcousin.com' },
  { id: 'vs-calculator', url: 'https://vs-calculator.tcousin.com' },
  { id: 'sc-haul', url: 'https://sc-haul.tcousin.com' },
]);

function environment(overrides: Record<string, string | undefined> = {}) {
  return {
    APP_VERSION: 'test',
    CHECK_INTERVAL_MS: '30000',
    PORT: '3000',
    REQUEST_TIMEOUT_MS: '5000',
    SLO_TARGET: '0.995',
    TARGETS_JSON: targets,
    ...overrides,
  };
}

describe('loadConfig', () => {
  it('parses the monitoring configuration', () => {
    const config = loadConfig(environment());

    expect(config.targets.map((target) => target.id)).toEqual([
      'portfolio',
      'vs-calculator',
      'sc-haul',
    ]);
    expect(config.sloTarget).toBe(0.995);
  });

  it.each([
    ['malformed target JSON', { TARGETS_JSON: '{' }],
    [
      'non HTTPS target',
      { TARGETS_JSON: JSON.stringify([{ id: 'unsafe', url: 'http://example.com' }]) },
    ],
    [
      'duplicate target id',
      {
        TARGETS_JSON: JSON.stringify([
          { id: 'duplicate', url: 'https://one.example.com' },
          { id: 'duplicate', url: 'https://two.example.com' },
        ]),
      },
    ],
    ['invalid SLO', { SLO_TARGET: '1.1' }],
    ['invalid timeout', { REQUEST_TIMEOUT_MS: '0' }],
  ])('rejects %s', (_scenario, overrides) => {
    expect(() => loadConfig(environment(overrides))).toThrow();
  });

  it.each([
    ['a non-finite number', { SLO_TARGET: 'NaN' }],
    ['a target URL with a non-string value', { TARGETS_JSON: JSON.stringify([{ id: 'invalid-url', url: 42 }]) }],
  ])('uses TypeError for %s', (_scenario, overrides) => {
    expect(() => loadConfig(environment(overrides))).toThrow(TypeError);
  });
});
