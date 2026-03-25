import type { QualificationLevel } from "../types";

export const orderDurationRangesByLevel: Record<
  QualificationLevel,
  { minDays: number; maxDays: number }
> = {
  1: { minDays: 1, maxDays: 2 },
  2: { minDays: 3, maxDays: 7 },
  3: { minDays: 8, maxDays: 14 },
  4: { minDays: 15, maxDays: 21 },
  5: { minDays: 22, maxDays: 30 },
};

export const pcScoreRangesByOrderLevel: Record<
  QualificationLevel,
  { minScore: number; maxScore: number }
> = {
  1: { minScore: 9, maxScore: 80 },
  2: { minScore: 81, maxScore: 140 },
  3: { minScore: 141, maxScore: 200 },
  4: { minScore: 201, maxScore: 260 },
  5: { minScore: 261, maxScore: 360 },
};

export function getOrderLevelByPcScore(score: number): QualificationLevel | null {
  if (score < pcScoreRangesByOrderLevel[1].minScore) {
    return null;
  }

  if (score <= pcScoreRangesByOrderLevel[1].maxScore) {
    return 1;
  }

  if (score <= pcScoreRangesByOrderLevel[2].maxScore) {
    return 2;
  }

  if (score <= pcScoreRangesByOrderLevel[3].maxScore) {
    return 3;
  }

  if (score <= pcScoreRangesByOrderLevel[4].maxScore) {
    return 4;
  }

  if (score <= pcScoreRangesByOrderLevel[5].maxScore) {
    return 5;
  }

  return 5;
}

export function isPcScoreEligibleForOrderLevel(
  score: number,
  level: QualificationLevel,
): boolean {
  const range = pcScoreRangesByOrderLevel[level];
  return score >= range.minScore && score <= range.maxScore;
}

export function isOrderDurationValidForLevel(
  level: QualificationLevel,
  durationDays: number,
): boolean {
  const range = orderDurationRangesByLevel[level];
  return durationDays >= range.minDays && durationDays <= range.maxDays;
}
