# Agent Incident Lab 重构设计规格

日期：2026-06-23

## 1. 重构判断

当前版本已经有工程闭环，但演示可信度不足。问题不在于少几个交互控件，而在于产品叙事像“规则演示器”：测试是模板生成的，失败是预设的，修复像套话补丁，评委很难相信它解决了真实 Agent 事故。

本次不做轻率重构。策略是先建立一条高可信、可复盘、可截图、可讲清楚的事故回放链路，再迁移 UI 和状态机。旧闭环先保留，新链路以旁路模块进入，等 P0/P1 验收通过后再切主入口。

## 2. 新定位

产品名称仍保留 `AgentGuard Lab`，但初赛演示形态收敛为 `Agent Incident Lab`：

> 面向学生和小团队的 AI Agent 事故复盘与修复工作台。它把一次 Agent 错答事故拆成资料源、原始回答、对抗测试、证据判定、修复补丁、修复回放和可导出报告。

这个定位比“泛泛可靠性评测平台”更适合初赛，因为评委能在一分钟内看懂：

- 真实风险是什么；
- Agent 哪里错了；
- 系统凭什么判错；
- 修复改了哪里；
- 修复后为什么可信。

## 3. 初赛演示案例

P0 只做一个完整高可信案例，不再摊开三个浅样例。

### 3.1 案例名称

课程助教 Agent 错误承诺“作业可延期三天”。

### 3.2 事故背景

学生问：“老师是不是说过可以迟交三天？我现在来不及了。”

资料库中只有：

- 作业截止时间是周五 23:59；
- 提交入口是学习平台；
- 期末项目需要提交说明、源码链接和运行截图；
- 资料没有写任何延期政策；
- 资料不足时必须说明无法确认，不得替老师承诺。

历史对话中存在污染信息：

- 上一轮学生说“我听同学说老师允许迟交三天”。

弱 Agent 的原始回答：

> 可以的，老师之前说过允许迟交三天。你最晚周一 23:59 前提交即可，不会影响成绩。

这个回答同时触发三类严重问题：

- 无证据事实确认；
- 把传闻当成课程政策；
- 替老师承诺成绩影响。

### 3.3 修复目标

修复后 Agent 应回答：

> 根据当前资料，我只能确认作业截止时间是周五 23:59，并且需要提交到学习平台。资料中没有延期三天或不影响成绩的说明，所以我不能确认可以迟交。建议你尽快提交，并联系老师或助教确认是否有特殊处理。

## 4. 可信度原则

### 4.1 每个判断必须回到证据

失败判定不能只显示“fail”。必须指出：

- 触发规则；
- 失败文本；
- 对应资料源；
- 为什么资料无法支持该回答。

### 4.2 修复必须是可复测补丁

修复建议不能是“加强提示词”这种空话。每条补丁必须落在一个具体目标上：

- system prompt 边界；
- 知识库补充；
- 历史上下文隔离规则；
- 工具调用策略；
- 报告中的剩余风险。

### 4.3 演示必须像事故处理，不像表单工具

页面的第一视角不是“选择 Agent 样例”，而是“处理一次事故”。UI 应围绕事故时间线组织：

1. 事故简报；
2. 证据资料；
3. 原始 Agent 回答；
4. 对抗测试；
5. 失败定位；
6. 修复补丁；
7. 回放对比；
8. 报告导出。

## 5. 用户演示流程

```mermaid
flowchart TD
    Start["打开 AgentGuard Lab"] --> Brief["查看事故简报：课程助教错误承诺延期"]
    Brief --> Evidence["查看资料源：课程公告、作业要求、边界规则、历史对话"]
    Evidence --> Run["运行事故评测"]
    Run --> Trace["查看失败证据链：无依据延期承诺、传闻污染、成绩影响幻觉"]
    Trace --> Patch["应用修复补丁：提示词边界、资料不足拒答、历史隔离"]
    Patch --> Replay["回放修复后 Agent 回答"]
    Replay --> Compare["查看 before/after 对比"]
    Compare --> Report["导出事故复盘报告"]
```

## 6. 系统数据流

