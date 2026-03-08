import { UnifiedTestResult, Framework } from '../core/types';

export interface ParsedFrameworkResult {
  framework: Framework;
  timestamp: string;
  tests: UnifiedTestResult[];
  duration: number;
  metadata?: Record<string, unknown>;
}

export abstract class BaseParser {
  abstract framework: Framework;
  abstract canParse(content: string): boolean;
  abstract parse(content: string): ParsedFrameworkResult;
}
