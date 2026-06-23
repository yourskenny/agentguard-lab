import { describe, expect, it } from 'vitest';
import { agentSamples } from '../domain/samples';
import {
  applyRepairsAndRetest,
  createInitialState,
  generateCases,
  runInitialEvaluation
} from '../state/workbenchState';

describe('workbench workflow', () => {
  it('runs from sample selection to improved retest score', () => {
    let state = createInitialState(agentSamples[0]);
    state = generateCases(state);
    state = runInitialEvaluation(state);
    state = applyRepairsAndRetest(state);

    expect(state.cases).toHaveLength(6);
    expect(state.beforePassRate).toBeLessThan(state.afterPassRate);
    expect(state.patches.length).toBeGreaterThan(0);
    expect(state.retestResults.every((result) => result.status === 'pass')).toBe(true);
  });
});
