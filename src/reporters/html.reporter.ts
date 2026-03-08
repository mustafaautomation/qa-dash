import * as fs from 'fs';
import * as path from 'path';
import { DashboardData, FrameworkSummary } from '../core/types';
import { pieChart, barChart, lineChart } from '../utils/charts';
import { logger } from '../utils/logger';

export class HtmlReporter {
  private outputPath: string;

  constructor(outputPath?: string) {
    this.outputPath = outputPath || '.qa-dash/reports/dashboard.html';
  }

  report(data: DashboardData): void {
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const html = this.generateHtml(data);
    fs.writeFileSync(this.outputPath, html, 'utf-8');
    logger.info(`HTML dashboard saved to ${this.outputPath}`);
  }

  private generateHtml(data: DashboardData): string {
    const { totals, healthScore } = data;
    const gradeColor = { A: '#3fb950', B: '#3fb950', C: '#d29922', D: '#d29922', F: '#f85149' }[healthScore.grade];
    const rateClass = totals.passRate >= 0.9 ? 'pass' : totals.passRate >= 0.7 ? 'warn' : 'fail';

    const pieSvg = pieChart(
      data.frameworks.map((f) => ({ label: f.framework, value: f.total }))
    );

    const barSvg = barChart(
      data.frameworks.map((f) => ({ label: f.framework, value: Math.round(f.passRate * 100) })),
      { colors: data.frameworks.map((f) => f.passRate >= 0.9 ? '#3fb950' : f.passRate >= 0.7 ? '#d29922' : '#f85149') }
    );

    const failures = data.tests.filter((t) => t.status === 'failed');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QA Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 24px; }
  .container { max-width: 1100px; margin: 0 auto; }
  h1 { color: #f0f6fc; margin-bottom: 8px; font-size: 24px; }
  h2 { color: #f0f6fc; font-size: 18px; margin-bottom: 16px; }
  .meta { color: #8b949e; font-size: 14px; margin-bottom: 24px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 32px; }
  .stat { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-value { font-size: 28px; font-weight: 700; }
  .stat-label { color: #8b949e; font-size: 12px; text-transform: uppercase; margin-top: 4px; }
  .pass { color: #3fb950; }
  .fail { color: #f85149; }
  .warn { color: #d29922; }
  .grade { font-size: 48px; font-weight: 800; }
  .section { margin-bottom: 32px; }
  .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  .chart-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; }
  .chart-card h3 { color: #8b949e; font-size: 12px; text-transform: uppercase; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 12px; background: #161b22; border: 1px solid #30363d; color: #8b949e; font-size: 12px; text-transform: uppercase; }
  td { padding: 10px 12px; border: 1px solid #21262d; font-size: 14px; }
  tr:hover td { background: #161b22; }
  .breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .breakdown-item { font-size: 13px; }
  .breakdown-label { color: #8b949e; }
  .bar-track { display: inline-block; width: 60px; height: 6px; background: #21262d; border-radius: 3px; vertical-align: middle; margin-left: 8px; }
  .bar-fill { display: block; height: 100%; border-radius: 3px; }
  .footer { text-align: center; color: #484f58; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #21262d; }
</style>
</head>
<body>
<div class="container">
  <h1>QA Dashboard</h1>
  <div class="meta">${this.esc(data.timestamp)}</div>

  <div class="summary">
    <div class="stat">
      <div class="stat-value grade" style="color:${gradeColor}">${healthScore.grade}</div>
      <div class="stat-label">Health Grade</div>
    </div>
    <div class="stat">
      <div class="stat-value">${totals.total}</div>
      <div class="stat-label">Total Tests</div>
    </div>
    <div class="stat">
      <div class="stat-value pass">${totals.passed}</div>
      <div class="stat-label">Passed</div>
    </div>
    <div class="stat">
      <div class="stat-value fail">${totals.failed}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat">
      <div class="stat-value ${rateClass}">${(totals.passRate * 100).toFixed(1)}%</div>
      <div class="stat-label">Pass Rate</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.frameworks.length}</div>
      <div class="stat-label">Frameworks</div>
    </div>
  </div>

  <div class="charts">
    <div class="chart-card">
      <h3>Tests by Framework</h3>
      ${pieSvg}
    </div>
    <div class="chart-card">
      <h3>Pass Rate by Framework</h3>
      ${barSvg}
    </div>
  </div>

  <div class="section">
    <h2>Health Score Breakdown</h2>
    <div class="stat" style="display:inline-block; margin-bottom:16px">
      <div class="stat-value" style="color:${gradeColor}">${(healthScore.score * 100).toFixed(0)}%</div>
      <div class="stat-label">Overall Score</div>
    </div>
    <div class="breakdown">
      ${this.renderBreakdownItem('Pass Rate', healthScore.breakdown.passRate.score, '40%')}
      ${this.renderBreakdownItem('Framework Mins', healthScore.breakdown.frameworkMinimums.score, '20%')}
      ${this.renderBreakdownItem('Trend Direction', healthScore.breakdown.trendDirection.score, '20%')}
      ${this.renderBreakdownItem('Error Absence', healthScore.breakdown.errorAbsence.score, '20%')}
    </div>
  </div>

  <div class="section">
    <h2>Framework Summary</h2>
    ${this.renderFrameworkTable(data.frameworks)}
  </div>

  ${failures.length > 0 ? `
  <div class="section">
    <h2>Failed Tests (${failures.length})</h2>
    <table>
      <thead><tr><th>Framework</th><th>Test</th><th>Suite</th><th>Error</th></tr></thead>
      <tbody>
        ${failures.slice(0, 20).map((t) => `
        <tr>
          <td>${this.esc(t.framework)}</td>
          <td>${this.esc(t.name)}</td>
          <td>${this.esc(t.suite)}</td>
          <td style="color:#f85149">${this.esc((t.error || '').substring(0, 100))}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="footer">Generated by qa-dash</div>
</div>
</body>
</html>`;
  }

  private renderBreakdownItem(label: string, score: number, weight: string): string {
    const color = score >= 0.8 ? '#3fb950' : score >= 0.6 ? '#d29922' : '#f85149';
    return `
    <div class="breakdown-item">
      <span class="breakdown-label">${label} (${weight}):</span>
      <strong style="color:${color}">${(score * 100).toFixed(0)}%</strong>
      <span class="bar-track"><span class="bar-fill" style="width:${score * 100}%;background:${color}"></span></span>
    </div>`;
  }

  private renderFrameworkTable(frameworks: FrameworkSummary[]): string {
    return `
    <table>
      <thead><tr><th>Framework</th><th>Tests</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th><th>Duration</th></tr></thead>
      <tbody>
        ${frameworks.map((f) => {
          const rateColor = f.passRate >= 0.9 ? '#3fb950' : f.passRate >= 0.7 ? '#d29922' : '#f85149';
          return `
        <tr>
          <td><strong>${this.esc(f.framework)}</strong></td>
          <td>${f.total}</td>
          <td class="pass">${f.passed}</td>
          <td class="fail">${f.failed}</td>
          <td>${f.skipped}</td>
          <td style="color:${rateColor}">${(f.passRate * 100).toFixed(1)}%</td>
          <td>${f.duration}ms</td>
        </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  }

  private esc(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
