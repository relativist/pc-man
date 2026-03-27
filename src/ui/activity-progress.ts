import { useEffect, useState } from "react";

import type { ActivityTimer } from "../domain";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatRemainingDuration(remainingMs: number): string {
  if (remainingMs <= 60_000) {
    return "< 1 мин";
  }

  const totalMinutes = Math.ceil(remainingMs / 60_000);

  if (totalMinutes < 60) {
    return `${totalMinutes} мин`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${minutes} мин`;
}

export function useNow(intervalMs: number = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => window.clearInterval(timerId);
  }, [intervalMs]);

  return now;
}

export function getActivityProgress(timer: ActivityTimer, now: Date) {
  const startedAt = new Date(timer.startedAt).getTime();
  const endsAt = new Date(timer.endsAt).getTime();
  const totalMs = Math.max(1, endsAt - startedAt);
  const elapsedMs = clamp(now.getTime() - startedAt, 0, totalMs);
  const remainingMs = Math.max(0, endsAt - now.getTime());
  const percent = clamp(Math.round((elapsedMs / totalMs) * 100), 0, 100);

  return {
    percent,
    remainingLabel: formatRemainingDuration(remainingMs),
  };
}
