import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ParserRegistry } from '../../src/parsers/registry';

const FIXTURES = path.join(__dirname, 'fixtures');

describe('ParserRegistry', () => {
  it('should auto-detect playwright', () => {
    const registry = new ParserRegistry();
    const content = fs.readFileSync(path.join(FIXTURES, 'playwright-result.json'), 'utf-8');
    const parser = registry.detect(content);
    expect(parser).not.toBeNull();
    expect(parser?.framework).toBe('playwright');
  });

  it('should auto-detect jest', () => {
    const registry = new ParserRegistry();
    const content = fs.readFileSync(path.join(FIXTURES, 'jest-result.json'), 'utf-8');
    const parser = registry.detect(content);
    expect(parser).not.toBeNull();
    expect(parser?.framework).toBe('jest');
  });

  it('should auto-detect newman', () => {
    const registry = new ParserRegistry();
    const content = fs.readFileSync(path.join(FIXTURES, 'newman-result.json'), 'utf-8');
    const parser = registry.detect(content);
    expect(parser?.framework).toBe('newman');
  });

  it('should auto-detect junit', () => {
    const registry = new ParserRegistry();
    const content = fs.readFileSync(path.join(FIXTURES, 'junit-result.xml'), 'utf-8');
    const parser = registry.detect(content);
    expect(parser?.framework).toBe('junit');
  });

  it('should auto-detect k6', () => {
    const registry = new ParserRegistry();
    const content = fs.readFileSync(path.join(FIXTURES, 'k6-result.json'), 'utf-8');
    const parser = registry.detect(content);
    expect(parser?.framework).toBe('k6');
  });

  it('should auto-detect custom', () => {
    const registry = new ParserRegistry();
    const content = fs.readFileSync(path.join(FIXTURES, 'custom-result.json'), 'utf-8');
    const parser = registry.detect(content);
    expect(parser?.framework).toBe('custom');
  });

  it('should return null for unknown format', () => {
    const registry = new ParserRegistry();
    expect(registry.detect('random text')).toBeNull();
  });

  it('should filter by framework list', () => {
    const registry = new ParserRegistry(['playwright', 'jest']);
    expect(registry.getAll()).toHaveLength(2);
  });
});
