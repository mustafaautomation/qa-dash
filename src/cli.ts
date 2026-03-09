#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import { loadConfig, writeDefaultConfig } from './core/config';
import { Aggregator } from './core/aggregator';
import { ConsoleReporter } from './reporters/console.reporter';
import { JsonReporter } from './reporters/json.reporter';
import { HtmlReporter } from './reporters/html.reporter';
import { GithubReporter } from './reporters/github.reporter';
import { startPreviewServer } from './server/preview';
import { setLogLevel } from './utils/logger';
import { DashboardData } from './core/types';

const program = new Command();

program
  .name('qa-dash')
  .description('Unified QA dashboard aggregating results from multiple test frameworks')
  .version('2.0.0');

program
  .command('ingest')
  .description('Ingest test results from one or more frameworks')
  .argument('<files...>', 'Test result files')
  .option('-c, --config <path>', 'Path to config file')
  .option(
    '-r, --reporter <type>',
    'Reporter: console, json, html, github (comma-separated)',
    'console',
  )
  .option('-o, --output <dir>', 'Output directory', '.qa-dash/reports')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((files: string[], options) => {
    if (options.verbose) setLogLevel('debug');

    const config = loadConfig(options.config);
    const aggregator = new Aggregator(config);
    aggregator.init();
    aggregator.ingest(files);

    const dashboard = aggregator.getDashboard();
    runReporters(options.reporter, options.output, dashboard);
    aggregator.close();
  });

program
  .command('report')
  .description('Generate report from stored data')
  .option('-c, --config <path>', 'Path to config file')
  .option(
    '-r, --reporter <type>',
    'Reporter: console, json, html, github (comma-separated)',
    'console',
  )
  .option('-o, --output <dir>', 'Output directory', '.qa-dash/reports')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((options) => {
    if (options.verbose) setLogLevel('debug');

    const config = loadConfig(options.config);
    const aggregator = new Aggregator(config);
    aggregator.init();

    const dashboard = aggregator.getDashboard();
    runReporters(options.reporter, options.output, dashboard);
    aggregator.close();
  });

program
  .command('serve')
  .description('Start local dashboard preview server')
  .option('-c, --config <path>', 'Path to config file')
  .option('-p, --port <number>', 'Port number', '3939')
  .option('-o, --output <dir>', 'Reports directory', '.qa-dash/reports')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((options) => {
    if (options.verbose) setLogLevel('debug');

    const htmlPath = path.join(options.output, 'dashboard.html');
    const port = parseInt(options.port, 10);
    startPreviewServer(htmlPath, port);
  });

program
  .command('trends')
  .description('Show quality trends over time')
  .option('-c, --config <path>', 'Path to config file')
  .option('-r, --reporter <type>', 'Reporter: console, html (comma-separated)', 'console')
  .option('-o, --output <dir>', 'Output directory', '.qa-dash/reports')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((options) => {
    if (options.verbose) setLogLevel('debug');

    const config = loadConfig(options.config);
    const aggregator = new Aggregator(config);
    aggregator.init();

    const dashboard = aggregator.getDashboard();
    runReporters(options.reporter, options.output, dashboard);
    aggregator.close();
  });

program
  .command('init')
  .description('Initialize qa-dash configuration')
  .action(() => {
    writeDefaultConfig('qa-dash.config.json');
    console.log('Done! Edit qa-dash.config.json and run:');
    console.log('  npx qa-dash ingest <test-results...>');
  });

function runReporters(reporterStr: string, outputDir: string, data: DashboardData): void {
  const types = reporterStr.split(',').map((t: string) => t.trim());

  for (const type of types) {
    switch (type) {
      case 'console':
        new ConsoleReporter().report(data);
        break;
      case 'json':
        new JsonReporter(path.join(outputDir, 'dashboard.json')).report(data);
        break;
      case 'html':
        new HtmlReporter(path.join(outputDir, 'dashboard.html')).report(data);
        break;
      case 'github': {
        const md = new GithubReporter().report(data);
        console.log(md);
        break;
      }
      default:
        console.error(`Unknown reporter type: "${type}". Valid: console, json, html, github`);
    }
  }
}

program.parse();
