import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Aggregator } from '../../src/core/aggregator';
import { DEFAULT_CONFIG } from '../../src/core/types';

const FIXTURES = path.join(__dirname, 'fixtures');
const TMP_DIR = path.join(__dirname, '.tmp-aggregator');

describe('Aggregator', () => {
  let aggregator: Aggregator;

  beforeEach(() => {
    aggregator = new Aggregator({
      ...DEFAULT_CONFIG,
      storage: { path: path.join(TMP_DIR, 'data.json') },
    });
    aggregator.init();
  });

  afterEach(() => {
    aggregator.close();
    if (fs.existsSync(TMP_DIR)) {
      fs.rmSync(TMP_DIR, { recursive: true });
    }
  });

  it('should ingest playwright results', () => {
    aggregator.ingest([path.join(FIXTURES, 'playwright-result.json')]);
    const dashboard = aggregator.getDashboard();
    expect(dashboard.frameworks).toHaveLength(1);
    expect(dashboard.frameworks[0].framework).toBe('playwright');
  });

  it('should ingest multiple frameworks', () => {
    aggregator.ingest([
      path.join(FIXTURES, 'playwright-result.json'),
      path.join(FIXTURES, 'jest-result.json'),
      path.join(FIXTURES, 'newman-result.json'),
    ]);
    const dashboard = aggregator.getDashboard();
    expect(dashboard.frameworks).toHaveLength(3);
    expect(dashboard.totals.total).toBeGreaterThan(0);
  });

  it('should compute health score', () => {
    aggregator.ingest([path.join(FIXTURES, 'playwright-result.json')]);
    const dashboard = aggregator.getDashboard();
    expect(dashboard.healthScore).toBeDefined();
    expect(dashboard.healthScore.grade).toMatch(/^[ABCDF]$/);
    expect(dashboard.healthScore.score).toBeGreaterThanOrEqual(0);
    expect(dashboard.healthScore.score).toBeLessThanOrEqual(1);
  });

  it('should aggregate totals correctly', () => {
    aggregator.ingest([
      path.join(FIXTURES, 'playwright-result.json'),
      path.join(FIXTURES, 'jest-result.json'),
    ]);
    const dashboard = aggregator.getDashboard();
    expect(dashboard.totals.total).toBe(3 + 5);
    expect(dashboard.totals.passed).toBe(2 + 4);
    expect(dashboard.totals.failed).toBe(1 + 1);
  });

  it('should include all tests in dashboard', () => {
    aggregator.ingest([path.join(FIXTURES, 'playwright-result.json')]);
    const dashboard = aggregator.getDashboard();
    expect(dashboard.tests).toHaveLength(3);
    expect(dashboard.tests[0].framework).toBe('playwright');
  });
});
