import * as fs from 'fs';
import * as path from 'path';
import { DashConfig, DEFAULT_CONFIG } from './types';
import { logger } from '../utils/logger';

const CONFIG_FILES = ['qa-dash.config.json', 'qa-dash.config.js', '.qa-dash.json'];

export function loadConfig(configPath?: string): DashConfig {
  if (configPath) {
    return readConfigFile(configPath);
  }

  for (const filename of CONFIG_FILES) {
    const fullPath = path.resolve(process.cwd(), filename);
    if (fs.existsSync(fullPath)) {
      logger.debug(`Found config file: ${fullPath}`);
      return readConfigFile(fullPath);
    }
  }

  logger.debug('No config file found, using defaults');
  return { ...DEFAULT_CONFIG };
}

function readConfigFile(filePath: string): DashConfig {
  const ext = path.extname(filePath);
  let userConfig: Partial<DashConfig>;

  if (ext === '.json') {
    const raw = fs.readFileSync(filePath, 'utf-8');
    userConfig = JSON.parse(raw);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    userConfig = require(path.resolve(filePath));
  }

  return mergeConfig(userConfig);
}

function mergeConfig(user: Partial<DashConfig>): DashConfig {
  return {
    parsers: user.parsers || DEFAULT_CONFIG.parsers,
    storage: { ...DEFAULT_CONFIG.storage, ...user.storage },
    reporters: user.reporters || DEFAULT_CONFIG.reporters,
    outputDir: user.outputDir || DEFAULT_CONFIG.outputDir,
    serve: { port: user.serve?.port ?? DEFAULT_CONFIG.serve?.port ?? 3939 },
  };
}

export function writeDefaultConfig(outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (dir !== '.' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  logger.info(`Config written to ${outputPath}`);
}
