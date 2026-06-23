import { useMemo, useState } from 'react';
import { agentSamples } from './domain/samples';
import { createMarkdownReport } from './reporting/markdownReport';
import {
  applyRepairsAndRetest,
  createInitialState,
  generateCases,
  runInitialEvaluation
} from './state/workbenchState';
import { ComparisonPanel } from './ui/ComparisonPanel';
import { ResultPanel } from './ui/ResultPanel';
import { SamplePanel } from './ui/SamplePanel';
import { StatusBar } from './ui/StatusBar';
import { TestCasePanel } from './ui/TestCasePanel';

export function App() {
  const [selectedId, setSelectedId] = useState(agentSamples[0].id);
  const [state, setState] = useState(() => createInitialState(agentSamples[0]));

  const selectedSample = useMemo(
    () => agentSamples.find((sample) => sample.id === selectedId) ?? agentSamples[0],
    [selectedId]
  );

  const report = useMemo(
    () => {
      if (state.retestResults.length === 0) {
        return 'AgentGuard Lab 评测报告\n\n完成修复复测后生成完整报告。';
      }

      return createMarkdownReport({
        agent: state.agent,
        cases: state.cases,
        results: state.initialResults,
        diagnoses: state.diagnoses,
        patches: state.patches,
        retestResults: state.retestResults,
        beforePassRate: state.beforePassRate,
        afterPassRate: state.afterPassRate
      });
    },
    [state]
  );

  function selectSample(id: string) {
    const nextSample = agentSamples.find((sample) => sample.id === id) ?? agentSamples[0];
    setSelectedId(nextSample.id);
    setState(createInitialState(nextSample));
  }

  function handleGenerate() {
    setState((current) => generateCases(current));
  }

  function handleRun() {
    setState((current) => runInitialEvaluation(current));
  }

  function handleRetest() {
    setState((current) => applyRepairsAndRetest(current));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="product-mark">AgentGuard Lab</span>
          <h1>AI Agent 可靠性评测与修复工作台</h1>
        </div>
        <div className="release-tag" aria-label="版本">
          初赛 MVP
        </div>
      </header>

      <StatusBar
        sampleName={state.agent.name}
        caseCount={state.cases.length}
        beforePassRate={state.beforePassRate}
        afterPassRate={state.afterPassRate}
        failureCount={state.diagnoses.length}
      />

      <section className="workbench-grid" aria-label="工作台">
        <SamplePanel
          samples={agentSamples}
          selectedId={selectedSample.id}
          onSelect={selectSample}
        />
        <TestCasePanel cases={state.cases} onGenerate={handleGenerate} onRun={handleRun} />
        <ResultPanel
          results={state.initialResults}
          diagnoses={state.diagnoses}
          patches={state.patches}
          onRetest={handleRetest}
        />
      </section>

      <ComparisonPanel
        beforePassRate={state.beforePassRate}
        afterPassRate={state.afterPassRate}
        retestResults={state.retestResults}
        report={report}
      />
    </main>
  );
}
