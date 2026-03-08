import { describe, it, expect } from 'vitest';
import { computeHealthScore } from '../../src/core/health';
import { FrameworkSummary, TrendPoint } from '../../src/core/types';

function makeSummary(overrides: Partial<FrameworkSummary> = {}): FrameworkSummary {
  return {
    framework: 'playwright',
    total: 100,
    passed: 95,
    failed: 5,
    skipped: 0,
    passRate: 0.95,
    duration: 5000,
    timestamp: '2025-01-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('computeHealthScore', () => {
  it('should return grade A for perfect results', () => {
    const summaries = [makeSummary({ passed: 100, failed: 0, passRate: 1.0 })];
    const score = computeHealthScore(summaries, []);
    expect(score.grade).toBe('A');
    expect(score.score).toBeGreaterThanOrEqual(0.9);
  });

  it('should return grade F for terrible results', () => {
    const summaries = [makeSummary({ passed: 10, failed: 90, passRate: 0.1 })];
    const score = computeHealthScore(summaries, []);
    expect(score.grade).toBe('F');
    expect(score.score).toBeLessThan(0.6);
  });

  it('should penalize frameworks below 70% pass rate', () => {
    const summaries = [
      makeSummary({ framework: 'playwright', passRate: 0.95, passed: 95, failed: 5 }),
      makeSummary({ framework: 'jest', passRate: 0.5, passed: 50, failed: 50 }),
    ];
    const score = computeHealthScore(summaries, []);
    expect(score.breakdown.frameworkMinimums.score).toBeLessThan(1);
  });

  it('should factor in trend direction', () => {
    const summaries = [makeSummary()];
    const improvingTrends: TrendPoint[] = [
      { date: '2025-01-10', total: 100, passed: 70, failed: 30, passRate: 0.7 },
      { date: '2025-01-11', total: 100, passed: 75, failed: 25, passRate: 0.75 },
      { date: '2025-01-12', total: 100, passed: 80, failed: 20, passRate: 0.8 },
      { date: '2025-01-13', total: 100, passed: 90, failed: 10, passRate: 0.9 },
      { date: '2025-01-14', total: 100, passed: 95, failed: 5, passRate: 0.95 },
    ];

    const score = computeHealthScore(summaries, improvingTrends);
    expect(score.breakdown.trendDirection.score).toBeGreaterThan(0.5);
  });

  it('should include all breakdown weights summing to 1', () => {
    const summaries = [makeSummary()];
    const score = computeHealthScore(summaries, []);
    const totalWeight =
      score.breakdown.passRate.weight +
      score.breakdown.frameworkMinimums.weight +
      score.breakdown.trendDirection.weight +
      score.breakdown.errorAbsence.weight;
    expect(totalWeight).toBe(1);
  });

  it('should handle empty inputs', () => {
    const score = computeHealthScore([], []);
    expect(score.grade).toBeDefined();
    expect(typeof score.score).toBe('number');
  });
});
