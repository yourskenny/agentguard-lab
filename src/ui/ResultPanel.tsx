import { RotateCcw, SearchCheck, Wrench } from 'lucide-react';
import type { AgentProfile, EvalResult } from '../domain/types';
import type { FailureDiagnosis } from '../repair/analyzer';
import type { PatchDiff, RepairPatch } from '../repair/advisor';

interface ResultPanelProps {
  results: EvalResult[];
  diagnoses: FailureDiagnosis[];
  patches: RepairPatch[];
  patchDiffs: PatchDiff[];
  patchedAgent?: AgentProfile;
  onRetest: () => void;
}

export function ResultPanel({ results, diagnoses, patches, patchDiffs, patchedAgent, onRetest }: ResultPanelProps) {
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

      {patchDiffs.length > 0 ? (
        <div className="diff-stack" aria-label="修复 diff">
          <h3>修复 diff</h3>
          {patchDiffs.map((diff) => (
            <article key={`${diff.patchId}-${diff.targetField}`} className="diff-row">
              <div className="row-header">
                <strong>{diff.targetField}</strong>
                <span>{diff.patchId}</span>
              </div>
              <div className="diff-grid">
                <div>
                  <span>Before</span>
                  <pre>{diff.before || '空'}</pre>
                </div>
                <div>
                  <span>After</span>
                  <pre>{diff.after || '空'}</pre>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {patchedAgent ? (
        <div className="patched-agent-block">
          <h3>修复后 Agent 配置</h3>
          <p>{patchedAgent.systemPrompt}</p>
        </div>
      ) : null}

      {results.length === 0 ? <p className="empty-copy">运行评测后会显示失败证据、归因和修复补丁。</p> : null}
    </section>
  );
}
