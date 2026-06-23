import type { EvalCase, EvalOutputMap, EvalResult } from '../domain/types';
import { judgeOutput } from './judge';

export function runEvaluation(cases: EvalCase[], outputs: EvalOutputMap): EvalResult[] {
  return cases.map((testCase) => {
    const output = outputs[testCase.id] ?? '';
    return judgeOutput(testCase, output);
  });
}
