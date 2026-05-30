"use client";

import { useEffect, useState } from "react";

function getNow() {
  const now = new Date();

  return {
    time: new Intl.DateTimeFormat("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Manila",
    }).format(now),
    date: new Intl.DateTimeFormat("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    }).format(now),
  };
}

export function LiveClock() {
  const [current, setCurrent] = useState(getNow);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrent(getNow()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="header-clock">
      <div className="clock-time">{current.time}</div>
      <div className="clock-date">{current.date}</div>
    </div>
  );
}
