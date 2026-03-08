import { BaseParser, ParsedFrameworkResult } from './base.parser';
import { UnifiedTestResult } from '../core/types';

interface NewmanResult {
  collection?: { info?: { name?: string } };
  run?: {
    timings?: { started?: number; completed?: number };
    executions?: Array<{
      item?: { name?: string };
      assertions?: Array<{
        assertion: string;
        error?: { message?: string };
      }>;
      response?: { responseTime?: number };
    }>;
    stats?: {
      assertions?: { total: number; pending: number; failed: number };
    };
  };
}

export class NewmanParser extends BaseParser {
  framework = 'newman' as const;

  canParse(content: string): boolean {
    try {
      const data = JSON.parse(content);
      return data.collection !== undefined && data.run !== undefined;
    } catch {
      return false;
    }
  }

  parse(content: string): ParsedFrameworkResult {
    const data: NewmanResult = JSON.parse(content);
    const tests: UnifiedTestResult[] = [];
    const collectionName = data.collection?.info?.name || 'Newman Collection';
    let totalDuration = 0;

    for (const execution of data.run?.executions || []) {
      const requestName = execution.item?.name || 'Unknown Request';
      const responseTime = execution.response?.responseTime || 0;
      totalDuration += responseTime;

      for (const assertion of execution.assertions || []) {
        tests.push({
          name: assertion.assertion,
          suite: `${collectionName} > ${requestName}`,
          framework: 'newman',
          status: assertion.error ? 'failed' : 'passed',
          duration: responseTime,
          error: assertion.error?.message,
        });
      }
    }

    const started = data.run?.timings?.started;
    const completed = data.run?.timings?.completed;

    return {
      framework: 'newman',
      timestamp: started ? new Date(started).toISOString() : new Date().toISOString(),
      tests,
      duration: started && completed ? completed - started : totalDuration,
    };
  }
}
