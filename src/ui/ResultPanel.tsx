import { RotateCcw, SearchCheck, Wrench } from 'lucide-react';
import type { EvalResult } from '../domain/types';
import type { FailureDiagnosis } from '../repair/analyzer';
import type { RepairPatch } from '../repair/advisor';

interface ResultPanelProps {
  results: EvalResult[];
  diagnoses: FailureDiagnosis[];
  patches: RepairPatch[];
  onRetest: () => void;
}

export function ResultPanel({ results, diagnoses, patches, onRetest }: ResultPanelProps) {
  return (
    <section className="tool-panel result-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Repair</span>
          <h2>失败归因与修复</h2>
        </div>
        <SearchCheck aria-hidden="true" size={20} />
      </div>

      <button
        className="primary-action full-width"
        type="button"
        onClick={onRetest}
        disabled={patches.length === 0}
      >
        <RotateCcw aria-hidden="true" size={17} />
        <span>应用修复并复测</span>
      </button>

      <div className="result-stack">
        {results.map((result) => (
          <article key={result.caseId} className={`result-row ${result.status}`}>
            <div className="row-header">
              <strong>{result.dimension}</strong>
              <span>{result.status}</span>
            </div>
            <p>{result.actualOutput}</p>
            {result.evidence.length > 0 ? <small>证据：{result.evidence.join(' / ')}</small> : null}
          </article>
        ))}
      </div>

      <div className="diagnosis-stack">
        {diagnoses.map((diagnosis) => (
          <article key={diagnosis.resultId} className="diagnosis-row">
            <div className="row-header">
              <strong>{diagnosis.failureType}</strong>
              <span>{diagnosis.severity}</span>
            </div>
            <p>{diagnosis.explanation}</p>
          </article>
        ))}
      </div>

      <div className="patch-stack">
        {patches.map((patch) => (
          <article key={patch.id} className="patch-row">
            <Wrench aria-hidden="true" size={16} />
            <div>
              <strong>{patch.patchType}</strong>
              <p>{patch.after}</p>
              <small>{patch.expectedImpact}</small>
            </div>
          </article>
        ))}
      </div>

      {results.length === 0 ? <p className="empty-copy">运行评测后会显示失败证据、归因和修复补丁。</p> : null}
    </section>
  );
}
