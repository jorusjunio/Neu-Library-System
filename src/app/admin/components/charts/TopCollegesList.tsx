import { Building2 } from "lucide-react";
import type { CSSProperties } from "react";
import { maxCount } from "../../lib/format";
import type { CountRow } from "../../types";
import { ChartEmptyState } from "./ChartEmptyState";

export function TopCollegesList({ rows }: { rows: CountRow[] }) {
  if (rows.length === 0) {
    return (
      <ChartEmptyState
        icon={Building2}
        title="No college visits yet"
        subtitle="Top colleges will be ranked here once visits are recorded."
      />
    );
  }

  const collegeMax = maxCount(rows);
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="metric-list">
      {rows.map((row, index) => {
        const percent = total ? Math.round((row.count / total) * 100) : 0;
        const fillWidth = Math.max(row.count ? 3 : 0, (row.count / collegeMax) * 100);
        const rowStyle = { "--rank-delay": `${index * 0.07}s` } as CSSProperties;

        return (
          <div className="metric-row" key={row.label} style={rowStyle}>
            <span className="metric-rank">{index + 1}</span>
            <div className="metric-row-body">
              <div className="metric-row-head">
                <span className="metric-row-name" title={row.label}>{row.label}</span>
                <span className="metric-row-percent">{percent}%</span>
              </div>
              <div className="metric-track">
                <i style={{ width: `${fillWidth}%` }} />
              </div>
            </div>
            <strong>{row.count}</strong>
          </div>
        );
      })}
    </div>
  );
}
