import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { JsonReporter } from '../../src/reporters/json.reporter';
import { HtmlReporter } from '../../src/reporters/html.reporter';
import { GithubReporter } from '../../src/reporters/github.reporter';
import { DashboardData } from '../../src/core/types';

const TMP_DIR = path.join(__dirname, '.tmp-reporters');

function makeDashboard(): DashboardData {
  return {
    timestamp: '2025-01-15T10:00:00.000Z',
    frameworks: [
      {
        framework: 'playwright',
        total: 10,
        passed: 9,
        failed: 1,
        skipped: 0,
        passRate: 0.9,
        duration: 5000,
        timestamp: '2025-01-15T10:00:00.000Z',
      },
      {
        framework: 'jest',
        total: 20,
        passed: 18,
        failed: 2,
        skipped: 0,
        passRate: 0.9,
        duration: 3000,
        timestamp: '2025-01-15T10:00:00.000Z',
      },
    ],
    tests: [
      { name: 'test-a', suite: 'suite', framework: 'playwright', status: 'passed', duration: 100 },
      {
        name: 'test-b',
        suite: 'suite',
        framework: 'playwright',
        status: 'failed',
        duration: 200,
        error: 'Element not found',
      },
    ],
    healthScore: {
      score: 0.85,
      grade: 'B',
      breakdown: {
        passRate: { score: 0.9, weight: 0.4 },
        frameworkMinimums: { score: 1, weight: 0.2 },
        trendDirection: { score: 0.5, weight: 0.2 },
        coverageHealth: { score: 0.9, weight: 0.2 },
      },
    },
    totals: { total: 30, passed: 27, failed: 3, skipped: 0, passRate: 0.9, totalDuration: 8000 },
  };
}

describe('JsonReporter', () => {
  afterEach(() => {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
  });

  it('should write JSON report', () => {
    const outputPath = path.join(TMP_DIR, 'dashboard.json');
    new JsonReporter(outputPath).report(makeDashboard());
    expect(fs.existsSync(outputPath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(data.totals.total).toBe(30);
  });
});

describe('HtmlReporter', () => {
  afterEach(() => {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
  });

  it('should write HTML report', () => {
    const outputPath = path.join(TMP_DIR, 'dashboard.html');
    new HtmlReporter(outputPath).report(makeDashboard());
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('QA Dashboard');
    expect(content).toContain('playwright');
  });
});

describe('GithubReporter', () => {
  it('should generate markdown', () => {
    const md = new GithubReporter().report(makeDashboard());
    expect(md).toContain('## QA Dashboard Report');
    expect(md).toContain('Grade B');
    expect(md).toContain('playwright');
  });
});
