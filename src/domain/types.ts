export type EvalDimension =
  | 'factuality'
  | 'boundary_refusal'
  | 'tool_calling'
  | 'context_contamination'
  | 'hallucination'
  | 'instruction_conflict';

export type EvalStatus = 'pass' | 'fail' | 'warning';

export type FailureType =
  | 'knowledge_gap'
  | 'prompt_conflict'
  | 'tool_schema_ambiguity'
  | 'boundary_missing'
  | 'context_pollution'
  | 'unsupported_claim';

export interface ToolSpec {
  name: string;
  description: string;
  requiredParams: string[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  scenario: string;
  systemPrompt: string;
  knowledgeSnippets: string[];
  tools: ToolSpec[];
  history: ChatMessage[];
  safetyBoundaries: string[];
  weakSpots: EvalDimension[];
}

export interface JudgeRule {
  kind: 'must_include' | 'must_not_include' | 'must_refuse' | 'must_call_tool';
  value: string;
}

export interface EvalCase {
  id: string;
  dimension: EvalDimension;
  userInput: string;
  expectedBehavior: string;
  severity: 'low' | 'medium' | 'high';
  rules: JudgeRule[];
}

export interface EvalResult {
  caseId: string;
  dimension: EvalDimension;
  status: EvalStatus;
  actualOutput: string;
  evidence: string[];
  failureType?: FailureType;
}

export type EvalOutputMap = Record<string, string>;

export type WorkbenchStage = 'config' | 'cases' | 'evaluated' | 'retested';
