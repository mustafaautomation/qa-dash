import { BaseParser, ParsedFrameworkResult } from './base.parser';
import { UnifiedTestResult } from '../core/types';

interface JestResult {
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
  startTime: number;
  testResults: Array<{
    testFilePath?: string;
    name?: string;
    testResults?: Array<{
      ancestorTitles: string[];
      title: string;
      status: string;
      duration: number | null;
      failureMessages?: string[];
    }>;
    assertionResults?: Array<{
      ancestorTitles: string[];
      title: string;
      status: string;
      duration: number | null;
      failureMessages?: string[];
    }>;
  }>;
}

export class JestParser extends BaseParser {
  framework = 'jest' as const;

  canParse(content: string): boolean {
    try {
      const data = JSON.parse(content);
      return (
        data.numTotalTests !== undefined &&
        data.testResults !== undefined &&
        Array.isArray(data.testResults)
      );
    } catch {
      return false;
    }
  }

  parse(content: string): ParsedFrameworkResult {
    const data: JestResult = JSON.parse(content);
    const tests: UnifiedTestResult[] = [];
    let totalDuration = 0;

    for (const file of data.testResults) {
      const results = file.testResults || file.assertionResults || [];
      for (const test of results) {
        const duration = test.duration || 0;
        totalDuration += duration;

        tests.push({
          name: test.title,
          suite: test.ancestorTitles.join(' > ') || file.testFilePath || file.name || 'unknown',
          framework: 'jest',
          status: this.mapStatus(test.status),
          duration,
          error: test.failureMessages?.join('\n'),
        });
      }
    }

    return {
      framework: 'jest',
      timestamp: data.startTime ? new Date(data.startTime).toISOString() : new Date().toISOString(),
      tests,
      duration: totalDuration,
    };
  }

  private mapStatus(status: string): 'passed' | 'failed' | 'skipped' {
    switch (status) {
      case 'passed':
        return 'passed';
      case 'failed':
        return 'failed';
      case 'pending':
      case 'skipped':
      case 'todo':
        return 'skipped';
      default:
        return 'failed';
    }
  }
}
