import { FileText, Gauge, ShieldCheck } from 'lucide-react';
import type { EvalResult } from '../domain/types';

interface ComparisonPanelProps {
  beforePassRate: number;
  afterPassRate: number;
  retestResults: EvalResult[];
  report: string;
}

export function ComparisonPanel({
  beforePassRate,
  afterPassRate,
  retestResults,
  report
}: ComparisonPanelProps) {
  const passedRetests = retestResults.filter((item) => item.status === 'pass').length;

  return (
    <section className="comparison-shell" aria-label="复测对比与报告">
      <div className="comparison-summary">
        <div className="panel-heading compact">
          <div>
            <span className="section-kicker">Evidence</span>
            <h2>复测对比</h2>
          </div>
          <Gauge aria-hidden="true" size={20} />
        </div>
        <div className="score-grid">
          <div className="score-cell">
            <span>修复前</span>
            <strong>{beforePassRate} / 100</strong>
          </div>
          <div className="score-cell emphasized">
            <span>修复后</span>
            <strong>{retestResults.length > 0 ? `${afterPassRate}%` : '0 / 100'}</strong>
          </div>
          <div className="score-cell">
            <span>复测通过</span>
            <strong>
              <ShieldCheck aria-hidden="true" size={18} />
              {passedRetests}
            </strong>
          </div>
        </div>
      </div>

      <div className="report-panel">
        <div className="panel-heading compact">
          <div>
            <span className="section-kicker">Export</span>
            <h2>报告预览</h2>
          </div>
          <FileText aria-hidden="true" size={20} />
        </div>
        <textarea readOnly aria-label="报告预览" value={report} />
      </div>
    </section>
  );
}
