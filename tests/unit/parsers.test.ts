import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PlaywrightParser } from '../../src/parsers/playwright.parser';
import { JestParser } from '../../src/parsers/jest.parser';
import { NewmanParser } from '../../src/parsers/newman.parser';
import { K6Parser } from '../../src/parsers/k6.parser';
import { JUnitParser } from '../../src/parsers/junit.parser';
import { CustomParser } from '../../src/parsers/custom.parser';

const FIXTURES = path.join(__dirname, 'fixtures');

describe('PlaywrightParser', () => {
  const parser = new PlaywrightParser();

  it('should detect playwright format', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'playwright-result.json'), 'utf-8');
    expect(parser.canParse(content)).toBe(true);
  });

  it('should parse playwright results', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'playwright-result.json'), 'utf-8');
    const result = parser.parse(content);
    expect(result.framework).toBe('playwright');
    expect(result.tests).toHaveLength(3);
    expect(result.tests.filter((t) => t.status === 'passed')).toHaveLength(2);
    expect(result.tests.filter((t) => t.status === 'failed')).toHaveLength(1);
  });
});

describe('JestParser', () => {
  const parser = new JestParser();

  it('should detect jest format', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'jest-result.json'), 'utf-8');
    expect(parser.canParse(content)).toBe(true);
  });

  it('should not detect non-jest format', () => {
    expect(parser.canParse('{"suites": []}')).toBe(false);
  });

  it('should parse jest results', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'jest-result.json'), 'utf-8');
    const result = parser.parse(content);
    expect(result.framework).toBe('jest');
    expect(result.tests).toHaveLength(5);
    expect(result.tests.filter((t) => t.status === 'passed')).toHaveLength(4);
    expect(result.tests.filter((t) => t.status === 'failed')).toHaveLength(1);
  });
});

describe('NewmanParser', () => {
  const parser = new NewmanParser();

  it('should detect newman format', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'newman-result.json'), 'utf-8');
    expect(parser.canParse(content)).toBe(true);
  });

  it('should parse newman results', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'newman-result.json'), 'utf-8');
    const result = parser.parse(content);
    expect(result.framework).toBe('newman');
    expect(result.tests).toHaveLength(4);
    expect(result.tests.filter((t) => t.status === 'passed')).toHaveLength(3);
    expect(result.tests.filter((t) => t.status === 'failed')).toHaveLength(1);
  });
});

describe('K6Parser', () => {
  const parser = new K6Parser();

  it('should detect k6 format', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'k6-result.json'), 'utf-8');
    expect(parser.canParse(content)).toBe(true);
  });

  it('should parse k6 results (checks + thresholds)', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'k6-result.json'), 'utf-8');
    const result = parser.parse(content);
    expect(result.framework).toBe('k6');
    expect(result.tests.length).toBeGreaterThan(0);
  });
});

describe('JUnitParser', () => {
  const parser = new JUnitParser();

  it('should detect junit format', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'junit-result.xml'), 'utf-8');
    expect(parser.canParse(content)).toBe(true);
  });

  it('should parse junit results', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'junit-result.xml'), 'utf-8');
    const result = parser.parse(content);
    expect(result.framework).toBe('junit');
    expect(result.tests).toHaveLength(3);
    expect(result.tests.filter((t) => t.status === 'passed')).toHaveLength(2);
  });
});

describe('CustomParser', () => {
  const parser = new CustomParser();

  it('should detect custom format', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'custom-result.json'), 'utf-8');
    expect(parser.canParse(content)).toBe(true);
  });

  it('should not detect non-custom format', () => {
    expect(parser.canParse('{"tests": []}')).toBe(false);
  });

  it('should parse custom results', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'custom-result.json'), 'utf-8');
    const result = parser.parse(content);
    expect(result.framework).toBe('custom');
    expect(result.tests).toHaveLength(3);
  });
});
