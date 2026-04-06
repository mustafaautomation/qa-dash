import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JsonStorage } from '../../src/storage/json.storage';

const TMP = path.join(__dirname, '.tmp-storage');
const STORE_PATH = path.join(TMP, 'store.json');

beforeEach(() => {
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
});

function makeResult(framework: string, passed: number, failed: number) {
  return {
    framework,
    timestamp: new Date().toISOString(),
    duration: 1000,
    tests: [
      ...Array.from({ length: passed }, (_, i) => ({
        name: `pass-${i}`,
        suite: 'suite',
        status: 'passed' as const,
        duration: 100,
      })),
      ...Array.from({ length: failed }, (_, i) => ({
        name: `fail-${i}`,
        suite: 'suite',
        status: 'failed' as const,
        duration: 50,
        error: 'assertion failed',
      })),
    ],
  };
}

describe('JsonStorage', () => {
  it('should initialize and create directory', () => {
    const storage = new JsonStorage(STORE_PATH);
    storage.init();
    expect(fs.existsSync(TMP)).toBe(true);
  });

  it('should store and retrieve run data', () => {
    const storage = new JsonStorage(STORE_PATH);
    storage.init();
    storage.storeRun(makeResult('playwright', 10, 2));

    const summaries = storage.getLatestSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].framework).toBe('playwright');
    expect(summaries[0].total).toBe(12);
    expect(summaries[0].passed).toBe(10);
    expect(summaries[0].failed).toBe(2);
  });

  it('should keep latest run per framework', () => {
    const storage = new JsonStorage(STORE_PATH);
    storage.init();

    // Use explicit timestamps to ensure ordering
    const oldResult = makeResult('playwright', 8, 4);
    oldResult.timestamp = '2026-04-06T01:00:00.000Z';
    storage.storeRun(oldResult);

    const newResult = makeResult('playwright', 10, 2);
    newResult.timestamp = '2026-04-06T02:00:00.000Z';
    storage.storeRun(newResult);

    storage.storeRun(makeResult('jest', 20, 0));

    const summaries = storage.getLatestSummaries();
    expect(summaries).toHaveLength(2);

    const pw = summaries.find((s) => s.framework === 'playwright');
    expect(pw!.passed).toBe(10); // latest run
  });

  it('should calculate pass rate', () => {
    const storage = new JsonStorage(STORE_PATH);
    storage.init();
    storage.storeRun(makeResult('jest', 8, 2));

    const summaries = storage.getLatestSummaries();
    expect(summaries[0].passRate).toBeCloseTo(0.8, 1);
  });

  it('should persist data to disk', () => {
    const storage1 = new JsonStorage(STORE_PATH);
    storage1.init();
    storage1.storeRun(makeResult('playwright', 5, 1));
    storage1.close();

    // Load from disk
    const storage2 = new JsonStorage(STORE_PATH);
    storage2.init();
    const summaries = storage2.getLatestSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].total).toBe(6);
  });

  it('should handle corrupt storage file gracefully', () => {
    fs.mkdirSync(TMP, { recursive: true });
    fs.writeFileSync(STORE_PATH, 'corrupted data!!!');

    const storage = new JsonStorage(STORE_PATH);
    storage.init(); // should not throw
    expect(storage.getLatestSummaries()).toHaveLength(0);
  });

  it('should return empty summaries when no runs', () => {
    const storage = new JsonStorage(STORE_PATH);
    storage.init();
    expect(storage.getLatestSummaries()).toHaveLength(0);
  });
});

describe('JsonStorage — trends', () => {
  it('should return trend data within date range', () => {
    const storage = new JsonStorage(STORE_PATH);
    storage.init();

    // Store runs with recent timestamps
    storage.storeRun(makeResult('playwright', 10, 0));
    storage.storeRun(makeResult('jest', 8, 2));

    const trends = storage.getTrends(7);
    expect(trends.length).toBeGreaterThan(0);
    expect(trends[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(trends[0].total).toBeGreaterThan(0);
  });

  it('should aggregate by date', () => {
    const storage = new JsonStorage(STORE_PATH);
    storage.init();

    storage.storeRun(makeResult('pw', 5, 1));
    storage.storeRun(makeResult('jest', 10, 0));

    const trends = storage.getTrends(30);
    // Both stored today — should be 1 trend point
    expect(trends).toHaveLength(1);
    expect(trends[0].total).toBe(16); // 6 + 10
    expect(trends[0].passed).toBe(15); // 5 + 10
  });

  it('should calculate pass rate in trends', () => {
    const storage = new JsonStorage(STORE_PATH);
    storage.init();
    storage.storeRun(makeResult('pw', 8, 2));

    const trends = storage.getTrends(7);
    expect(trends[0].passRate).toBeCloseTo(0.8, 1);
  });

  it('should return empty for future-only data', () => {
    const storage = new JsonStorage(STORE_PATH);
    storage.init();
    // No runs stored
    expect(storage.getTrends(7)).toHaveLength(0);
  });
});