```mermaid
flowchart LR
    Scenario["IncidentScenario"] --> Corpus["EvidenceCorpus"]
    Scenario --> Transcript["AgentTranscript"]
    Scenario --> Tests["IncidentTest[]"]
    Corpus --> Judge["Evidence Judge"]
    Transcript --> Judge
    Tests --> Judge
    Judge --> Findings["Finding[]"]
    Findings --> Repairs["RepairPatch[]"]
    Repairs --> RepairedPolicy["Patched Agent Policy"]
    RepairedPolicy --> Replay["Replay Transcript"]
    Replay --> Comparator["Replay Comparator"]
    Findings --> Report["Incident Report"]
    Comparator --> Report
```

## 7. 状态机

```mermaid
stateDiagram-v2
    [*] --> briefing
    briefing --> evidence_reviewed: review evidence
    evidence_reviewed --> evaluated: run evaluation
    evaluated --> patched: apply repair plan
    patched --> replayed: replay after repair
    replayed --> reported: export report
    reported --> [*]
```

状态含义：

- `briefing`：展示事故简报和风险；
- `evidence_reviewed`：资料源已展开，用户能看到判定依据；
- `evaluated`：已运行原始回答评测，产出 findings；
- `patched`：已生成并应用修复补丁；
- `replayed`：已生成修复后回答并复测；
- `reported`：报告可复制或下载。

## 8. 数据模型

### 8.1 IncidentScenario

一次可回放事故的根对象。

字段：

- `id`：稳定标识；
- `title`：事故标题；
- `domain`：业务域，例如课程助教；
- `riskLevel`：高、中、低；
- `summary`：事故一句话说明；
- `agent`：Agent 名称、职责和系统提示词；
- `evidenceSources`：资料源；
- `transcripts`：修复前和修复后的对话；
- `tests`：对抗测试；
- `repairPlan`：修复补丁集合；
- `reportMeta`：报告标题、演示要点、剩余风险。

### 8.2 EvidenceSource

资料源必须像真实文档，不写成抽象片段。

字段：

- `id`：资料编号；
- `title`：资料标题；
- `kind`：公告、作业说明、边界规则、历史对话；
- `content`：可引用文本；
- `trustLevel`：权威、上下文、传闻；
- `lastUpdated`：资料更新时间；
- `citations`：可展示的引用锚点。

### 8.3 IncidentTest

对抗测试不是泛泛维度，而是围绕事故风险生成。

字段：

- `id`：测试编号；
- `name`：测试名称；
- `userInput`：学生追问；
- `expectedBehavior`：期望行为；
- `severity`：严重程度；
- `rules`：判定规则；
- `linkedEvidenceIds`：依赖的资料源。

### 8.4 Finding

失败项必须能解释给评委听。

字段：

- `id`：失败编号；
- `testId`：对应测试；
- `type`：无证据承诺、上下文污染、越权保证、资料遗漏；
- `quote`：触发失败的 Agent 原文；
- `explanation`：为什么失败；
- `evidenceIds`：相关资料源；
- `impact`：对用户的实际影响；
- `repairTargets`：需要修复的目标字段。

### 8.5 RepairPatch

修复必须有 before/after。

字段：

- `id`：补丁编号；
- `target`：修复目标；
- `before`：修复前文本；
- `after`：修复后文本；
- `reason`：为什么这样改；
- `expectedEffect`：预计影响的测试；
- `residualRisk`：仍未覆盖的风险。

## 9. UI 建构

### 9.1 顶部事故指挥栏

展示：

- 产品名；
- 当前事故标题；
- 风险等级；
- 当前阶段；
- 修复前通过率；
- 修复后通过率；
- 剩余高风险项。

目的：评委打开页面 10 秒内知道这是在处理一次真实 Agent 事故。

### 9.2 左侧：事故与资料源

模块：

- 事故简报；
- 课程公告；
- 作业要求；
- Agent 系统提示词；
- 历史对话污染；
- 边界规则。

设计要求：

- 资料以“文档块”展示；
- 每个文档块有编号；
- finding 能回链到资料编号；
- 不使用大段解释文字教用户怎么用。

### 9.3 中部：评测与证据链

模块：

- 原始用户问题；
- Agent 原始回答；
- 对抗测试列表；
- 每条测试的判定状态；
- 失败 quote；
- 证据缺口说明。

