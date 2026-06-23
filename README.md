# AgentGuard Lab

AI Agent 可靠性评测与修复工作台，面向 TRAE AI 创造力大赛“学习工作”赛道。

## Project Goal

AgentGuard Lab 帮助 AI Agent 开发者把项目从“能演示”推进到“可测试、可解释、可维护、可交付”。核心闭环是：

1. 输入或选择 Agent 配置。
2. 自动生成可靠性测试集。
3. 运行评测并展示失败证据。
4. 定位失败原因。
5. 生成可复测的修复建议。
6. 复测并展示 before/after 对比。
7. 导出比赛和答辩可用报告。

## Current Planning Artifacts

- [项目设计规格](docs/superpowers/specs/2026-06-23-agentguard-lab-design.md)
- [实现计划](docs/superpowers/plans/2026-06-23-agentguard-lab.md)
- [draw.io 架构图](docs/diagrams/agentguard-lab-architecture.drawio)

## MVP Scope

初赛 MVP 采用静态 Web 工作台形态，优先保证可体验闭环和现场演示稳定性。计划技术栈是 Vite + React + TypeScript，初赛阶段使用本地样例和确定性评测规则，避免依赖后端或真实 LLM API。
