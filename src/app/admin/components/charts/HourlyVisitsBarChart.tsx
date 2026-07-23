"use client";

import { useState } from "react";
import { maxCount } from "../../lib/format";
import type { CountRow } from "../../types";

function barPath(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0.01) return "";

  const radius = Math.min(r, w / 2, h);

  return `M${x},${y + h} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + w - radius} Q${x + w},${y} ${x + w},${y + radius} V${y + h} Z`;
}

function formatHourLabel(label: string) {
  const hour = Number(label);

  if (Number.isNaN(hour)) return label;

  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${displayHour}:00 ${period}`;
}

export function HourlyVisitsBarChart({ rows }: { rows: CountRow[] }) {
  const chartRows = rows.length ? rows : [{ label: "No logs", count: 0 }];
  const max = maxCount(chartRows);
  const width = 1000;
  const height = 220;
  const padding = { top: 20, right: 6, bottom: 28, left: 6 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const gap = chartRows.length > 16 ? 3 : chartRows.length > 8 ? 5 : 9;
  const barWidth = Math.max(2, (plotWidth - gap * (chartRows.length - 1)) / chartRows.length);
  const baseline = padding.top + plotHeight;
  const bars = chartRows.map((row, index) => {
    const barHeight = max ? (row.count / max) * plotHeight : 0;
    const x = padding.left + index * (barWidth + gap);

    return { ...row, x, y: baseline - barHeight, barHeight };
  });
  const labelStep = chartRows.length > 16 ? 3 : chartRows.length > 8 ? 2 : 1;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? bars[activeIndex] : null;
  const activeCenterX = active ? active.x + barWidth / 2 : 0;
  const tooltipTranslateX = active
    ? activeCenterX / width > 0.85
      ? "-100%"
      : activeCenterX / width < 0.1
        ? "0%"
        : "-50%"
    : "-50%";
  const tooltipBelow = active ? active.y / height < 0.3 : false;
  const tooltipTranslateY = tooltipBelow ? "16px" : "calc(-100% - 14px)";

  return (
    <div className="hour-chart-wrap">
      <svg
        className="hour-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Visits by hour bar chart"
        onPointerLeave={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id="hourBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#4a9eff" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="hourBarGradientActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding.top + (plotHeight / 3) * line;

          return <line className="hour-chart-grid" key={line} x1={padding.left} y1={y} x2={width - padding.right} y2={y} />;
        })}
        {bars.map((bar, index) => (
          <path
            key={bar.label}
            className={`hour-chart-bar ${activeIndex === index ? "is-active" : ""}`}
            d={barPath(bar.x, bar.y, barWidth, bar.barHeight, 4)}
            fill={activeIndex === index ? "url(#hourBarGradientActive)" : "url(#hourBarGradient)"}
          />
        ))}
        {bars.map((bar, index) =>
          index % labelStep === 0 ? (
            <text className="hour-chart-label" key={`${bar.label}-label`} x={bar.x + barWidth / 2} y={height - 10}>
              {bar.label}
            </text>
          ) : null,
        )}
        {bars.map((bar, index) => (
          <rect
            key={`${bar.label}-hit`}
            className="hour-chart-hit"
            x={Math.max(0, bar.x - gap / 2)}
            y={0}
            width={barWidth + gap}
            height={height}
            tabIndex={0}
            aria-label={`${formatHourLabel(bar.label)}: ${bar.count} visits`}
            onPointerEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex((current) => (current === index ? null : current))}
          />
        ))}
      </svg>
      {active && (
        <div
          className="hour-chart-tooltip is-visible"
          style={{
            left: `${(activeCenterX / width) * 100}%`,
            top: `${(active.y / height) * 100}%`,
            transform: `translate(${tooltipTranslateX}, ${tooltipTranslateY})`,
          }}
        >
          <span className="hour-chart-tooltip-label">{formatHourLabel(active.label)}</span>
          <strong className="hour-chart-tooltip-value">{active.count} visits</strong>
        </div>
      )}
    </div>
  );
}
