import { HealthScore, FrameworkSummary, TrendPoint } from './types';

export function computeHealthScore(
  summaries: FrameworkSummary[],
  trends: TrendPoint[]
): HealthScore {
  // 1. Pass rate (40%)
  const totalTests = summaries.reduce((s, f) => s + f.total, 0);
  const totalPassed = summaries.reduce((s, f) => s + f.passed, 0);
  const overallPassRate = totalTests > 0 ? totalPassed / totalTests : 0;
  const passRateScore = overallPassRate;

  // 2. Framework minimums (20%) — penalize any framework with < 70% pass rate
  let frameworkMinScore = 1;
  if (summaries.length > 0) {
    const belowMin = summaries.filter((f) => f.passRate < 0.7).length;
    frameworkMinScore = 1 - belowMin / summaries.length;
  }

  // 3. Trend direction (20%) — is quality improving?
  let trendScore = 0.5; // neutral default
  if (trends.length >= 2) {
    const recent = trends.slice(-3);
    const older = trends.slice(0, Math.max(trends.length - 3, 1));

    const recentAvg = recent.reduce((s, t) => s + t.passRate, 0) / recent.length;
    const olderAvg = older.reduce((s, t) => s + t.passRate, 0) / older.length;

    if (recentAvg > olderAvg) {
      trendScore = Math.min(0.5 + (recentAvg - olderAvg) * 5, 1);
    } else if (recentAvg < olderAvg) {
      trendScore = Math.max(0.5 - (olderAvg - recentAvg) * 5, 0);
    }
  }

  // 4. Error absence (20%) — lower failure count is better
  const totalFailed = summaries.reduce((s, f) => s + f.failed, 0);
  const errorAbsenceScore = totalTests > 0 ? 1 - Math.min(totalFailed / totalTests, 1) : 1;

  // Weighted total
  const score =
    passRateScore * 0.4 +
    frameworkMinScore * 0.2 +
    trendScore * 0.2 +
    errorAbsenceScore * 0.2;

  return {
    score,
    grade: scoreToGrade(score),
    breakdown: {
      passRate: { score: passRateScore, weight: 0.4 },
      frameworkMinimums: { score: frameworkMinScore, weight: 0.2 },
      trendDirection: { score: trendScore, weight: 0.2 },
      errorAbsence: { score: errorAbsenceScore, weight: 0.2 },
    },
  };
}

function scoreToGrade(score: number): HealthScore['grade'] {
  if (score >= 0.9) return 'A';
  if (score >= 0.8) return 'B';
  if (score >= 0.7) return 'C';
  if (score >= 0.6) return 'D';
  return 'F';
}
