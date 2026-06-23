import type { AgentProfile, EvalCase, EvalResult } from '../domain/types';
import { generateEvalCases } from '../evaluation/caseGenerator';
import { runEvaluation } from '../evaluation/runner';
import { analyzeFailures, type FailureDiagnosis } from '../repair/analyzer';
import { createRepairPatches, type RepairPatch } from '../repair/advisor';

export interface WorkbenchState {
  agent: AgentProfile;
  cases: EvalCase[];
  initialResults: EvalResult[];
  diagnoses: FailureDiagnosis[];
  patches: RepairPatch[];
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
    agent,
    cases: [],
    initialResults: [],
    diagnoses: [],
    patches: [],
    retestResults: [],
    beforePassRate: 0,
    afterPassRate: 0
  };
}

export function generateCases(state: WorkbenchState): WorkbenchState {
  return {
    ...state,
    cases: generateEvalCases(state.agent),
    initialResults: [],
    diagnoses: [],
    patches: [],
    retestResults: [],
    beforePassRate: 0,
    afterPassRate: 0
  };
}

export function runInitialEvaluation(state: WorkbenchState): WorkbenchState {
  const cases = state.cases.length > 0 ? state.cases : generateEvalCases(state.agent);
  const initialResults = runEvaluation(state.agent, cases, 'weak');
  const diagnoses = analyzeFailures(initialResults);
  const patches = createRepairPatches(diagnoses);

  return {
    ...state,
    cases,
    initialResults,
    diagnoses,
    patches,
    retestResults: [],
    beforePassRate: passRate(initialResults),
    afterPassRate: 0
  };
}

export function applyRepairsAndRetest(state: WorkbenchState): WorkbenchState {
  const cases = state.cases.length > 0 ? state.cases : generateEvalCases(state.agent);
  const retestResults = runEvaluation(state.agent, cases, 'repaired');

  return {
    ...state,
    cases,
    retestResults,
    afterPassRate: passRate(retestResults)
  };
}
