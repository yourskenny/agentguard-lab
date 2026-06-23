import { Database, ShieldCheck } from 'lucide-react';
import type { AgentProfile } from '../domain/types';

interface SamplePanelProps {
  samples: AgentProfile[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function SamplePanel({ samples, selectedId, onSelect }: SamplePanelProps) {
  const selected = samples.find((sample) => sample.id === selectedId) ?? samples[0];

  return (
    <section className="tool-panel sample-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Profile</span>
          <h2>Agent 样例</h2>
        </div>
        <ShieldCheck aria-hidden="true" size={20} />
      </div>

      <div className="sample-switcher" role="group" aria-label="选择 Agent 样例">
        {samples.map((sample) => (
          <button
            key={sample.id}
            className={sample.id === selectedId ? 'choice-button selected' : 'choice-button'}
            type="button"
            onClick={() => onSelect(sample.id)}
          >
            {sample.name}
          </button>
        ))}
      </div>

      <div className="detail-block">
        <h3>系统提示词</h3>
        <p>{selected.systemPrompt}</p>
      </div>

      <div className="detail-block">
        <h3>知识库片段</h3>
        <ul className="knowledge-list">
          {selected.knowledgeSnippets.map((item) => (
            <li key={item}>
              <Database aria-hidden="true" size={15} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
