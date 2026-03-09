export type Framework = 'playwright' | 'jest' | 'newman' | 'k6' | 'junit' | 'custom';

export interface UnifiedTestResult {
  name: string;
  suite: string;
  framework: Framework;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface FrameworkSummary {
  framework: Framework;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  duration: number;
  timestamp: string;
}

export interface DashboardData {
  timestamp: string;
  frameworks: FrameworkSummary[];
  tests: UnifiedTestResult[];
  healthScore: HealthScore;
  totals: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    totalDuration: number;
  };
}

export interface HealthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    passRate: { score: number; weight: number };
    frameworkMinimums: { score: number; weight: number };
    trendDirection: { score: number; weight: number };
    coverageHealth: { score: number; weight: number };
  };
}

export interface TrendPoint {
  date: string;
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

export interface DashConfig {
  parsers: ('auto' | Framework)[];
  storage: {
    path: string;
  };
  reporters: ReporterConfig[];
  outputDir: string;
  serve?: {
    port: number;
  };
}

export interface ReporterConfig {
  type: 'console' | 'json' | 'html' | 'github';
  outputPath?: string;
}

export const DEFAULT_CONFIG: DashConfig = {
  parsers: ['auto'],
  storage: {
    path: '.qa-dash/data.json',
  },
  reporters: [{ type: 'console' }],
  outputDir: '.qa-dash/reports',
  serve: {
    port: 3939,
  },
};
