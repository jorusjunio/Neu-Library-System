"use client";

import { PieChart } from "lucide-react";
import { useState } from "react";
import { chartColors } from "../../config";
import type { CountRow } from "../../types";
import { ChartEmptyState } from "./ChartEmptyState";

const SIZE = 168;
const STROKE = 24;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PurposeDonutChart({ rows }: { rows: CountRow[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
  const gap = rows.length > 1 ? 3 : 0;
  let cursor = 0;
  const segments = rows.map((row, index) => {
    const fraction = total ? row.count / total : 0;
    const length = fraction * CIRCUMFERENCE;
    const dash = Math.max(0, length - gap);
    const offset = -cursor;

    cursor += length;

    return {
      ...row,
      dash,
      gapLen: CIRCUMFERENCE - dash,
      offset,
      percent: Math.round(fraction * 100),
      color: chartColors[index % chartColors.length],
    };
  });

  const active = activeIndex !== null ? segments[activeIndex] : null;

  return (
    <div className="donut-chart-wrap">
      <div className="donut-chart-svg-wrap">
        <svg
          className="donut-chart-svg"
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Purpose breakdown donut chart"
          onPointerLeave={() => setActiveIndex(null)}
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth={STROKE}
            />
            {segments.map((segment, index) => (
              <circle
                key={segment.label}
                className={`donut-segment ${activeIndex === index ? "is-active" : ""}`}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE}
                strokeDasharray={`${segment.dash} ${segment.gapLen}`}
                strokeDashoffset={segment.offset}
                strokeLinecap="round"
                tabIndex={0}
                aria-label={`${segment.label}: ${segment.count} visits, ${segment.percent}%`}
                onPointerEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex((current) => (current === index ? null : current))}
              />
            ))}
          </g>
        </svg>
        <div className="donut-chart-center">
          <span>{active ? active.count : total}</span>
          <small>{active ? active.label : "Visits"}</small>
        </div>
      </div>
      <div className="donut-legend">
        {segments.map((segment, index) => (
          <div
            className={`donut-legend-row ${activeIndex === index ? "is-active" : ""}`}
            key={segment.label}
            onPointerEnter={() => setActiveIndex(index)}
            onPointerLeave={() => setActiveIndex(null)}
          >
            <span className="donut-dot" style={{ background: segment.color }} />
            <p>{segment.label}</p>
            <strong>{segment.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
