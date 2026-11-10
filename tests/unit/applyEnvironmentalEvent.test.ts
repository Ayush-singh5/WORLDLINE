import { describe, expect, it } from 'vitest';
import {
  applyEnvironmentalEvent,
  type EnvironmentalConditions,
} from '../../src/simulation/core/environmentalModel';
import type { EnvironmentalEvent } from '../../src/simulation/core/environmentalEvents';

describe('applyEnvironmentalEvent', () => {
  const conditions: EnvironmentalConditions = {
    temperature: 20,
    rainfall: 0.5,
    season: 'summer',
  };

  it('reduces rainfall during a drought', () => {
    const event: EnvironmentalEvent = {
      type: 'drought',
      startTick: 10,
      endTick: 20,
      intensity: 1,
    };

    const result = applyEnvironmentalEvent(conditions, event);

    expect(result.rainfall).toBeCloseTo(0.1);
    expect(result.temperature).toBe(20);
  });

  it('increases rainfall during heavy rainfall', () => {
    const event: EnvironmentalEvent = {
      type: 'heavy_rainfall',
      startTick: 10,
      endTick: 20,
      intensity: 1,
    };

    const result = applyEnvironmentalEvent(conditions, event);

    expect(result.rainfall).toBeCloseTo(1.5);
    expect(result.temperature).toBe(20);
  });

  it('increases temperature during a heatwave', () => {
    const event: EnvironmentalEvent = {
      type: 'heatwave',
      startTick: 10,
      endTick: 20,
      intensity: 1,
    };

    const result = applyEnvironmentalEvent(conditions, event);

    expect(result.temperature).toBe(25);
    expect(result.rainfall).toBe(0.5);
  });

  it('scales event effects according to intensity', () => {
    const event: EnvironmentalEvent = {
      type: 'heatwave',
      startTick: 10,
      endTick: 20,
      intensity: 0.5,
    };

    const result = applyEnvironmentalEvent(conditions, event);

    expect(result.temperature).toBe(22.5);
  });

  it('leaves conditions unchanged when there is no event', () => {
    const result = applyEnvironmentalEvent(conditions, null);

    expect(result).toEqual(conditions);
    expect(result).not.toBe(conditions);
  });

  it('does not mutate the original conditions', () => {
    const original = { ...conditions };

    const event: EnvironmentalEvent = {
      type: 'drought',
      startTick: 10,
      endTick: 20,
      intensity: 0.8,
    };

    applyEnvironmentalEvent(conditions, event);

    expect(conditions).toEqual(original);
  });

  it('preserves the current season', () => {
    const event: EnvironmentalEvent = {
      type: 'heatwave',
      startTick: 10,
      endTick: 20,
      intensity: 1,
    };

    const result = applyEnvironmentalEvent(conditions, event);

    expect(result.season).toBe('summer');
  });
});