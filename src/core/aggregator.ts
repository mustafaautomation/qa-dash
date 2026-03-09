import * as fs from 'fs';
import { DashConfig, DashboardData, UnifiedTestResult, FrameworkSummary } from './types';
import { computeHealthScore } from './health';
import { ParserRegistry } from '../parsers/registry';
import { ParsedFrameworkResult } from '../parsers/base.parser';
import { JsonStorage } from '../storage/json.storage';
import { logger } from '../utils/logger';

export class Aggregator {
  private config: DashConfig;
  private registry: ParserRegistry;
  private storage: JsonStorage;
  private currentTests: UnifiedTestResult[] = [];
  private currentSummaries: FrameworkSummary[] = [];
  private seenFiles = new Set<string>();

  constructor(config: DashConfig) {
    this.config = config;
    this.registry = new ParserRegistry(config.parsers);
    this.storage = new JsonStorage(config.storage.path);
  }

  init(): void {
    this.storage.init();
  }

  ingest(filePaths: string[]): void {
    for (const filePath of filePaths) {
      const resolved = fs.realpathSync(filePath);
      if (this.seenFiles.has(resolved)) {
        logger.warn(`Skipping duplicate file: ${filePath}`);
        continue;
      }
      this.seenFiles.add(resolved);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parser = this.registry.detect(content);

        if (!parser) {
          logger.warn(`Could not detect framework for: ${filePath}`);
          continue;
        }

        const result: ParsedFrameworkResult = parser.parse(content);
        this.storage.storeRun(result);
        this.currentTests.push(...result.tests);

        const summary = this.toSummary(result);
        this.currentSummaries.push(summary);

        logger.info(
          `Ingested ${result.tests.length} tests from ${filePath} (${result.framework})`,
        );
      } catch (err) {
        logger.error(`Failed to ingest ${filePath}: ${(err as Error).message}`);
      }
    }
  }

  getDashboard(): DashboardData {
    const summaries =
      this.currentSummaries.length > 0 ? this.currentSummaries : this.storage.getLatestSummaries();

    const totalTests = summaries.reduce((s, f) => s + f.total, 0);
    const totalPassed = summaries.reduce((s, f) => s + f.passed, 0);
    const totalFailed = summaries.reduce((s, f) => s + f.failed, 0);
    const totalSkipped = summaries.reduce((s, f) => s + f.skipped, 0);
    const totalDuration = summaries.reduce((s, f) => s + f.duration, 0);

    const trends = this.storage.getTrends(30);
    const healthScore = computeHealthScore(summaries, trends);

    return {
      timestamp: new Date().toISOString(),
      frameworks: summaries,
      tests: this.currentTests,
      healthScore,
      totals: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        passRate: totalTests > 0 ? totalPassed / totalTests : 0,
        totalDuration,
      },
    };
  }

  close(): void {
    this.storage.close();
  }

  private toSummary(result: ParsedFrameworkResult): FrameworkSummary {
    const passed = result.tests.filter((t) => t.status === 'passed').length;
    const failed = result.tests.filter((t) => t.status === 'failed').length;
    const skipped = result.tests.filter((t) => t.status === 'skipped').length;
    const total = result.tests.length;

    return {
      framework: result.framework,
      total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? passed / total : 0,
      duration: result.duration,
      timestamp: result.timestamp,
    };
  }
}
