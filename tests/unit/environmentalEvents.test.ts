import { describe, expect, it } from 'vitest';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
import { getEnvironmentalEvent } from '../../src/simulation/core/environmentalEvents';

describe('environmentalEvents', () => {
  it('returns the same event for the same seed and tick', () => {
    const config = DEFAULT_SIMULATION_CONFIG;

    const first = Array.from({ length: 2000 }, (_, tick) =>
      getEnvironmentalEvent(tick, config),
    );

    const second = Array.from({ length: 2000 }, (_, tick) =>
      getEnvironmentalEvent(tick, config),
    );

    expect(first).toEqual(second);
  });

  it('does not produce events for invalid ticks', () => {
    expect(getEnvironmentalEvent(-1, DEFAULT_SIMULATION_CONFIG)).toBeNull();
    expect(getEnvironmentalEvent(1.5, DEFAULT_SIMULATION_CONFIG)).toBeNull();
  });

  it('returns only supported event types', () => {
    const config = DEFAULT_SIMULATION_CONFIG;
    const validTypes = ['drought', 'heavy_rainfall', 'heatwave'];

    const events = Array.from({ length: 5000 }, (_, tick) =>
      getEnvironmentalEvent(tick, config),
    ).filter((event) => event !== null);

    expect(events.length).toBeGreaterThan(0);

    for (const event of events) {
      expect(validTypes).toContain(event.type);
    }
  });

  it('keeps event intensity between 0.5 and 1.0', () => {
    const config = DEFAULT_SIMULATION_CONFIG;

    const events = Array.from({ length: 5000 }, (_, tick) =>
      getEnvironmentalEvent(tick, config),
    ).filter((event) => event !== null);

    for (const event of events) {
      expect(event.intensity).toBeGreaterThanOrEqual(0.5);
      expect(event.intensity).toBeLessThanOrEqual(1);
    }
  });

  it('keeps events within their seasonal cycle', () => {
    const config = DEFAULT_SIMULATION_CONFIG;

    const events = Array.from({ length: 5000 }, (_, tick) =>
      getEnvironmentalEvent(tick, config),
    ).filter((event) => event !== null);

    for (const event of events) {
      const cycle = Math.floor(event.startTick / config.seasonLengthTicks);
      const cycleEnd = (cycle + 1) * config.seasonLengthTicks;

      expect(event.startTick).toBeLessThan(event.endTick);
      expect(event.endTick).toBeLessThanOrEqual(cycleEnd);
    }
  });
});