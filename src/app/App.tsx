
import { useEffect, useRef, useState } from 'react';
import { WorldScene } from './WorldScene';
import { createWorld } from '../simulation/core/createWorld';
import { DEFAULT_SIMULATION_CONFIG } from '../simulation/core/defaultConfig';
import {
  createRootTimeline,
  type TimelineBranch,
} from '../simulation/core/timelineBranch';
import type { SimulationConfig, WorldState } from '../simulation/core/types';
import { ComparisonChart } from './ComparisonChart';

type BranchInfo = {
  id: string;
  parentId: string | null;
  forkTick: number;
  label: string;
};

const BASE_CONFIG: SimulationConfig = { ...DEFAULT_SIMULATION_CONFIG };
const CHECKPOINT_INTERVAL = 10;

export function App() {
  const [rootBranch] = useState(() =>
    createRootTimeline(
      'baseline',
      createWorld(BASE_CONFIG),
      BASE_CONFIG,
      CHECKPOINT_INTERVAL,
    ),
  );

  const branchMap = useRef<Map<string, TimelineBranch>>(new Map());
  if (!branchMap.current.has('baseline')) {
    branchMap.current.set('baseline', rootBranch);
  }

  const [branches, setBranches] = useState<BranchInfo[]>([
    {
      id: 'baseline',
      parentId: null,
      forkTick: 0,
      label: 'Baseline',
    },
  ]);

  const [activeBranchId, setActiveBranchId] = useState('baseline');
  const [world, setWorld] = useState<WorldState>(() => rootBranch.state);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedTick, setSelectedTick] = useState(0);
  const [growthRate, setGrowthRate] = useState(BASE_CONFIG.plantGrowthRate);
  const nextBranchNumber = useRef(1);

  const activeBranch = branchMap.current.get(activeBranchId) ?? rootBranch;
  const latestTick = activeBranch.state.tick;
  const activeInfo = branches.find((branch) => branch.id === activeBranchId);
  const branchStartTick = activeInfo?.forkTick ?? 0;
  const viewingPast = selectedTick < latestTick;

  useEffect(() => {
    if (!playing) return;

    const interval = window.setInterval(() => {
      const branch = branchMap.current.get(activeBranchId);
      if (!branch) return;

      const nextState = branch.advance(1);
      setWorld(nextState);
      setSelectedTick(nextState.tick);
    }, 200 / speed);

    return () => window.clearInterval(interval);
  }, [playing, speed, activeBranchId]);

  function selectTick(tick: number) {
    setPlaying(false);

    try {
      const restored = activeBranch.restoreAt(tick);
      setSelectedTick(tick);
      setWorld(restored);
    } catch (error) {
      console.error('Could not restore timeline tick:', error);
    }
  }

  function selectBranch(id: string) {
    const branch = branchMap.current.get(id);
    if (!branch) return;

    setPlaying(false);
    setActiveBranchId(id);
    setSelectedTick(branch.state.tick);
    setWorld(branch.state);
    setGrowthRate(branch.config.plantGrowthRate);
  }

  function forkFuture() {
    const childId = `branch-${nextBranchNumber.current++}`;

    try {
      const child = activeBranch.fork(childId, selectedTick, {
        plantGrowthRate: growthRate,
      });

      branchMap.current.set(childId, child);

      setBranches((existing) => [
        ...existing,
        {
          id: childId,
          parentId: activeBranchId,
          forkTick: selectedTick,
          label: `Experiment ${nextBranchNumber.current - 1}`,
        },
      ]);

      setActiveBranchId(childId);
      setSelectedTick(selectedTick);
      setWorld(child.state);
      setPlaying(false);
    } catch (error) {
      console.error('Could not fork timeline:', error);
      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not create the branch.',
      );
    }
  }

  function resetBaseline() {
    setPlaying(false);
    selectBranch('baseline');
    setGrowthRate(BASE_CONFIG.plantGrowthRate);
  }

  return (
    <main className="worldline-app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">W</span>
          <div>
            <h1>WORLDLINE</h1>
            <p>ARTIFICIAL-LIFE LABORATORY</p>
          </div>
        </div>

        <div className="live-indicator">
          <span className={`status-dot ${playing ? 'active' : ''}`} />
          {playing ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}
        </div>
      </header>

      <section className="dashboard">
        <div className="intro">
          <div>
            <p className="eyebrow">
              EXPERIMENT 001 · {activeInfo?.label.toUpperCase() ?? 'BASELINE'}
            </p>
            <h2>Observe a world becoming.</h2>
            <p className="subtitle">
              Revisit history, change an ecological parameter, and explore
              an alternate future without changing its parent timeline.
            </p>
          </div>

          <div className="tick-display">
            <span>SIMULATION TICK</span>
            <strong>{world.tick.toLocaleString()}</strong>
          </div>
        </div>

        <div className="metrics">
          <article className="metric-card">
            <span className="metric-symbol plant-symbol">✳</span>
            <p>PLANT BIOMASS</p>
            <strong>{Math.round(world.metrics.plantBiomass).toLocaleString()}</strong>
            <small>Available vegetation</small>
          </article>

          <article className="metric-card">
            <span className="metric-symbol herbivore-symbol">◉</span>
            <p>HERBIVORES</p>
            <strong>{world.metrics.herbivoreCount.toLocaleString()}</strong>
            <small>Primary consumers</small>
          </article>

          <article className="metric-card">
            <span className="metric-symbol predator-symbol">◇</span>
            <p>PREDATORS</p>
            <strong>{world.metrics.predatorCount.toLocaleString()}</strong>
            <small>Secondary consumers</small>
          </article>

          <article className="metric-card">
            <span className="metric-symbol resource-symbol">⌁</span>
            <p>ENVIRONMENTAL RESOURCES</p>
            <strong>{Math.round(world.metrics.availableResources).toLocaleString()}</strong>
            <small>Water + nutrients</small>
          </article>
        </div>

        <section className="simulation-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LIVE SIMULATION</p>
              <h3>The living world</h3>
            </div>
            <span className="world-coordinate">
              {activeBranchId.toUpperCase()} · TICK {world.tick}
            </span>
          </div>

          <WorldScene
            world={world}
            width={BASE_CONFIG.width}
            height={BASE_CONFIG.height}
          />

          <div className="world-legend">
            <span><i className="legend-dot plant-legend" /> Plants</span>
            <span><i className="legend-dot herbivore-legend" /> Herbivores</span>
            <span><i className="legend-dot predator-legend" /> Predators</span>
            <span className="camera-hint">Drag to orbit · Scroll to zoom</span>
          </div>
        </section>

        <section className="control-panel timeline-panel">
          <div className="control-copy">
            <p className="eyebrow">01 / TEMPORAL CONTROLS</p>
            <h3>Explore history</h3>
            <p>
              {viewingPast
                ? `Inspecting tick ${selectedTick}. Fork here to explore a different future.`
                : 'Advance the simulation, or select an earlier tick to inspect history.'}
            </p>
          </div>

          <div className="timeline-range">
            <div className="range-labels">
              <span>Tick {branchStartTick}</span>
              <strong>Viewing: {selectedTick}</strong>
              <span>Latest: {latestTick}</span>
            </div>
            <input
              aria-label="Select historical simulation tick"
              type="range"
              min={branchStartTick}
              max={Math.max(branchStartTick, latestTick)}
              step={1}
              value={Math.min(selectedTick, latestTick)}
              onChange={(event) => selectTick(Number(event.target.value))}
            />
            <p className="timeline-note">
              Checkpoints every {CHECKPOINT_INTERVAL} ticks; intermediate
              states are reconstructed by deterministic replay.
            </p>
          </div>

          <div className="controls">
            <button
              className="primary-button"
              onClick={() => {
                if (viewingPast) {
                  selectTick(latestTick);
                }
                setPlaying((value) => !value);
              }}
            >
              {playing ? 'Ⅱ Pause' : '▶ Play'}
            </button>

            <button
              className="secondary-button"
              disabled={playing || viewingPast}
              onClick={() => {
                const nextState = activeBranch.advance(1);
                setWorld(nextState);
                setSelectedTick(nextState.tick);
              }}
            >
              +1 Tick
            </button>

            <label className="speed-control">
              <span>Speed</span>
              <select
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={4}>4×</option>
              </select>
            </label>
          </div>
        </section>

        <section className="control-panel branch-panel">
          <div className="control-copy">
            <p className="eyebrow">02 / ALTERNATE FUTURES</p>
            <h3>Fork the timeline</h3>
            <p>
              Create an independent branch from the tick you're viewing.
              Change plant growth to test a different ecological condition.
            </p>
          </div>

          <div className="branch-form">
            <label className="growth-input">
              <span>Plant growth rate</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={growthRate}
                onChange={(event) => setGrowthRate(Number(event.target.value))}
              />
            </label>

            <button
              className="primary-button"
              disabled={
                playing ||
                !Number.isFinite(growthRate) ||
                growthRate < 0 ||
                growthRate > 100 ||
                selectedTick < branchStartTick ||
                selectedTick > latestTick
              }
              onClick={forkFuture}
            >
              Fork Future ↗
            </button>
          </div>

          <div className="branch-list">
            <p className="eyebrow">TIMELINE BRANCHES</p>
            {branches.map((branch) => {
              const branchObject = branchMap.current.get(branch.id);
              const isActive = branch.id === activeBranchId;

              return (
                <button
                  key={branch.id}
                  className={`branch-row ${isActive ? 'selected' : ''}`}
                  onClick={() => selectBranch(branch.id)}
                >
                  <span className="branch-icon">
                    {branch.parentId ? '⑂' : '◉'}
                  </span>
                  <span className="branch-details">
                    <strong>{branch.label}</strong>
                    <small>
                      {branch.parentId
                        ? `Forked from ${branch.parentId} at tick ${branch.forkTick}`
                        : 'Original baseline timeline'}
                    </small>
                  </span>
                  <span className="branch-tick">
                    T{branchObject?.state.tick ?? 0}
                  </span>
                  {isActive && <span className="branch-active">ACTIVE</span>}
                </button>
              );
            })}
          </div>

          <div className="controls">
            <button className="secondary-button" onClick={resetBaseline}>
              Return to baseline
            </button>
          </div>
        </section>

        <section className="control-panel">
          <ComparisonChart
            baseline={rootBranch}
            experiment={activeBranch}
          />
        </section>

        <footer className="app-footer">
          <span>WORLDLINE · SIMULATION CORE M1</span>
          <span>SEED {BASE_CONFIG.seed} · DETERMINISTIC TIMELINES</span>
        </footer>
      </section>
    </main>
  );
}
