import * as fs from 'fs';
import * as path from 'path';
import { BaseStorage } from './base.storage';
import { FrameworkSummary, TrendPoint } from '../core/types';
import { ParsedFrameworkResult } from '../parsers/base.parser';
import { logger } from '../utils/logger';

interface StoredRun {
  framework: string;
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

interface StoreData {
  runs: StoredRun[];
}

export class JsonStorage extends BaseStorage {
  private filePath: string;
  private data: StoreData = { runs: [] };

  constructor(filePath: string) {
    super();
    this.filePath = filePath;
  }

  init(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      this.data = JSON.parse(raw);
      logger.debug(`Storage loaded from ${this.filePath}`);
    }
  }

  storeRun(result: ParsedFrameworkResult): void {
    const passed = result.tests.filter((t) => t.status === 'passed').length;
    const failed = result.tests.filter((t) => t.status === 'failed').length;
    const skipped = result.tests.filter((t) => t.status === 'skipped').length;

    this.data.runs.push({
      framework: result.framework,
      timestamp: result.timestamp,
      total: result.tests.length,
      passed,
      failed,
      skipped,
      duration: result.duration,
    });

    this.save();
  }

  getLatestSummaries(): FrameworkSummary[] {
    const byFramework = new Map<string, StoredRun>();

    for (const run of this.data.runs) {
      const existing = byFramework.get(run.framework);
      if (!existing || run.timestamp > existing.timestamp) {
        byFramework.set(run.framework, run);
      }
    }

    return [...byFramework.values()].map((run) => ({
      framework: run.framework as FrameworkSummary['framework'],
      total: run.total,
      passed: run.passed,
      failed: run.failed,
      skipped: run.skipped,
      passRate: run.total > 0 ? run.passed / run.total : 0,
      duration: run.duration,
      timestamp: run.timestamp,
    }));
  }

  getTrends(days: number): TrendPoint[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString();

    const byDate = new Map<string, { total: number; passed: number; failed: number }>();

    for (const run of this.data.runs) {
      if (run.timestamp < cutoffStr) continue;
      const date = run.timestamp.substring(0, 10);
      const existing = byDate.get(date) || { total: 0, passed: 0, failed: 0 };
      existing.total += run.total;
      existing.passed += run.passed;
      existing.failed += run.failed;
      byDate.set(date, existing);
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        total: d.total,
        passed: d.passed,
        failed: d.failed,
        passRate: d.total > 0 ? d.passed / d.total : 0,
      }));
  }

  close(): void {
    this.save();
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }
}
