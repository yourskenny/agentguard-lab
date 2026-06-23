import { FlaskConical, Play, Sparkles } from 'lucide-react';
import type { EvalCase, EvalOutputMap } from '../domain/types';

interface TestCasePanelProps {
  cases: EvalCase[];
  outputs: EvalOutputMap;
  onGenerate: () => void;
  onRun: () => void;
  onOutputChange: (caseId: string, output: string) => void;
}

export function TestCasePanel({ cases, outputs, onGenerate, onRun, onOutputChange }: TestCasePanelProps) {
  return (
    <section className="tool-panel case-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Suite</span>
          <h2>可靠性测试集</h2>
        </div>
        <FlaskConical aria-hidden="true" size={20} />
      </div>

      <div className="action-row">
        <button className="primary-action" type="button" onClick={onGenerate}>
          <Sparkles aria-hidden="true" size={17} />
          <span>生成测试集</span>
        </button>
        <button className="secondary-action" type="button" onClick={onRun} disabled={cases.length === 0}>
          <Play aria-hidden="true" size={17} />
          <span>运行评测</span>
        </button>
      </div>

      <ol className="case-list">
        {cases.map((testCase) => (
          <li key={testCase.id} className={`case-row severity-${testCase.severity}`}>
            <div className="row-header">
              <strong>{testCase.dimension}</strong>
              <span>{testCase.severity}</span>
            </div>
            <p>{testCase.userInput}</p>
            <small>{testCase.expectedBehavior}</small>
            <label className="field-block output-block">
              <span>{`Agent 输出 - ${testCase.dimension}`}</span>
              <textarea
                aria-label={`Agent 输出 - ${testCase.dimension}`}
                value={outputs[testCase.id] ?? ''}
                onChange={(event) => onOutputChange(testCase.id, event.target.value)}
              />
            </label>
          </li>
        ))}
      </ol>

      {cases.length === 0 ? <p className="empty-copy">等待生成覆盖 6 个可靠性维度的测试集。</p> : null}
    </section>
  );
}
