export interface MetricComparison {
  baseline: number;
  experiment: number;
  difference: number;
  percentageChange: number | null;
}

export function compareMetric(
  baseline: number,
  experiment: number,
): MetricComparison {
  if (!Number.isFinite(baseline) || !Number.isFinite(experiment)) {
    throw new Error('Metric values must be finite numbers.');
  }

  const difference = experiment - baseline;

  const percentageChange =
    baseline === 0
      ? null
      : (difference / Math.abs(baseline)) * 100;

  return {
    baseline,
    experiment,
    difference,
    percentageChange,
  };
}