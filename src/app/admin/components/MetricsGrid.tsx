import type { IconComponent } from "../types";

export type StatCard = {
  icon: IconComponent;
  tone: string;
  value: string | number;
  label: string;
};

export function MetricsGrid({ stats }: { stats: StatCard[] }) {
  return (
    <div className="stat-cards">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <div className={`stat-icon-wrap ${stat.tone}`}>
            <stat.icon size={21} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={String(stat.value)}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
