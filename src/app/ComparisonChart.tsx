
import { useMemo, useState } from 'react';
import { compareMetric } from '../simulation/analysis/compareWorlds';
import type { TimelineBranch } from '../simulation/core/timelineBranch';

type Metric = 'plantBiomass' | 'herbivoreCount' | 'predatorCount';

interface ComparisonChartProps {
  baseline: TimelineBranch;
  experiment: TimelineBranch;
}

const METRICS: { value: Metric; label: string }[] = [
  { value: 'plantBiomass', label: 'Plant biomass' },
  { value: 'herbivoreCount', label: 'Herbivores' },
  { value: 'predatorCount', label: 'Predators' },
];

const COLORS = {
  baseline: '#8ca6ff',
  experiment: '#65d99a',
};

export function ComparisonChart({
  baseline,
  experiment,
}: ComparisonChartProps) {
  const [metric, setMetric] = useState<Metric>('herbivoreCount');

  const data = useMemo(() => {
    const start = experiment.forkTick;
    const baselineTick = baseline.state.tick;
    const experimentTick = experiment.state.tick;
    const end = Math.min(baselineTick, experimentTick);

    if (end < start) {
      return [];
    }

    const pointCount = 30;
    const step = Math.max(1, Math.ceil((end - start) / pointCount));
    const ticks: number[] = [];

    for (let tick = start; tick < end; tick += step) {
      ticks.push(tick);
    }

    if (ticks[ticks.length - 1] !== end) {
      ticks.push(end);
    }

    console.log('WORLDLINE comparison data:', ticks);

    return ticks.map((tick) => ({
      tick,
      baseline: baseline.restoreAt(tick).metrics[metric],
      experiment: experiment.restoreAt(tick).metrics[metric],
    }));
  }, [
    baseline,
    experiment,
    metric,
    baseline.state.tick,
    experiment.state.tick,
  ]);
  if (experiment.parentId === null) {
    return (
      <section className="comparison-card">
        <p className="eyebrow">03 / EXPERIMENT ANALYSIS</p>
        <h3>Compare alternate futures</h3>
        <p>Create or select an experimental branch to compare it with Baseline.</p>
      </section>
    );
  }

  const maxValue = Math.max(
    1,
    ...data.map((point) => Math.max(point.baseline, point.experiment)),
  );

  const chartWidth = 720;
  const chartHeight = 240;
  const left = 48;
  const right = 16;
  const top = 18;
  const bottom = 32;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;

  const pointsFor = (key: 'baseline' | 'experiment') =>
    data
      .map((point, index) => {
        const x =
          left +
          (data.length <= 1
            ? plotWidth / 2
            : (index / (data.length - 1)) * plotWidth);
        const y = top + plotHeight - (point[key] / maxValue) * plotHeight;
        return `${x},${y}`;
      })
      .join(' ');

  const comparisonTick = Math.min(
  baseline.state.tick,
  experiment.state.tick,
);

  const baselineValue =
    baseline.restoreAt(comparisonTick).metrics[metric];

  const experimentValue =
    experiment.restoreAt(comparisonTick).metrics[metric];

  const comparison = compareMetric(
    baselineValue,
    experimentValue,
  );

  const {
    baseline: currentBaseline,
    experiment: currentExperiment,
    difference,
    percentageChange,
  } = comparison;

  return (
    <section className="comparison-card">
      <div className="comparison-heading">
        <div>
          <p className="eyebrow">03 / EXPERIMENT ANALYSIS</p>
          <h3>Compare alternate futures</h3>
          <p>Recorded simulation states · Shared history begins at tick {experiment.forkTick}</p>
        </div>

        <label className="growth-input">
          <span>Measure</span>
          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value as Metric)}
          >
            {METRICS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {data.length > 0 ? (
        <>
          <div className="comparison-chart">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={`${METRICS.find((item) => item.value === metric)?.label} comparison between baseline and experiment`}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const y = top + plotHeight * (1 - fraction);

                return (
                  <g key={fraction}>
                    <line
                      x1={left}
                      y1={y}
                      x2={chartWidth - right}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.12"
                    />
                    <text
                      x={left - 8}
                      y={y + 4}
                      fill="currentColor"
                      opacity="0.65"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {Math.round(maxValue * fraction).toLocaleString()}
                    </text>
                  </g>
                );
              })}

              <line
                x1={left}
                y1={top + plotHeight}
                x2={chartWidth - right}
                y2={top + plotHeight}
                stroke="currentColor"
                strokeOpacity="0.35"
              />

              <polyline
                points={pointsFor('baseline')}
                fill="none"
                stroke={COLORS.baseline}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <polyline
                points={pointsFor('experiment')}
                fill="none"
                stroke={COLORS.experiment}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <text
                x={left}
                y={chartHeight - 8}
                fill="currentColor"
                opacity="0.7"
                fontSize="10"
              >
                Tick {data[0]?.tick}
              </text>

              <text
                x={chartWidth - right}
                y={chartHeight - 8}
                fill="currentColor"
                opacity="0.7"
                fontSize="10"
                textAnchor="end"
              >
                Tick {data[data.length - 1]?.tick}
              </text>
            </svg>
          </div>

          <div className="comparison-legend">
            <span>
              <i style={{ background: COLORS.baseline }} />
              Baseline
            </span>
            <span>
              <i style={{ background: COLORS.experiment }} />
              {experiment.id}
            </span>
          </div>

          <div className="comparison-values">
            <div>
              <span>Baseline · Tick {comparisonTick}</span>
              <strong>{currentBaseline.toLocaleString()}</strong>
            </div>

            <div>
              <span>Experiment · Tick {comparisonTick}</span>
              <strong>{currentExperiment.toLocaleString()}</strong>
            </div>

            <div>
              <span>Absolute difference</span>
              <strong>
                {difference > 0 ? '+' : ''}
                {difference.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Change from baseline</span>
              <strong>
                {percentageChange === null
                  ? 'N/A'
                  : `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}%`}
              </strong>
            </div>
          </div>
        </>
      ) : (
        <p>Advance both timelines beyond the fork tick to compare their futures.</p>
      )}
    </section>
  );
}
