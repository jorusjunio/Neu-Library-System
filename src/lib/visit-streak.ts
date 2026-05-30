function manilaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function manilaDayNumber(date: Date) {
  const parts = manilaDateParts(date);
  return Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000;
}

export function getNextVisitStreak(lastVisitAt: Date | null, currentStreak: number, now = new Date()) {
  if (!lastVisitAt) {
    return 1;
  }

  const dayGap = manilaDayNumber(now) - manilaDayNumber(lastVisitAt);

  if (dayGap === 0) {
    return currentStreak;
  }

  if (dayGap === 1) {
    return currentStreak + 1;
  }

  return 1;
}
