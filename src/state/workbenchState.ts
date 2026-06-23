import type { AgentProfile, EvalCase, EvalOutputMap, EvalResult, WorkbenchStage } from '../domain/types';
import { generateEvalCases } from '../evaluation/caseGenerator';
import { createRepairedOutputDrafts, createRiskyOutputDrafts } from '../evaluation/outputDrafts';
import { runEvaluation } from '../evaluation/runner';
import { analyzeFailures, type FailureDiagnosis } from '../repair/analyzer';
import { applyRepairPatches, createRepairPatches, type PatchDiff, type RepairPatch } from '../repair/advisor';

export interface WorkbenchState {
  stage: WorkbenchStage;
  baselineAgent: AgentProfile;
  agent: AgentProfile;
  cases: EvalCase[];
  outputDrafts: EvalOutputMap;
  initialResults: EvalResult[];
  diagnoses: FailureDiagnosis[];
  patches: RepairPatch[];
  patchedAgent?: AgentProfile;
  patchDiffs: PatchDiff[];
  retestOutputs: EvalOutputMap;
  retestResults: EvalResult[];
  beforePassRate: number;
  afterPassRate: number;
}

export function passRate(results: EvalResult[]): number {
  if (results.length === 0) {
    return 0;
  }

  const passed = results.filter((result) => result.status === 'pass').length;
  return Math.round((passed / results.length) * 100);
}

export function createInitialState(agent: AgentProfile): WorkbenchState {
  return {
    stage: 'config',
    baselineAgent: agent,
    agent,
    cases: [],
    outputDrafts: {},
    initialResults: [],
    diagnoses: [],
    patches: [],
    patchedAgent: undefined,
    patchDiffs: [],
    retestOutputs: {},
    retestResults: [],
    beforePassRate: 0,
    afterPassRate: 0
  };
}

export function generateCases(state: WorkbenchState): WorkbenchState {
  const cases = generateEvalCases(state.agent);

  return {
    ...state,
    stage: 'cases',
    baselineAgent: state.agent,
    cases,
    outputDrafts: createRiskyOutputDrafts(state.agent, cases),
    initialResults: [],
    diagnoses: [],
    patches: [],
    patchedAgent: undefined,
    patchDiffs: [],
    retestOutputs: {},
    retestResults: [],
    beforePassRate: 0,
    afterPassRate: 0
  };
}

export function updateAgentConfig(state: WorkbenchState, agent: AgentProfile): WorkbenchState {
  return createInitialState(agent);
}

export function updateCaseOutput(state: WorkbenchState, caseId: string, output: string): WorkbenchState {
  return {
    ...state,
    outputDrafts: {
      ...state.outputDrafts,
      [caseId]: output
    }
  };
}

export function runInitialEvaluation(state: WorkbenchState): WorkbenchState {
  const cases = state.cases.length > 0 ? state.cases : generateEvalCases(state.agent);
  const outputDrafts =
    Object.keys(state.outputDrafts).length > 0 ? state.outputDrafts : createRiskyOutputDrafts(state.agent, cases);
  const initialResults = runEvaluation(cases, outputDrafts);
  const diagnoses = analyzeFailures(initialResults);
  const patches = createRepairPatches(diagnoses);

  return {
    ...state,
    stage: 'evaluated',
    baselineAgent: state.agent,
    cases,
    outputDrafts,
    initialResults,
    diagnoses,
    patches,
    patchedAgent: undefined,
    patchDiffs: [],
    retestOutputs: {},
    retestResults: [],
    beforePassRate: passRate(initialResults),
    afterPassRate: 0
  };
}

export function applyRepairsAndRetest(state: WorkbenchState, retestOverrides: EvalOutputMap = {}): WorkbenchState {
  const cases = state.cases.length > 0 ? state.cases : generateEvalCases(state.agent);
  const patches = state.patches.length > 0 ? state.patches : createRepairPatches(analyzeFailures(state.initialResults));
  const repaired = applyRepairPatches(state.agent, patches);
  const retestOutputs = {
    ...createRepairedOutputDrafts(repaired.agent, cases),
    ...retestOverrides
  };
  const retestResults = runEvaluation(cases, retestOutputs);

  return {
    ...state,
    stage: 'retested',
    agent: repaired.agent,
    cases,
    patches,
    patchedAgent: repaired.agent,
    patchDiffs: repaired.diffs,
    retestOutputs,
    retestResults,
    afterPassRate: passRate(retestResults)
  };
}
