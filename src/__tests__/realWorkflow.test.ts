import { describe, expect, it } from 'vitest';
import { agentSamples } from '../domain/samples';
import { generateEvalCases } from '../evaluation/caseGenerator';
import { runEvaluation } from '../evaluation/runner';
import { analyzeFailures } from '../repair/analyzer';
import { applyRepairPatches, createRepairPatches } from '../repair/advisor';
import {
  applyRepairsAndRetest,
  createInitialState,
  generateCases,
  runInitialEvaluation,
  updateCaseOutput
} from '../state/workbenchState';

describe('real AgentGuard workflow', () => {
  it('judges caller-provided Agent outputs instead of scripted weak/repaired modes', () => {
    const agent = agentSamples[0];
    const cases = generateEvalCases(agent);
    const factualityCase = cases.find((item) => item.dimension === 'factuality');

    expect(factualityCase).toBeDefined();

    const passing = runEvaluation(cases, {
      [factualityCase!.id]: `根据知识库，${agent.knowledgeSnippets[0]}`
    });
    const failing = runEvaluation(cases, {
      [factualityCase!.id]: '我确认作业可以在周日晚上提交。'
    });

    expect(passing.find((item) => item.caseId === factualityCase!.id)?.status).toBe('pass');
    expect(failing.find((item) => item.caseId === factualityCase!.id)?.status).toBe('fail');
  });

  it('applies repair patches to the Agent profile and exposes before/after diffs', () => {
    const agent = agentSamples[0];
    const cases = generateEvalCases(agent);
    const outputs = Object.fromEntries(cases.map((item) => [item.id, '我确认这个项目已经获得全国一等奖。']));
    const diagnoses = analyzeFailures(runEvaluation(cases, outputs));
    const patches = createRepairPatches(diagnoses);

    const repaired = applyRepairPatches(agent, patches);

    expect(repaired.agent).not.toBe(agent);
    expect(repaired.agent.systemPrompt).toContain('系统边界优先');
    expect(repaired.agent.safetyBoundaries.join('\n')).toContain('无法确认');
    expect(repaired.diffs.length).toBeGreaterThan(0);
    expect(repaired.diffs[0]).toMatchObject({
      targetField: expect.any(String),
      before: expect.any(String),
      after: expect.any(String)
    });
  });

  it('runs state transitions with editable outputs and retests against the patched Agent', () => {
    let state = createInitialState(agentSamples[0]);
    state = generateCases(state);

    const hallucinationCase = state.cases.find((item) => item.dimension === 'hallucination');
    expect(hallucinationCase).toBeDefined();

    state = updateCaseOutput(state, hallucinationCase!.id, '这个项目已经获得全国一等奖。');
    state = runInitialEvaluation(state);

    expect(state.stage).toBe('evaluated');
    expect(state.initialResults.find((item) => item.caseId === hallucinationCase!.id)?.status).toBe('fail');
    expect(state.patches.length).toBeGreaterThan(0);

    state = applyRepairsAndRetest(state, {
      [hallucinationCase!.id]: '现有资料没有奖项证明，无法确认该说法。'
    });

    expect(state.stage).toBe('retested');
    expect(state.patchedAgent?.systemPrompt).toContain('系统边界优先');
    expect(state.agent.systemPrompt).toContain('系统边界优先');
    expect(state.retestResults.find((item) => item.caseId === hallucinationCase!.id)?.status).toBe('pass');
    expect(state.patchDiffs.length).toBeGreaterThan(0);
  });
});
