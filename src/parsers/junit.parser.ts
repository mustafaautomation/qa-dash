import { XMLParser } from 'fast-xml-parser';
import { BaseParser, ParsedFrameworkResult } from './base.parser';
import { UnifiedTestResult } from '../core/types';

export class JUnitParser extends BaseParser {
  framework = 'junit' as const;

  canParse(content: string): boolean {
    return (
      content.trimStart().startsWith('<?xml') ||
      content.includes('<testsuites') ||
      content.includes('<testsuite')
    );
  }

  parse(content: string): ParsedFrameworkResult {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const data = parser.parse(content);
    const tests: UnifiedTestResult[] = [];
    let totalDuration = 0;
    let timestamp = new Date().toISOString();

    const suites = this.extractSuites(data);

    for (const suite of suites) {
      if (suite['@_timestamp']) timestamp = suite['@_timestamp'];

      const cases = this.toArray(suite.testcase);
      for (const tc of cases) {
        const duration = Math.round(parseFloat(tc['@_time'] || '0') * 1000);
        totalDuration += duration;

        let status: 'passed' | 'failed' | 'skipped' = 'passed';
        let error: string | undefined;

        if (tc.skipped !== undefined) {
          status = 'skipped';
        } else if (tc.failure !== undefined) {
          status = 'failed';
          error =
            typeof tc.failure === 'string'
              ? tc.failure
              : tc.failure['@_message'] || tc.failure['#text'];
        } else if (tc.error !== undefined) {
          status = 'failed';
          error =
            typeof tc.error === 'string' ? tc.error : tc.error['@_message'] || tc.error['#text'];
        }

        tests.push({
          name: tc['@_name'],
          suite: tc['@_classname'] || suite['@_name'],
          framework: 'junit',
          status,
          duration,
          error,
        });
      }
    }

    return {
      framework: 'junit',
      timestamp,
      tests,
      duration: totalDuration,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractSuites(data: any): any[] {
    if (data.testsuites?.testsuite) return this.toArray(data.testsuites.testsuite);
    if (data.testsuite) return this.toArray(data.testsuite);
    return [];
  }

  private toArray<T>(item: T | T[] | undefined): T[] {
    if (!item) return [];
    return Array.isArray(item) ? item : [item];
  }
}
