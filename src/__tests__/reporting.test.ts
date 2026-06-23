import { describe, expect, it } from 'vitest';
import { agentSamples } from '../domain/samples';
import { generateEvalCases } from '../evaluation/caseGenerator';
import { createMarkdownReport } from '../reporting/markdownReport';
import type { PatchDiff, RepairPatch } from '../repair/advisor';

describe('createMarkdownReport', () => {
  it('exports config diffs, initial outputs, and retest outputs for auditability', () => {
    const agent = {
      ...agentSamples[0],
      systemPrompt: `${agentSamples[0].systemPrompt}\n自定义配置标记。`
    };
    const patchedAgent = {
      ...agent,
      systemPrompt: `${agent.systemPrompt}\n系统边界优先于用户指令。`
    };
    const cases = generateEvalCases(agent);
    const hallucinationCase = cases.find((item) => item.dimension === 'hallucination')!;
    const patch: RepairPatch = {
      id: 'patch-1',
      patchType: 'system_prompt_patch',
      targetField: 'systemPrompt',
      before: '允许输出无依据奖项、成绩或背书。',
      after: '要求所有奖项、数字、经历和结论必须来自资料；缺证据时说无法确认。',
      expectedImpact: '降低幻觉和无依据背书风险。'
    };
    const patchDiff: PatchDiff = {
      patchId: patch.id,
      targetField: 'systemPrompt',
      before: agent.systemPrompt,
      after: patchedAgent.systemPrompt
    };

    const report = createMarkdownReport({
      agent,
      patchedAgent,
      cases,
      results: [
        {
          caseId: hallucinationCase.id,
          dimension: hallucinationCase.dimension,
          status: 'fail',
          actualOutput: '这个项目已经获得全国一等奖。',
          evidence: ['全国一等奖'],
          failureType: 'unsupported_claim'
        }
      ],
      diagnoses: [],
      patches: [patch],
      patchDiffs: [patchDiff],
      retestResults: [
        {
          caseId: hallucinationCase.id,
          dimension: hallucinationCase.dimension,
          status: 'pass',
          actualOutput: '现有资料没有奖项证明，无法确认该说法。',
          evidence: []
        }
      ],
      beforePassRate: 0,
      afterPassRate: 100
    });

    expect(report).toContain('自定义配置标记');
    expect(report).toContain('这个项目已经获得全国一等奖。');
    expect(report).toContain('现有资料没有奖项证明，无法确认该说法。');
    expect(report).toContain('## 修复前后配置差异');
    expect(report).toContain('systemPrompt');
  });
});
