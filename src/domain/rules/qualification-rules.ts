import type { QualificationLevel, QualificationProgress } from "../types";

export const qualificationLevelThresholds: Record<QualificationLevel, { min: number; max: number | null }> = {
  1: { min: 0, max: 79 },
  2: { min: 80, max: 179 },
  3: { min: 180, max: 319 },
  4: { min: 320, max: 499 },
  5: { min: 500, max: null },
};

export function getQualificationLevelByPoints(points: number): QualificationLevel {
  if (points >= qualificationLevelThresholds[5].min) {
    return 5;
  }

  if (points >= qualificationLevelThresholds[4].min) {
    return 4;
  }

  if (points >= qualificationLevelThresholds[3].min) {
    return 3;
  }

  if (points >= qualificationLevelThresholds[2].min) {
    return 2;
  }

  return 1;
}

export function applyQualificationPoints(
  progress: QualificationProgress,
  pointsToAdd: number,
): QualificationProgress {
  const nextPoints = Math.max(0, progress.points + pointsToAdd);

  return {
    ...progress,
    points: nextPoints,
    level: getQualificationLevelByPoints(nextPoints),
  };
}
