import { BaseParser, ParsedFrameworkResult } from './base.parser';
import { UnifiedTestResult } from '../core/types';

interface CustomResult {
  framework?: string;
  qa_dash?: boolean;
  timestamp?: string;
  tests: Array<{
    name: string;
    suite?: string;
    status: string;
    duration?: number;
    error?: string;
  }>;
}

export class CustomParser extends BaseParser {
  framework = 'custom' as const;

  canParse(content: string): boolean {
    try {
      const data = JSON.parse(content);
      return data.qa_dash === true && Array.isArray(data.tests);
    } catch {
      return false;
    }
  }

  parse(content: string): ParsedFrameworkResult {
    const data: CustomResult = JSON.parse(content);
    const tests: UnifiedTestResult[] = [];
    let totalDuration = 0;

    for (const test of data.tests) {
      const duration = test.duration || 0;
      totalDuration += duration;

      tests.push({
        name: test.name,
        suite: test.suite || 'Custom',
        framework: 'custom',
        status: this.mapStatus(test.status),
        duration,
        error: test.error,
      });
    }

    return {
      framework: 'custom',
      timestamp: data.timestamp || new Date().toISOString(),
      tests,
      duration: totalDuration,
    };
  }

  private mapStatus(status: string): 'passed' | 'failed' | 'skipped' {
    switch (status.toLowerCase()) {
      case 'passed': case 'pass': case 'success': return 'passed';
      case 'failed': case 'fail': case 'error': return 'failed';
      case 'skipped': case 'skip': case 'pending': return 'skipped';
      default: return 'failed';
    }
  }
}
