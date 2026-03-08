import * as fs from 'fs';
import * as path from 'path';
import { DashboardData } from '../core/types';
import { logger } from '../utils/logger';

export class JsonReporter {
  private outputPath: string;

  constructor(outputPath?: string) {
    this.outputPath = outputPath || '.qa-dash/reports/dashboard.json';
  }

  report(data: DashboardData): void {
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.outputPath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`JSON report saved to ${this.outputPath}`);
  }
}