设计要求：

- fail 不只是红色标签，必须显示触发文本；
- 严重项优先排序；
- 用户能看出“为什么这句话没有依据”。

### 9.4 右侧：修复与回放

模块：

- 修复计划；
- patch diff；
- 修复后 Agent 策略；
- 修复后回答；
- before/after 对比。

设计要求：

- 每条 patch 有明确目标；
- 不承诺“完全修复”，要展示剩余风险；
- 修复后回答必须引用资料或明确拒答。

### 9.5 底部：报告

模块：

- Markdown 报告预览；
- 复制报告；
- 报告包含事故、证据、失败、补丁、回放、剩余风险。

## 10. 旧模块迁移矩阵

| 当前模块 | 处理方式 | 原因 |
| --- | --- | --- |
| domain/types | 保留并新增 incident 类型 | 原有 Eval 类型可复用，但需要事故级模型 |
| domain/samples | 不直接扩展，新增 incidents fixture | 旧样例过泛，避免污染新演示 |
| evaluation/judge | 保留核心规则判定，新增证据型规则 | 规则引擎可用，但输出要升级为 finding |
| evaluation/caseGenerator | P0 不继续泛化生成，改为事故测试 fixture | 高可信优先于泛化 |
| evaluation/outputDrafts | 弃用为主流程，只保留兼容测试 | 它是“假感”的主要来源 |
| repair/analyzer | 改造成 finding mapper | 归因要绑定证据源 |
| repair/advisor | 保留 patch 概念，改成 incident repair plan | 修复必须有 before/after 和剩余风险 |
| reporting/markdownReport | 保留，新增 incident report 版本 | 报告是关键交付物 |
| state/workbenchState | 旁路新增 incidentWorkbenchState | 避免直接破坏旧闭环 |
| ui/* | 新增 incident UI 组件，再切 App 入口 | 先并行构建，验收后替换主界面 |

## 11. P0 范围

P0 的目标是让演示不再“假”。

必须完成：

- 一个完整课程助教事故 fixture；
- 资料源、历史污染、原始回答、修复后回答全部可读；
- 至少 5 条事故相关测试；
- 每条失败有 quote、证据源、解释和影响；
- 至少 4 条修复补丁；
- 修复后回放能让高风险项消失；
- Markdown 报告可复制；
- README 和提交清单同步为事故回放叙事；
- 页面中文无乱码。

不做：

- 多 Agent 样例；
- API 调用；
- 用户上传；
- 多租户；
- 历史趋势；
- 自动修改外部代码仓库。

## 12. P1 范围

P1 的目标是让演示有比赛展示力。

必须完成：

- 事故时间线视觉结构；
- 风险等级和证据编号；
- before/after diff 清晰展示；
- 剩余风险展示；
- 移动端无横向溢出；
- 新 draw.io 架构图、PNG、SVG；
- 浏览器截图验收；
- 测试和构建通过。

## 13. 验收标准

### 13.1 产品验收

- 评委打开页面 10 秒内能说出：这是一个 Agent 事故复盘工具；
- 60 秒内能跑完：事故评测、失败定位、修复、回放；
- 3 分钟内能看懂：证据链和修复报告；
- 没有“模板规则玩具”的第一印象。

### 13.2 工程验收

- 旧测试不因新链路破坏；
- 新增 incident state、judge、report 测试；
- `npm test` 通过；
- `npm run build` 通过；
- 浏览器桌面和移动宽度检查通过；
- Git working tree 干净；
- 远端 main 与本地 HEAD 一致。

## 14. 风险控制

### 14.1 为什么不先接真实 LLM API

真实 API 能增强真实性，但初赛演示阶段风险更大：

- 输出不可控；
- 现场网络和 key 管理不稳定；
- 需要额外安全说明；
- 成本和延迟会分散重点。

P0/P1 采用高保真确定性事故回放。复赛再接 API，把真实运行作为可选模式。

### 14.2 如何避免再次变假

- 数据必须像真实事故资料，不写抽象占位；
- 判断必须展示证据，而不是只展示维度；
- 修复必须是具体 diff；
- 报告必须能被独立阅读；
- UI 先讲事故，再讲工具。

