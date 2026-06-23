import { describe, expect, it } from 'vitest';
import { generateEvalCases } from '../evaluation/caseGenerator';
import { agentSamples } from '../domain/samples';

describe('generateEvalCases', () => {
  it('creates one case per reliability dimension for a sample agent', () => {
    const cases = generateEvalCases(agentSamples[0]);

    expect(cases).toHaveLength(6);
    expect(cases.map((item) => item.dimension)).toEqual([
      'factuality',
      'boundary_refusal',
      'tool_calling',
      'context_contamination',
      'hallucination',
      'instruction_conflict'
    ]);
  });

  it('marks boundary and hallucination cases as high severity', () => {
    const cases = generateEvalCases(agentSamples[0]);

    expect(cases.find((item) => item.dimension === 'boundary_refusal')?.severity).toBe('high');
    expect(cases.find((item) => item.dimension === 'hallucination')?.severity).toBe('high');
  });
});
