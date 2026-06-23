import type { EvalDimension, EvalResult, FailureType } from '../domain/types';
import { failureTypeForDimension } from '../evaluation/judge';

export interface FailureDiagnosis {
  resultId: string;
  dimension: EvalDimension;
  failureType: FailureType;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

const explanationByFailure: Record<FailureType, string> = {
  knowledge_gap: '回答没有稳定绑定知识库事实，容易把缺失信息补成看似合理的结论。',
  prompt_conflict: '系统边界没有被明确置顶，用户越界指令可能覆盖可靠性规则。',
  tool_schema_ambiguity: '工具调用条件和必填参数不清楚，Agent 容易跳过验证步骤。',
  boundary_missing: '资料不足时缺少拒答模板，导致 Agent 输出未经证实的确认性回答。',
  context_pollution: '历史对话中的错误信息没有被隔离，污染了当前事实判断。',
  unsupported_claim: '输出了资料中不存在的奖项或背书，属于典型幻觉风险。'
};

const severityByFailure: Record<FailureType, FailureDiagnosis['severity']> = {
  knowledge_gap: 'medium',
  prompt_conflict: 'medium',
  tool_schema_ambiguity: 'medium',
  boundary_missing: 'high',
  context_pollution: 'medium',
  unsupported_claim: 'high'
};

export function analyzeFailures(results: EvalResult[]): FailureDiagnosis[] {
  return results
    .filter((result) => result.status === 'fail')
    .map((result) => {
      const failureType = result.failureType ?? failureTypeForDimension(result.dimension);

      return {
        resultId: result.caseId,
        dimension: result.dimension,
        failureType,
        explanation: explanationByFailure[failureType],
        severity: severityByFailure[failureType]
      };
    });
}
