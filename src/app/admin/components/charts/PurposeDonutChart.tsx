import { PieChart } from "lucide-react";
import { chartColors } from "../../config";
import { pieBackground } from "../../lib/format";
import type { CountRow } from "../../types";
import { ChartEmptyState } from "./ChartEmptyState";

export function PurposeDonutChart({ rows }: { rows: CountRow[] }) {
  if (rows.length === 0) {
    return (
      <ChartEmptyState
        icon={PieChart}
        title="No purpose data yet"
        subtitle="Visit purposes will break down here once visitors check in."
      />
    );
  }

  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="donut-chart-wrap">
      <div className="donut-chart" style={{ background: pieBackground(rows) }}>
        <span>{total}</span>
        <small>Visits</small>
      </div>
      <div className="donut-legend">
        {rows.map((row, index) => (
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
