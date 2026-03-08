// Core
export { Aggregator } from './core/aggregator';
export { loadConfig, writeDefaultConfig } from './core/config';
export { computeHealthScore } from './core/health';
export {
  Framework,
  UnifiedTestResult,
  FrameworkSummary,
  DashboardData,
  HealthScore,
  TrendPoint,
  DashConfig,
  ReporterConfig,
  DEFAULT_CONFIG,
} from './core/types';

// Parsers
export { BaseParser, ParsedFrameworkResult } from './parsers/base.parser';
export { ParserRegistry } from './parsers/registry';
export { PlaywrightParser } from './parsers/playwright.parser';
export { JestParser } from './parsers/jest.parser';
export { NewmanParser } from './parsers/newman.parser';
export { K6Parser } from './parsers/k6.parser';
export { JUnitParser } from './parsers/junit.parser';
export { CustomParser } from './parsers/custom.parser';

// Storage
export { BaseStorage } from './storage/base.storage';
export { JsonStorage } from './storage/json.storage';

// Reporters
export { ConsoleReporter } from './reporters/console.reporter';
export { JsonReporter } from './reporters/json.reporter';
export { HtmlReporter } from './reporters/html.reporter';
export { GithubReporter } from './reporters/github.reporter';

// Server
export { startPreviewServer } from './server/preview';

// Utils
export { logger, setLogLevel, getLogLevel } from './utils/logger';
export { pieChart, barChart, lineChart, sparkline } from './utils/charts';
