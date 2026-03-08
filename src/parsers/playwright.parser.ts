import { BaseParser, ParsedFrameworkResult } from './base.parser';
import { UnifiedTestResult } from '../core/types';

export class PlaywrightParser extends BaseParser {
  framework = 'playwright' as const;

  canParse(content: string): boolean {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data.suites) && (data.config !== undefined || data.stats !== undefined);
    } catch {
      return false;
    }
  }

  parse(content: string): ParsedFrameworkResult {
    const data = JSON.parse(content);
    const tests: UnifiedTestResult[] = [];

    const extract = (
      spec: {
        title: string;
        tests?: Array<{
          title: string;
          status: string;
          duration: number;
          results: Array<{ status: string; error?: { message?: string } }>;
        }>;
        suites?: unknown[];
      },
      suitePath: string,
    ): void => {
      const suite = suitePath ? `${suitePath} > ${spec.title}` : spec.title;

      for (const test of spec.tests || []) {
        const lastResult = test.results[test.results.length - 1];
        tests.push({
          name: test.title,
          suite,
          framework: 'playwright',
          status: this.mapStatus(test.status || lastResult?.status),
          duration: test.duration || 0,
          error: lastResult?.error?.message,
        });
      }

      for (const child of (spec.suites || []) as Array<typeof spec>) {
        extract(child, suite);
      }
    };

    for (const suite of data.suites) {
      extract(suite, '');
    }

    return {
      framework: 'playwright',
      timestamp: data.stats?.startTime || new Date().toISOString(),
      tests,
      duration: data.stats?.duration || 0,
    };
  }

  private mapStatus(status: string): 'passed' | 'failed' | 'skipped' {
    switch (status) {
      case 'passed':
      case 'expected':
        return 'passed';
      case 'failed':
      case 'unexpected':
      case 'timedOut':
        return 'failed';
      case 'skipped':
      case 'fixme':
        return 'skipped';
      default:
        return 'failed';
    }
  }
}
