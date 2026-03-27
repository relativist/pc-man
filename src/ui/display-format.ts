export function roundUiValue(value: number): number {
  return Math.round(value);
}

export function formatUiPercent(value: number): string {
  return `${roundUiValue(value)}%`;
}

export function formatUiWeight(value: number): string {
  return `${roundUiValue(value)} кг`;
}

export function formatUiAgeYears(value: number): string {
  return `${roundUiValue(value)} лет`;
}
