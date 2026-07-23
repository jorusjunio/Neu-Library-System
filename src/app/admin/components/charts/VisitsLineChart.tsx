import { maxCount } from "../../lib/format";
import type { CountRow } from "../../types";

export function VisitsLineChart({ rows }: { rows: CountRow[] }) {
  const chartRows = rows.length ? rows : [{ label: "No logs", count: 0 }];
  const max = maxCount(chartRows);
  const width = 1000;
  const height = 260;
  const padding = { top: 22, right: 10, bottom: 34, left: 10 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const points = chartRows.map((row, index) => {
    const x = padding.left + (chartRows.length === 1 ? plotWidth / 2 : (index / (chartRows.length - 1)) * plotWidth);
    const y = padding.top + plotHeight - (row.count / max) * plotHeight;

    return { ...row, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding.left},${padding.top + plotHeight} ${polyline} ${padding.left + plotWidth},${padding.top + plotHeight}`;

  return (
    <div className="line-chart-wrap">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Visits per day line chart">
        <defs>
          <linearGradient id="visitsAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4a9eff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding.top + (plotHeight / 3) * line;

          return <line className="line-chart-grid" key={line} x1={padding.left} y1={y} x2={width - padding.right} y2={y} />;
        })}
        <polygon className="line-chart-area" points={area} fill="url(#visitsAreaGradient)" />
        <polyline className="line-chart-stroke" points={polyline} />
        {points.map((point) => (
          <g className="line-chart-point" key={point.label} transform={`translate(${point.x} ${point.y})`}>
            <circle className="line-chart-point-halo" r="10" />
            <circle className="line-chart-point-dot" r="4" />
            <text y="-14">{point.count}</text>
          </g>
        ))}
        {points.map((point) => (
          <text className="line-chart-label" key={`${point.label}-label`} x={point.x} y={height - 13}>
            {point.label.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
