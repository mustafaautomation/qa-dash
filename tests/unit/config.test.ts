import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadConfig, writeDefaultConfig } from '../../src/core/config';
import { DEFAULT_CONFIG } from '../../src/core/types';

const TMP = path.join(__dirname, '.tmp-config');

afterEach(() => {
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
});

describe('loadConfig', () => {
  it('should return defaults when no config file', () => {
    const config = loadConfig();
    expect(config.outputDir).toBe(DEFAULT_CONFIG.outputDir);
    expect(config.reporters).toBeDefined();
    expect(config.parsers).toBeDefined();
  });

  it('should load JSON config file', () => {
    fs.mkdirSync(TMP, { recursive: true });
    const configPath = path.join(TMP, 'test-config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ outputDir: '/custom/output', parsers: ['playwright'] }),
    );

    const config = loadConfig(configPath);
    expect(config.outputDir).toBe('/custom/output');
    expect(config.parsers).toEqual(['playwright']);
  });

  it('should merge with defaults', () => {
    fs.mkdirSync(TMP, { recursive: true });
    const configPath = path.join(TMP, 'partial.json');
    fs.writeFileSync(configPath, JSON.stringify({ outputDir: '/partial' }));

    const config = loadConfig(configPath);
    expect(config.outputDir).toBe('/partial');
    expect(config.storage).toBeDefined(); // from defaults
  });

  it('should throw for invalid JSON', () => {
    fs.mkdirSync(TMP, { recursive: true });
    const configPath = path.join(TMP, 'bad.json');
    fs.writeFileSync(configPath, '{ invalid json');

    expect(() => loadConfig(configPath)).toThrow('Invalid JSON');
  });
});

describe('writeDefaultConfig', () => {
  it('should write config to file', () => {
    const configPath = path.join(TMP, 'default.json');
    writeDefaultConfig(configPath);

    expect(fs.existsSync(configPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(content.outputDir).toBeDefined();
    expect(content.reporters).toBeDefined();
  });

  it('should create nested directories', () => {
    const configPath = path.join(TMP, 'deep', 'nested', 'config.json');
    writeDefaultConfig(configPath);
    expect(fs.existsSync(configPath)).toBe(true);
  });
});
