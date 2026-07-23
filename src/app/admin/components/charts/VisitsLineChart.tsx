"use client";

import { Activity } from "lucide-react";
import { useState } from "react";
import { maxCount } from "../../lib/format";
import type { CountRow } from "../../types";
import { ChartEmptyState } from "./ChartEmptyState";

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) {
    return points.length === 1 ? `M${points[0].x},${points[0].y}` : "";
  }

  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}

function formatTooltipLabel(label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(label)) return label;

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(`${label}T00:00:00+08:00`));
}

export function VisitsLineChart({ rows }: { rows: CountRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="line-chart-wrap">
        <ChartEmptyState
          icon={Activity}
          title="No visits recorded yet"
          subtitle="Daily visit trends will appear here once logs come in."
        />
      </div>
    );
  }

  const chartRows = rows;
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
  const linePath = smoothPath(points);
  const baseline = padding.top + plotHeight;
  const areaPath = `${linePath} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`;
  const bands = points.map((point, index) => {
    const prev = points[index - 1];
    const next = points[index + 1];
    const bandStart = prev ? (prev.x + point.x) / 2 : 0;
    const bandEnd = next ? (next.x + point.x) / 2 : width;

    return { ...point, bandStart, bandEnd };
  });

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const tooltipTranslateX = activePoint
    ? activePoint.x / width > 0.82
      ? "-100%"
      : activePoint.x / width < 0.12
        ? "0%"
        : "-50%"
    : "-50%";
  const tooltipBelow = activePoint ? activePoint.y / height < 0.3 : false;
  const tooltipTranslateY = tooltipBelow ? "16px" : "calc(-100% - 16px)";

  return (
    <div className="line-chart-wrap">
      <svg
        className="line-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Visits per day line chart"
        onPointerLeave={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id="visitsAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#4a9eff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding.top + (plotHeight / 3) * line;

          return <line className="line-chart-grid" key={line} x1={padding.left} y1={y} x2={width - padding.right} y2={y} />;
        })}
        <path className="line-chart-area" d={areaPath} fill="url(#visitsAreaGradient)" />
        <path className="line-chart-stroke" d={linePath} />
        {activePoint && (
          <line
            className="line-chart-crosshair"
            x1={activePoint.x}
            y1={padding.top}
            x2={activePoint.x}
            y2={baseline}
          />
        )}
        {points.map((point, index) => (
          <g className={`line-chart-point ${activeIndex === index ? "is-active" : ""}`} key={point.label} transform={`translate(${point.x} ${point.y})`}>
            <circle className="line-chart-point-halo" r="11" />
            <circle className="line-chart-point-dot" r="3.5" />
          </g>
        ))}
        {bands.map((band, index) => (
          <rect
            key={`${band.label}-hit`}
            className="line-chart-hit"
            x={band.bandStart}
            y={0}
            width={Math.max(0, band.bandEnd - band.bandStart)}
            height={height}
            tabIndex={0}
            aria-label={`${band.label}: ${band.count} visits`}
            onPointerEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex((current) => (current === index ? null : current))}
          />
        ))}
      </svg>
      <div className="chart-axis">
        {points.map((point) => (
          <span key={`${point.label}-axis`} className="chart-axis-label" style={{ left: `${(point.x / width) * 100}%` }}>
            {point.label.slice(5)}
          </span>
        ))}
      </div>
      {activePoint && (
        <div
          className="line-chart-tooltip is-visible"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.y / height) * 100}%`,
            transform: `translate(${tooltipTranslateX}, ${tooltipTranslateY})`,
          }}
        >
          <span className="line-chart-tooltip-label">{formatTooltipLabel(activePoint.label)}</span>
          <strong className="line-chart-tooltip-value">{activePoint.count} visits</strong>
        </div>
      )}
    </div>
  );
}
