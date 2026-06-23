import { Database, ShieldCheck, Wrench } from 'lucide-react';
import type { AgentProfile, ToolSpec } from '../domain/types';

interface SamplePanelProps {
  samples: AgentProfile[];
  selectedId: string;
  agent: AgentProfile;
  onSelect: (id: string) => void;
  onAgentChange: (agent: AgentProfile) => void;
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitParams(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function nextTools(agent: AgentProfile, patch: Partial<ToolSpec>): ToolSpec[] {
  const currentTool = agent.tools[0] ?? {
    name: '',
    description: '',
    requiredParams: []
  };
  const updatedTool = {
    ...currentTool,
    ...patch
  };
  const hasTool =
    updatedTool.name.trim().length > 0 ||
    updatedTool.description.trim().length > 0 ||
    updatedTool.requiredParams.length > 0;

  return hasTool ? [updatedTool] : [];
}

export function SamplePanel({ samples, selectedId, agent, onSelect, onAgentChange }: SamplePanelProps) {
  const tool = agent.tools[0] ?? { name: '', description: '', requiredParams: [] };

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

      <div className="config-grid">
        <label className="field-block">
          <span>Agent 名称</span>
          <input
            aria-label="Agent 名称"
            value={agent.name}
            onChange={(event) => onAgentChange({ ...agent, name: event.target.value })}
          />
        </label>

        <label className="field-block">
          <span>应用场景</span>
          <input
            aria-label="应用场景"
            value={agent.scenario}
            onChange={(event) => onAgentChange({ ...agent, scenario: event.target.value })}
          />
        </label>
      </div>

      <label className="field-block detail-block">
        <span>系统提示词</span>
        <textarea
          aria-label="系统提示词"
          className="config-textarea"
          value={agent.systemPrompt}
          onChange={(event) => onAgentChange({ ...agent, systemPrompt: event.target.value })}
        />
      </label>

      <label className="field-block detail-block">
        <span>知识库片段（每行一条）</span>
        <textarea
          aria-label="知识库片段"
          className="config-textarea"
          value={agent.knowledgeSnippets.join('\n')}
          onChange={(event) => onAgentChange({ ...agent, knowledgeSnippets: splitLines(event.target.value) })}
        />
      </label>

      <label className="field-block detail-block">
        <span>安全边界（每行一条）</span>
        <textarea
          aria-label="安全边界"
          className="config-textarea compact-textarea"
          value={agent.safetyBoundaries.join('\n')}
          onChange={(event) => onAgentChange({ ...agent, safetyBoundaries: splitLines(event.target.value) })}
        />
      </label>

      <div className="tool-config detail-block">
        <div className="tool-config-title">
          <Wrench aria-hidden="true" size={16} />
          <h3>工具配置</h3>
        </div>
        <label className="field-block">
          <span>工具名称</span>
          <input
            aria-label="工具名称"
            value={tool.name}
            onChange={(event) => onAgentChange({ ...agent, tools: nextTools(agent, { name: event.target.value }) })}
          />
        </label>
        <label className="field-block">
          <span>工具描述</span>
          <input
            aria-label="工具描述"
            value={tool.description}
            onChange={(event) =>
              onAgentChange({ ...agent, tools: nextTools(agent, { description: event.target.value }) })
            }
          />
        </label>
        <label className="field-block">
          <span>必填参数</span>
          <input
            aria-label="必填参数"
            value={tool.requiredParams.join(', ')}
            onChange={(event) =>
              onAgentChange({ ...agent, tools: nextTools(agent, { requiredParams: splitParams(event.target.value) }) })
            }
          />
        </label>
      </div>

      <div className="detail-block">
        <h3>知识库预览</h3>
        <ul className="knowledge-list">
          {agent.knowledgeSnippets.map((item) => (
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
