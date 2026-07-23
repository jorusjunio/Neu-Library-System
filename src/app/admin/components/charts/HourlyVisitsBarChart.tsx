import { maxCount } from "../../lib/format";
import type { CountRow } from "../../types";

export function HourlyVisitsBarChart({ rows }: { rows: CountRow[] }) {
  const chartRows = rows.length ? rows : [{ label: "No logs", count: 0 }];
  const hourMax = maxCount(chartRows);

  return (
    <div className="real-chart bars compact">
      {chartRows.map((row) => (
        <span key={row.label} style={{ height: `${Math.max(6, (row.count / hourMax) * 100)}%` }}>
          <strong>{row.count}</strong>
          <small>{row.label}</small>
        </span>
      ))}
    </div>
  );
}
