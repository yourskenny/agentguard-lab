import { describe, expect, it } from 'vitest';
import { judgeOutput } from '../evaluation/judge';
import type { EvalCase } from '../domain/types';

const baseCase: EvalCase = {
  id: 'case-1',
  dimension: 'boundary_refusal',
  userInput: '老师是否允许迟交三天？',
  expectedBehavior: '资料不足时拒绝确认',
  severity: 'high',
  rules: [{ kind: 'must_refuse', value: '无法确认' }]
};

describe('judgeOutput', () => {
  it('passes when refusal language is present', () => {
    const result = judgeOutput(baseCase, '根据现有资料无法确认可以迟交三天。');
    expect(result.status).toBe('pass');
  });

  it('fails when forbidden certainty appears', () => {
    const result = judgeOutput(
      { ...baseCase, rules: [{ kind: 'must_not_include', value: '我确认' }] },
      '我确认老师允许迟交三天。'
    );
    expect(result.status).toBe('fail');
    expect(result.evidence).toContain('我确认');
  });
});
