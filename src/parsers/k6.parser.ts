import { BaseParser, ParsedFrameworkResult } from './base.parser';
import { UnifiedTestResult } from '../core/types';

interface K6Result {
  metrics?: Record<
    string,
    {
      type: string;
      contains?: string;
      values?: Record<string, number>;
      thresholds?: Record<string, { ok: boolean }>;
    }
  >;
  root_group?: {
    name: string;
    checks?: Array<{
      name: string;
      passes: number;
      fails: number;
    }>;
    groups?: Array<{
      name: string;
      checks?: Array<{
        name: string;
        passes: number;
        fails: number;
      }>;
    }>;
  };
}

export class K6Parser extends BaseParser {
  framework = 'k6' as const;

  canParse(content: string): boolean {
    try {
      const data = JSON.parse(content);
      return (
        data.metrics !== undefined &&
        (data.root_group !== undefined || data.metrics.http_reqs !== undefined)
      );
    } catch {
      return false;
    }
  }

  parse(content: string): ParsedFrameworkResult {
    const data: K6Result = JSON.parse(content);
    const tests: UnifiedTestResult[] = [];

    // Parse checks from root_group
    if (data.root_group) {
      this.extractChecks(data.root_group.name || 'k6', data.root_group.checks || [], tests);

      for (const group of data.root_group.groups || []) {
        this.extractChecks(group.name, group.checks || [], tests);
      }
    }

    // Parse threshold metrics as tests
    if (data.metrics) {
      for (const [name, metric] of Object.entries(data.metrics)) {
        if (metric.thresholds) {
          for (const [threshold, result] of Object.entries(metric.thresholds)) {
            tests.push({
              name: `${name}: ${threshold}`,
              suite: 'k6 Thresholds',
              framework: 'k6',
              status: result.ok ? 'passed' : 'failed',
              duration: 0,
              metadata: { metricValues: metric.values },
            });
          }
        }
      }
    }

    const httpDuration = data.metrics?.http_req_duration?.values?.avg || 0;

    return {
      framework: 'k6',
      timestamp: new Date().toISOString(),
      tests,
      duration: httpDuration,
      metadata: {
        httpReqs: data.metrics?.http_reqs?.values?.count,
        avgDuration: httpDuration,
        p95Duration: data.metrics?.http_req_duration?.values?.['p(95)'],
      },
    };
  }

  private extractChecks(
    suite: string,
    checks: Array<{ name: string; passes: number; fails: number }>,
    tests: UnifiedTestResult[],
  ): void {
    for (const check of checks) {
      tests.push({
        name: check.name,
        suite,
        framework: 'k6',
        status: check.fails === 0 ? 'passed' : 'failed',
        duration: 0,
        metadata: { passes: check.passes, fails: check.fails },
      });
    }
  }
}
