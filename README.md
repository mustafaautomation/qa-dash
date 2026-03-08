# QA Dash

[![CI](https://github.com/mustafaautomation/qa-dash/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/qa-dash/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](Dockerfile)

Unified QA dashboard that aggregates test results from Playwright, Jest/Vitest, Newman, k6, JUnit, and custom frameworks into a single quality view.

QA teams juggle 5-10 tools with no single quality view. QA Dash auto-detects your test result format, computes a health score, and generates a dashboard with SVG charts.

## Features

- **6 framework parsers** with auto-detection: Playwright, Jest/Vitest, Newman (Postman), k6, JUnit XML, Custom JSON
- **Health score** with letter grade (A-F) weighted across: pass rate (40%), framework minimums (20%), trend direction (20%), error absence (20%)
- **SVG charts** (zero deps): pie, bar, line, sparkline
- **Multiple reporters**: Console (colorized), JSON, HTML (dark dashboard), GitHub (PR comment)
- **Preview server**: Local HTTP server with auto-reload
- **Historical trends** via JSON storage

## Quick Start

```bash
npm install qa-dash

# Initialize config
npx qa-dash init

# Ingest test results (auto-detects framework)
npx qa-dash ingest playwright-results.json jest-results.json newman-results.json

# Generate HTML dashboard
npx qa-dash ingest *.json --reporter html,console

# Start preview server
npx qa-dash serve
```

## CLI Commands

### `ingest <files...>`

Ingest test result files and generate dashboard.

```bash
npx qa-dash ingest results.json [more-results...] [options]

Options:
  -c, --config <path>     Path to config file
  -r, --reporter <type>   console, json, html, github (comma-separated)
  -o, --output <dir>      Output directory (default: .qa-dash/reports)
  -v, --verbose           Enable debug logging
```

### `report`

Generate report from stored historical data.

### `serve`

Start local dashboard preview with auto-reload.

```bash
npx qa-dash serve --port 3939
```

### `trends`

Show quality trends over time.

### `init`

Create default configuration file.

## Supported Formats

| Framework | File Format | Auto-Detection |
|-----------|-------------|----------------|
| Playwright | JSON reporter output | `suites` + `config`/`stats` |
| Jest/Vitest | `--json` reporter output | `numTotalTests` + `testResults` |
| Newman | JSON reporter output | `collection` + `run` |
| k6 | `--summary-export` JSON | `metrics` + `root_group`/`http_reqs` |
| JUnit | XML | `<testsuites>` or `<testsuite>` |
| Custom | JSON with `qa_dash: true` | `qa_dash` flag + `tests` array |

## Health Score

```
Grade A: >= 90%
Grade B: >= 80%
Grade C: >= 70%
Grade D: >= 60%
Grade F: < 60%
```

Weighted formula:
- **Pass Rate** (40%): Overall test pass rate
- **Framework Minimums** (20%): Penalizes any framework < 70%
- **Trend Direction** (20%): Compares recent vs older pass rates
- **Error Absence** (20%): Lower failure rate = better

## Programmatic Usage

```typescript
import { Aggregator, DEFAULT_CONFIG } from 'qa-dash';

const aggregator = new Aggregator(DEFAULT_CONFIG);
aggregator.init();
aggregator.ingest(['./results/playwright.json', './results/jest.json']);

const dashboard = aggregator.getDashboard();
console.log(`Health: ${dashboard.healthScore.grade} (${dashboard.healthScore.score})`);
console.log(`Total: ${dashboard.totals.total}, Passed: ${dashboard.totals.passed}`);

aggregator.close();
```

## License

MIT

---
Built by [Quvantic](https://quvantic.com)
