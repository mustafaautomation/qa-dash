import { DashboardData } from '../core/types';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';

const GRADE_COLORS: Record<string, string> = {
  A: GREEN,
  B: GREEN,
  C: YELLOW,
  D: YELLOW,
  F: RED,
};

export class ConsoleReporter {
  report(data: DashboardData): void {
    console.log();
    console.log(`${BOLD}${CYAN}QA Dashboard${RESET}`);
    console.log(`${DIM}${data.timestamp}${RESET}`);
    console.log();

    this.printHealthScore(data);
    this.printTotals(data);
    this.printFrameworks(data);
    this.printFailures(data);
  }

  private printHealthScore(data: DashboardData): void {
    const { grade, score, breakdown } = data.healthScore;
    const color = GRADE_COLORS[grade] || WHITE;

    console.log(`  ${BOLD}Health Score:${RESET}  ${color}${BOLD}${grade}${RESET} ${DIM}(${(score * 100).toFixed(0)}%)${RESET}`);
    console.log(`    Pass Rate:          ${this.bar(breakdown.passRate.score)} ${(breakdown.passRate.score * 100).toFixed(0)}%`);
    console.log(`    Framework Minimums: ${this.bar(breakdown.frameworkMinimums.score)} ${(breakdown.frameworkMinimums.score * 100).toFixed(0)}%`);
    console.log(`    Trend Direction:    ${this.bar(breakdown.trendDirection.score)} ${(breakdown.trendDirection.score * 100).toFixed(0)}%`);
    console.log(`    Error Absence:      ${this.bar(breakdown.errorAbsence.score)} ${(breakdown.errorAbsence.score * 100).toFixed(0)}%`);
    console.log();
  }

  private printTotals(data: DashboardData): void {
    const { totals } = data;
    const rateColor = totals.passRate >= 0.9 ? GREEN : totals.passRate >= 0.7 ? YELLOW : RED;

    console.log(`  ${BOLD}Totals:${RESET}`);
    console.log(`    Tests:     ${WHITE}${totals.total}${RESET}  (${GREEN}${totals.passed} passed${RESET}, ${RED}${totals.failed} failed${RESET}, ${DIM}${totals.skipped} skipped${RESET})`);
    console.log(`    Pass Rate: ${rateColor}${(totals.passRate * 100).toFixed(1)}%${RESET}`);
    console.log(`    Duration:  ${DIM}${totals.totalDuration}ms${RESET}`);
    console.log();
  }

  private printFrameworks(data: DashboardData): void {
    if (data.frameworks.length === 0) return;

    console.log(`  ${BOLD}Frameworks:${RESET}`);
    const header = '    ' + 'Framework'.padEnd(14) + 'Tests'.padEnd(8) + 'Passed'.padEnd(8) + 'Failed'.padEnd(8) + 'Rate'.padEnd(10) + 'Duration';
    console.log(`${DIM}${header}${RESET}`);
    console.log(`${DIM}    ${'─'.repeat(64)}${RESET}`);

    for (const fw of data.frameworks) {
      const rateColor = fw.passRate >= 0.9 ? GREEN : fw.passRate >= 0.7 ? YELLOW : RED;
      console.log(
        `    ${fw.framework.padEnd(14)}${String(fw.total).padEnd(8)}${GREEN}${String(fw.passed).padEnd(8)}${RESET}${RED}${String(fw.failed).padEnd(8)}${RESET}${rateColor}${(fw.passRate * 100).toFixed(1).padEnd(10)}%${RESET}${DIM}${fw.duration}ms${RESET}`
      );
    }
    console.log();
  }

  private printFailures(data: DashboardData): void {
    const failures = data.tests.filter((t) => t.status === 'failed');
    if (failures.length === 0) return;

    console.log(`  ${BOLD}${RED}Failed Tests (${failures.length}):${RESET}`);
    for (const test of failures.slice(0, 10)) {
      console.log(`    ${RED}x${RESET} [${test.framework}] ${test.name} ${DIM}(${test.suite})${RESET}`);
      if (test.error) {
        console.log(`      ${DIM}${test.error.substring(0, 100)}${RESET}`);
      }
    }
    if (failures.length > 10) {
      console.log(`    ${DIM}... and ${failures.length - 10} more${RESET}`);
    }
    console.log();
  }

  private bar(value: number): string {
    const filled = Math.round(value * 10);
    const empty = 10 - filled;
    const color = value >= 0.8 ? GREEN : value >= 0.6 ? YELLOW : RED;
    return `${color}${'█'.repeat(filled)}${DIM}${'░'.repeat(empty)}${RESET}`;
  }
}
