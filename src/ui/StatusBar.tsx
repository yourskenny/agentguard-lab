import { Activity, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';

interface StatusBarProps {
  sampleName: string;
  caseCount: number;
  beforePassRate: number;
  afterPassRate: number;
  failureCount: number;
}

function scoreLabel(rate: number) {
  return `${rate} / 100`;
}

export function StatusBar({
  sampleName,
  caseCount,
  beforePassRate,
  afterPassRate,
  failureCount
}: StatusBarProps) {
  return (
    <section className="status-bar" aria-label="评测状态">
      <div className="metric-cell">
        <Activity aria-hidden="true" size={18} />
        <strong>{sampleName}</strong>
        <span>当前样例</span>
      </div>
      <div className="metric-cell">
        <ClipboardList aria-hidden="true" size={18} />
        <strong>{caseCount}</strong>
        <span>测试用例</span>
      </div>
      <div className="metric-cell">
        <AlertTriangle aria-hidden="true" size={18} />
        <strong>{failureCount}</strong>
        <span>失败归因</span>
      </div>
      <div className="metric-cell">
        <CheckCircle2 aria-hidden="true" size={18} />
        <strong>{scoreLabel(afterPassRate || beforePassRate)}</strong>
        <span>{afterPassRate > 0 ? '复测分' : '初测分'}</span>
      </div>
    </section>
  );
}
