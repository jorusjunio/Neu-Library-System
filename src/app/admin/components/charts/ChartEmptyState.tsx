import type { IconComponent } from "../../types";

export function ChartEmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: IconComponent;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="chart-empty-state">
      <div className="chart-empty-icon">
        <Icon size={19} strokeWidth={1.75} />
      </div>
      <p className="chart-empty-title">{title}</p>
      <p className="chart-empty-subtitle">{subtitle}</p>
    </div>
  );
}
