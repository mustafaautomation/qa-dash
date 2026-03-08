import { describe, it, expect } from 'vitest';
import { pieChart, barChart, lineChart, sparkline } from '../../src/utils/charts';

describe('charts', () => {
  describe('pieChart', () => {
    it('should generate SVG with slices', () => {
      const svg = pieChart([
        { label: 'Playwright', value: 50 },
        { label: 'Jest', value: 30 },
      ]);
      expect(svg).toContain('<svg');
      expect(svg).toContain('Playwright');
      expect(svg).toContain('Jest');
    });

    it('should handle single item', () => {
      const svg = pieChart([{ label: 'Only', value: 100 }]);
      expect(svg).toContain('circle');
    });

    it('should handle empty data', () => {
      const svg = pieChart([]);
      expect(svg).toContain('<svg');
    });
  });

  describe('barChart', () => {
    it('should generate SVG with bars', () => {
      const svg = barChart([
        { label: 'PW', value: 95 },
        { label: 'Jest', value: 88 },
      ]);
      expect(svg).toContain('<svg');
      expect(svg).toContain('rect');
    });
  });

  describe('lineChart', () => {
    it('should generate SVG with line', () => {
      const svg = lineChart([
        { label: 'Day 1', value: 80 },
        { label: 'Day 2', value: 85 },
        { label: 'Day 3', value: 90 },
      ]);
      expect(svg).toContain('<svg');
      expect(svg).toContain('polyline');
    });

    it('should return empty svg for < 2 points', () => {
      const svg = lineChart([{ label: 'Only', value: 100 }]);
      expect(svg).toContain('<svg');
      expect(svg).not.toContain('polyline');
    });
  });

  describe('sparkline', () => {
    it('should generate small SVG', () => {
      const svg = sparkline([10, 20, 15, 25, 30]);
      expect(svg).toContain('<svg');
      expect(svg).toContain('polyline');
    });

    it('should return empty for < 2 values', () => {
      expect(sparkline([5])).toBe('');
    });
  });
});
