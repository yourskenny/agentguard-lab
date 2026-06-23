import type { AgentProfile, EvalCase, EvalResult } from '../domain/types';
import type { FailureDiagnosis } from '../repair/analyzer';
import type { PatchDiff, RepairPatch } from '../repair/advisor';

interface ReportInput {
  agent: AgentProfile;
  patchedAgent?: AgentProfile;
  cases: EvalCase[];
  results: EvalResult[];
  diagnoses: FailureDiagnosis[];
  patches: RepairPatch[];
  patchDiffs?: PatchDiff[];
  retestResults: EvalResult[];
  beforePassRate: number;
  afterPassRate: number;
}

function listOrEmpty(items: string[], empty: string): string[] {
  return items.length > 0 ? items : [`- ${empty}`];
}

function formatTool(agent: AgentProfile): string[] {
  if (agent.tools.length === 0) {
    return ['- 无可用工具'];
  }

  return agent.tools.map(
    (tool) => `- ${tool.name}：${tool.description}；必填参数 ${tool.requiredParams.join(', ') || '无'}`
  );
}

function formatAgentConfig(agent: AgentProfile): string[] {
  return [
    `- Agent：${agent.name}`,
    `- 场景：${agent.scenario}`,
    `- 系统提示词：${agent.systemPrompt}`,
    '- 知识库片段：',
    ...listOrEmpty(agent.knowledgeSnippets.map((item) => `  - ${item}`), '无知识库片段'),
    '- 安全边界：',
    ...listOrEmpty(agent.safetyBoundaries.map((item) => `  - ${item}`), '无安全边界'),
    '- 工具：',
    ...formatTool(agent).map((item) => `  ${item}`)
  ];
}

function formatResult(result: EvalResult): string {
  return `- ${result.dimension}：${result.status}；输出：${result.actualOutput || '空'}；证据：${
    result.evidence.join(' / ') || '无'
  }`;
}

export function createMarkdownReport(input: ReportInput): string {
  const patchDiffs = input.patchDiffs ?? [];
  const lines = [
    `# AgentGuard Lab 评测报告：${input.agent.name}`,
    '',
    `初测通过率：${input.beforePassRate}%`,
    `复测通过率：${input.afterPassRate}%`,
    '',
    '## Agent 配置快照',
    ...formatAgentConfig(input.agent),
    '',
    '## 测试集',
    ...(input.cases.length > 0
      ? input.cases.map((testCase) => `- ${testCase.dimension}：${testCase.expectedBehavior}`)
      : ['- 尚未生成测试集']),
    '',
    '## 初测结果',
    ...(input.results.length > 0
      ? input.results.map(formatResult)
      : ['- 尚未运行初测']),
    '',
    '## 失败归因',
    ...(input.diagnoses.length > 0
      ? input.diagnoses.map((diagnosis) => `- ${diagnosis.failureType}：${diagnosis.explanation}`)
      : ['- 暂无失败归因']),
    '',
    '## 修复建议',
    ...(input.patches.length > 0
      ? input.patches.map((patch) => `- ${patch.patchType}：${patch.after}`)
      : ['- 暂无修复建议']),
    '',
    '## 修复前后配置差异',
    ...(patchDiffs.length > 0
      ? patchDiffs.map(
          (diff) =>
            `- ${diff.targetField}（${diff.patchId}）\n  - Before：${diff.before || '空'}\n  - After：${diff.after || '空'}`
        )
      : ['- 尚未应用修复补丁']),
    '',
    '## 修复后 Agent 配置',
    ...(input.patchedAgent ? formatAgentConfig(input.patchedAgent) : ['- 尚未生成修复后配置']),
    '',
    '## 复测结果',
    ...(input.retestResults.length > 0
      ? input.retestResults.map(formatResult)
      : ['- 尚未复测'])
  ];

  return lines.join('\n');
}
