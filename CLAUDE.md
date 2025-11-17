# 规范驱动开发技能

面向使用规范驱动开发的 AI 助手。

## 何时使用这些技能

**规划功能？** 当请求包含：
- 规划、提案、规范或新功能（如「add」「create」「plan」「design」）
- 新能力、破坏性变更或架构调整
- 任何在编码前需要结构化需求的事项

此时使用 `spec-proposal-creation-cn`。

**准备实施？** 当：
- 用户说「implement」「build」「apply」并附带提案/变更名称
- 实施应遵循测试驱动开发

此时使用 `spec-implementation-cn`。

**已部署并完成？** 当：
- 用户说「archive」「merge specs」「finalize」
- 变更已实施、测试并部署

此时使用 `spec-archiving-cn`。

**需要上下文？** 当：
- 用户问「what specs exist?」「show changes」「find specs」
- 你需要理解现有规范

此时使用 `spec-context-loading-cn`。

## 核心工作流

始终遵循以下顺序：
1. **提案** → 创建结构化规范（spec-proposal-creation-cn）
2. **实施** → 以 TDD 构建（spec-implementation-cn）
3. **归档** → 合并并保全（spec-archiving-cn）

请勿跳过阶段。每个技能的 SKILL.md 文件中都有详细说明。

## 关键规则

- 使用 EARS 格式编写需求（WHEN...SHALL，GIVEN...WHEN...THEN）
- 在完成前使用 grep 模式进行验证
- 在实施阶段使用 TodoWrite 跟踪
- 在提案阶段不要实施
- 没有 IMPLEMENTED 标记不要归档

灵感来自 [OpenSpec](https://github.com/Fission-AI/OpenSpec)