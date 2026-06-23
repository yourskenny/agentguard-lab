import type { AgentProfile, EvalCase, EvalResult } from '../domain/types';
import type { FailureDiagnosis } from '../repair/analyzer';
import type { RepairPatch } from '../repair/advisor';

interface ReportInput {
  agent: AgentProfile;
  cases: EvalCase[];
  results: EvalResult[];
  diagnoses: FailureDiagnosis[];
  patches: RepairPatch[];
  retestResults: EvalResult[];
  beforePassRate: number;
  afterPassRate: number;
}

export function createMarkdownReport(input: ReportInput): string {
  const lines = [
    `# AgentGuard Lab 评测报告：${input.agent.name}`,
    '',
    `场景：${input.agent.scenario}`,
    '',
    `初测通过率：${input.beforePassRate}%`,
    `复测通过率：${input.afterPassRate}%`,
    '',
    '## 测试集',
    ...(input.cases.length > 0
      ? input.cases.map((testCase) => `- ${testCase.dimension}：${testCase.expectedBehavior}`)
      : ['- 尚未生成测试集']),
    '',
    '## 初测结果',
    ...(input.results.length > 0
      ? input.results.map((result) => `- ${result.dimension}：${result.status}；证据 ${result.evidence.join(' / ') || '无'}`)
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
    '## 复测结果',
    ...(input.retestResults.length > 0
      ? input.retestResults.map((result) => `- ${result.dimension}：${result.status}`)
      : ['- 尚未复测'])
  ];

  return lines.join('\n');
}
