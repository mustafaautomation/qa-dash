import { FrameworkSummary, TrendPoint } from '../core/types';
import { ParsedFrameworkResult } from '../parsers/base.parser';

export abstract class BaseStorage {
  abstract init(): void;
  abstract storeRun(result: ParsedFrameworkResult): void;
  abstract getLatestSummaries(): FrameworkSummary[];
  abstract getTrends(days: number): TrendPoint[];
  abstract close(): void;
}
