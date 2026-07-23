import { maxCount } from "../../lib/format";
import type { CountRow } from "../../types";

export function TopCollegesList({ rows }: { rows: CountRow[] }) {
  const chartRows = rows.length ? rows : [{ label: "No logs yet", count: 0 }];
  const collegeMax = maxCount(chartRows);

  return (
    <div className="metric-list">
      {chartRows.map((row) => (
        <div className="metric-row" key={row.label}>
          <div>
            <span>{row.label}</span>
            <i style={{ width: `${Math.max(4, (row.count / collegeMax) * 100)}%` }} />
          </div>
          <strong>{row.count}</strong>
        </div>
      ))}
    </div>
  );
}
