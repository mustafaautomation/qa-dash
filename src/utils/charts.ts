export interface ChartOptions {
  width?: number;
  height?: number;
  padding?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#3fb950', '#f85149', '#d29922', '#58a6ff', '#bc8cff', '#f778ba'];

export function pieChart(
  data: Array<{ label: string; value: number }>,
  opts: ChartOptions = {}
): string {
  const { width = 200, height = 200 } = opts;
  const colors = opts.colors || DEFAULT_COLORS;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 10;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return `<svg width="${width}" height="${height}"></svg>`;

  let startAngle = -Math.PI / 2;
  const paths: string[] = [];
  const legends: string[] = [];

  data.forEach((d, i) => {
    const sliceAngle = (d.value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const color = colors[i % colors.length];

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    if (data.length === 1) {
      paths.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`);
    } else {
      paths.push(
        `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}"/>`
      );
    }

    legends.push(
      `<text x="${width + 10}" y="${20 + i * 18}" fill="${color}" font-size="12" font-family="sans-serif">■ ${d.label} (${d.value})</text>`
    );

    startAngle = endAngle;
  });

  return `<svg viewBox="0 0 ${width + 150} ${height}" width="${width + 150}" height="${height}">
  ${paths.join('\n  ')}
  ${legends.join('\n  ')}
</svg>`;
}

export function barChart(
  data: Array<{ label: string; value: number }>,
  opts: ChartOptions = {}
): string {
  const { width = 400, height = 200, padding = 40 } = opts;
  const colors = opts.colors || DEFAULT_COLORS;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(chartWidth / data.length - 4, 8);

  const bars = data.map((d, i) => {
    const barHeight = (d.value / maxVal) * chartHeight;
    const x = padding + i * (chartWidth / data.length) + 2;
    const y = padding + chartHeight - barHeight;
    const color = colors[i % colors.length];

    return `
    <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="2"/>
    <text x="${x + barWidth / 2}" y="${padding + chartHeight + 14}" fill="#8b949e" font-size="10" text-anchor="middle" font-family="sans-serif">${d.label.substring(0, 10)}</text>
    <text x="${x + barWidth / 2}" y="${y - 4}" fill="#c9d1d9" font-size="10" text-anchor="middle" font-family="sans-serif">${d.value}</text>`;
  });

  return `<svg viewBox="0 0 ${width} ${height + 10}" width="${width}" height="${height + 10}">
  <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${padding + chartHeight}" stroke="#30363d" stroke-width="1"/>
  <line x1="${padding}" y1="${padding + chartHeight}" x2="${padding + chartWidth}" y2="${padding + chartHeight}" stroke="#30363d" stroke-width="1"/>
  ${bars.join('\n')}
</svg>`;
}

export function lineChart(
  data: Array<{ label: string; value: number }>,
  opts: ChartOptions & { color?: string } = {}
): string {
  const { width = 400, height = 200, padding = 40, color = '#58a6ff' } = opts;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (data.length < 2) return `<svg width="${width}" height="${height}"></svg>`;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (d.value / maxVal) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${padding + chartHeight} ${points} ${padding + chartWidth},${padding + chartHeight}`;

  const dots = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (d.value / maxVal) * chartHeight;
    return `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
  });

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${padding + chartHeight}" stroke="#30363d" stroke-width="1"/>
  <line x1="${padding}" y1="${padding + chartHeight}" x2="${padding + chartWidth}" y2="${padding + chartHeight}" stroke="#30363d" stroke-width="1"/>
  <polygon points="${areaPoints}" fill="${color}20"/>
  <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/>
  ${dots.join('\n  ')}
  <text x="${padding}" y="${padding - 8}" fill="#8b949e" font-size="10" font-family="sans-serif">${maxVal}</text>
  <text x="${padding}" y="${padding + chartHeight + 16}" fill="#8b949e" font-size="10" font-family="sans-serif">${data[0]?.label || ''}</text>
  <text x="${padding + chartWidth}" y="${padding + chartHeight + 16}" fill="#8b949e" font-size="10" text-anchor="end" font-family="sans-serif">${data[data.length - 1]?.label || ''}</text>
</svg>`;
}

export function sparkline(values: number[], opts: { width?: number; height?: number; color?: string } = {}): string {
  const { width = 80, height = 24, color = '#58a6ff' } = opts;

  if (values.length < 2) return '';

  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - minVal) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5"/>
</svg>`;
}
