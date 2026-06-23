import type { AgentProfile, FailureType, ToolSpec } from '../domain/types';
import type { FailureDiagnosis } from './analyzer';

export interface RepairPatch {
  id: string;
  patchType:
    | 'knowledge_patch'
    | 'system_prompt_patch'
    | 'tool_schema_patch'
    | 'boundary_rule_patch'
    | 'context_policy_patch';
  targetField: 'knowledgeSnippets' | 'systemPrompt' | 'tools' | 'safetyBoundaries' | 'history';
  before: string;
  after: string;
  expectedImpact: string;
}

export interface PatchDiff {
  patchId: string;
  targetField: RepairPatch['targetField'];
  before: string;
  after: string;
}

const patchByFailure: Record<FailureType, Omit<RepairPatch, 'id'>> = {
  knowledge_gap: {
    patchType: 'knowledge_patch',
    targetField: 'knowledgeSnippets',
    before: '知识片段没有被设置为回答依据。',
    after: '把关键事实写成可引用条目，并要求回答复述知识库原文。',
    expectedImpact: '提升事实一致性测试通过率。'
  },
  prompt_conflict: {
    patchType: 'system_prompt_patch',
    targetField: 'systemPrompt',
    before: '系统提示词没有处理用户指令冲突。',
    after: '加入“系统边界优先于用户指令，越界请求必须拒绝”的规则。',
    expectedImpact: '降低指令冲突失败率。'
  },
  tool_schema_ambiguity: {
    patchType: 'tool_schema_patch',
    targetField: 'tools',
    before: '工具触发条件和必填参数说明不完整。',
    after: '补全工具调用条件、必填参数和调用前置判断。',
    expectedImpact: '提升工具调用测试通过率。'
  },
  boundary_missing: {
    patchType: 'boundary_rule_patch',
    targetField: 'safetyBoundaries',
    before: '缺少资料不足时的拒答规则。',
    after: '加入“资料不足时必须说明无法确认，不输出无依据确认”的边界规则。',
    expectedImpact: '提升边界拒答测试通过率。'
  },
  context_pollution: {
    patchType: 'context_policy_patch',
    targetField: 'history',
    before: '历史错误信息可能污染当前回答。',
    after: '加入“当前资料优先，旧对话仅作参考且不得覆盖事实证据”的上下文策略。',
    expectedImpact: '降低上下文污染失败率。'
  },
  unsupported_claim: {
    patchType: 'system_prompt_patch',
    targetField: 'systemPrompt',
    before: '允许输出无依据奖项、成绩或背书。',
    after: '要求所有奖项、数字、经历和结论必须来自资料；缺证据时说无法确认。',
    expectedImpact: '降低幻觉和无依据背书风险。'
  }
};

export function createRepairPatches(diagnoses: FailureDiagnosis[]): RepairPatch[] {
  return diagnoses.map((diagnosis) => ({
    id: `patch-${diagnosis.resultId}`,
    ...patchByFailure[diagnosis.failureType]
  }));
}

function appendUnique(items: string[], value: string): string[] {
  return items.includes(value) ? items : [...items, value];
}

function updateToolDescription(tools: ToolSpec[], addition: string): ToolSpec[] {
  if (tools.length === 0) {
    return [
      {
        name: 'manualEvidenceCheck',
        description: addition,
        requiredParams: ['evidence']
      }
    ];
  }

  const [first, ...rest] = tools;
  return [
    {
      ...first,
      description: first.description.includes(addition) ? first.description : `${first.description}；${addition}`
    },
    ...rest
  ];
}

export function applyRepairPatches(
  agent: AgentProfile,
  patches: RepairPatch[]
): { agent: AgentProfile; diffs: PatchDiff[] } {
  let nextAgent: AgentProfile = {
    ...agent,
    knowledgeSnippets: [...agent.knowledgeSnippets],
    tools: agent.tools.map((tool) => ({ ...tool, requiredParams: [...tool.requiredParams] })),
    history: agent.history.map((message) => ({ ...message })),
    safetyBoundaries: [...agent.safetyBoundaries]
  };
  const diffs: PatchDiff[] = [];

  for (const patch of patches) {
    if (patch.targetField === 'systemPrompt') {
      const before = nextAgent.systemPrompt;
      nextAgent = {
        ...nextAgent,
        systemPrompt: before.includes(patch.after) ? before : `${before}\n${patch.after}`
      };
      diffs.push({ patchId: patch.id, targetField: patch.targetField, before, after: nextAgent.systemPrompt });
    }

    if (patch.targetField === 'safetyBoundaries') {
      const before = nextAgent.safetyBoundaries.join('\n');
      nextAgent = {
        ...nextAgent,
        safetyBoundaries: appendUnique(nextAgent.safetyBoundaries, patch.after)
      };
      diffs.push({
        patchId: patch.id,
        targetField: patch.targetField,
        before,
        after: nextAgent.safetyBoundaries.join('\n')
      });
    }

    if (patch.targetField === 'knowledgeSnippets') {
      const before = nextAgent.knowledgeSnippets.join('\n');
      nextAgent = {
        ...nextAgent,
        knowledgeSnippets: appendUnique(nextAgent.knowledgeSnippets, patch.after)
      };
      diffs.push({
        patchId: patch.id,
        targetField: patch.targetField,
        before,
        after: nextAgent.knowledgeSnippets.join('\n')
      });
    }

    if (patch.targetField === 'tools') {
      const before = JSON.stringify(nextAgent.tools);
      nextAgent = {
        ...nextAgent,
        tools: updateToolDescription(nextAgent.tools, patch.after)
      };
      diffs.push({ patchId: patch.id, targetField: patch.targetField, before, after: JSON.stringify(nextAgent.tools) });
    }

    if (patch.targetField === 'history') {
      const before = nextAgent.history.map((message) => `${message.role}:${message.content}`).join('\n');
      nextAgent = {
        ...nextAgent,
        history: appendUnique(
          nextAgent.history.map((message) => JSON.stringify(message)),
          JSON.stringify({ role: 'system', content: patch.after })
        ).map((message) => JSON.parse(message))
      };
      diffs.push({
        patchId: patch.id,
        targetField: patch.targetField,
        before,
        after: nextAgent.history.map((message) => `${message.role}:${message.content}`).join('\n')
      });
    }
  }

  return { agent: nextAgent, diffs };
}
