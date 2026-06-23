import { useMemo, useState } from 'react';
import { agentSamples } from './domain/samples';
import { createMarkdownReport } from './reporting/markdownReport';
import {
  applyRepairsAndRetest,
  createInitialState,
  generateCases,
  runInitialEvaluation,
  updateAgentConfig,
  updateCaseOutput
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
    () =>
      createMarkdownReport({
        agent: state.baselineAgent,
        patchedAgent: state.patchedAgent,
        cases: state.cases,
        results: state.initialResults,
        diagnoses: state.diagnoses,
        patches: state.patches,
        patchDiffs: state.patchDiffs,
        retestResults: state.retestResults,
        beforePassRate: state.beforePassRate,
        afterPassRate: state.afterPassRate
      }),
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

  function handleAgentChange(agent: typeof state.agent) {
    setState((current) => updateAgentConfig(current, agent));
  }

  function handleOutputChange(caseId: string, output: string) {
    setState((current) => updateCaseOutput(current, caseId, output));
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
          ver0.1 工作流版
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
          agent={state.agent}
          onSelect={selectSample}
          onAgentChange={handleAgentChange}
        />
        <TestCasePanel
          cases={state.cases}
          outputs={state.outputDrafts}
          onGenerate={handleGenerate}
          onRun={handleRun}
          onOutputChange={handleOutputChange}
        />
        <ResultPanel
          results={state.initialResults}
          diagnoses={state.diagnoses}
          patches={state.patches}
          patchDiffs={state.patchDiffs}
          patchedAgent={state.patchedAgent}
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
