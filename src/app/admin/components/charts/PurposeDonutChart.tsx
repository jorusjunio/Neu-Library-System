import { chartColors } from "../../config";
import { pieBackground } from "../../lib/format";
import type { CountRow } from "../../types";

export function PurposeDonutChart({ rows }: { rows: CountRow[] }) {
  const chartRows = rows.length ? rows : [{ label: "No logs yet", count: 0 }];
  const total = chartRows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="donut-chart-wrap">
      <div className="donut-chart" style={{ background: pieBackground(chartRows) }}>
        <span>{total}</span>
        <small>Visits</small>
      </div>
      <div className="donut-legend">
        {chartRows.map((row, index) => (
          <div className="donut-legend-row" key={row.label}>
            <span className="donut-dot" style={{ background: chartColors[index % chartColors.length] }} />
            <p>{row.label}</p>
            <strong>{row.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
