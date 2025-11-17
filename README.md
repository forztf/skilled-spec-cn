# Skilled Spec（中文，Windows 环境）

**面向 Claude Code 的规范驱动开发，采用自然语言驱动。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 灵感来自 [OpenSpec](https://github.com/Fission-AI/OpenSpec) [skilled-spec](https://github.com/mahidalhan/skilled-spec)，并以零安装成本的方式重构为 Claude Code 的技能集。

## 为什么选择 Skilled Spec？

AI 编码助手很强，但缺少结构时会「猜」。猜测会叠加成假设、缺陷与返工。**规范驱动开发确保在人机写码前就对需求达成一致。**

Skilled Spec 将 OpenSpec 的成熟工作流，以四个可组合的技能引入 Claude Code，通过自然对话激活。无需安装 CLI 工具、无需记命令——直接描述你的诉求即可。

```
你：我想创建提案，添加用户认证
Claude：[spec-proposal-creation-cn 激活]
        正在创建用户认证提案...

        ✓ spec/changes/add-user-auth/proposal.md
        ✓ spec/changes/add-user-auth/tasks.md
        ✓ spec/changes/add-user-auth/specs/authentication/spec-delta.md

        审阅后准备好即可回复「实现提案」。
```

## 工作流

```
┌─────────────────────────────────────┐
│  1. 提案（PROPOSE）                 │
│  「我想加搜索」                     │
│  → 结构化提案                       │
│  → EARS 需求                        │
│  → 实施任务清单                     │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│  2. 实施（IMPLEMENT）               │
│  「实施该搜索提案」                 │
│  → 按序执行任务                     │
│  → 测试后再标记完成                 │
│  → 使用 TodoWrite 跟踪              │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│  3. 归档（ARCHIVE）                 │
│  「归档该搜索变更」                 │
│  → 合并规范差异                     │
│  → 时间戳归档                       │
│  → 更新常驻文档                     │
└─────────────────────────────────────┘
```

**变更将以提案 → 评审 → 实施 → 归档的方式进行，具备完整的可追溯性。**

## 快速上手

### 先决条件

- 已安装 [Claude Code](https://docs.claude.com/en/docs/claude-code/overview)
- 一个你希望采用规范驱动开发的项目

### 安装

**NPX（推荐——一条命令）**

将技能安装到项目的 `.claude/skills/` 目录：

```bash
# 在项目根目录执行
npx skilled-spec-cn@latest
```

就这些！技能已安装并可用。

**全局插件**

安装到 `~/.claude/plugins/marketplaces/`，可跨项目复用：

```bash
/plugin marketplace add https://github.com/forztf/skilled-spec-cn
/plugin install skilled-spec-cn
```

### 第一个功能

以搜索功能演示整个流程：

**1. 提案**
```
你：我想添加带分类过滤的全文检索
```

Claude 将生成：
- `proposal.md` - 为什么、做什么、影响
- `tasks.md` - 实施清单
- `spec-delta.md` - EARS 需求

**2. 评审与完善**
```
你：给搜索结果加分页
```

Claude 更新提案。

**3. 实施**
```
你：实施搜索提案
```

Claude 以进度跟踪执行任务：
```
✅ 添加搜索索引
✅ 创建 API 端点
⏳ 构建 UI 组件（测试中...）
⬜ 添加过滤控件
⬜ 集成测试
```

**4. 归档**（部署后）
```
你：归档该搜索变更
```

Claude 将规范差异合并到常驻文档，并创建带时间戳的归档。

**就这些。** 提案 → 实施 → 归档。

## 四个技能

| 技能 | 触发词 | 目的 |
|------|--------|------|
| **spec-proposal-creation-cn** | "创建提案"、"新需求" | 生成带 EARS 需求的结构化提案 |
| **spec-implementation-cn** | "实现提案"、"开发" | 以测试与进度跟踪的方式执行任务 |
| **spec-archiving-cn** | "归档提案"、"合并规范" | 合并规范差异并创建归档 |
| **spec-context-loading-cn** | "有哪些规范"、"显示变更" | 发现规范、搜索需求、展示仪表盘 |

每个技能都在其 `SKILL.md` 文件中具备详细文档。

## 文件结构

```
your-project/
├── .claude/
│   └── skills/                      # 或 plugins/skilled-spec-cn/
│       ├── spec-proposal-creation-cn/
│       ├── spec-implementation-cn/
│       ├── spec-archiving-cn/
│       └── spec-context-loading-cn/
└── spec/
    ├── specs/                       # 当前状态（事实来源）
    │   └── {capability}/spec.md
    ├── changes/                     # 提案（进行中）
    │   └── {change-id}/
    │       ├── proposal.md
    │       ├── tasks.md
    │       ├── IMPLEMENTED
    │       └── specs/{capability}/spec-delta.md
    └── archive/                     # 历史（带时间戳）
        └── 2025-10-26-{change-id}/
```

## EARS 需求格式

需求使用 **EARS**（易于需求语法）：

```markdown
### Requirement: 用户登录
WHEN 用户提交有效凭据,
系统 SHALL 认证用户并创建会话。

#### Scenario: 登录成功
GIVEN 用户具备有效凭据
WHEN 用户提交登录表单
THEN 系统创建已认证会话
AND 重定向至仪表盘
```

**为何选择 EARS？** 清晰的触发（WHEN）、具约束的需求（SHALL）、可测试的场景（GIVEN/WHEN/THEN）。

了解更多：
[EARS 格式指南](https://alistairmavin.com/ears/)

## 与 OpenSpec 的对比

Skilled Spec 继承了 OpenSpec 的方法论，并针对 Claude Code 做了适配：

| 功能 | OpenSpec | Skilled Spec |
|------|----------|--------------|
| **安装** | `npm install -g` | `/plugin install` 或复制 |
| **激活** | `/openspec:proposal` | 自然语言「create a proposal」 |
| **验证** | `openspec validate` | Grep 模式 |
| **发现** | `openspec list` | 「what specs exist」 |
| **平台** | 独立 CLI | Claude Code 技能 |
| **依赖** | Node.js + npm | 无 |
| **工作流** | ✅ 三阶段 | ✅ 三阶段 |
| **EARS 格式** | ✅ 支持 | ✅ 支持 |

**若你需要官方 CLI 与企业级工具、IDE 无关的工作流，请使用 OpenSpec。**

**若你已在使用 Claude Code 并希望零摩擦的自然语言激活，请使用 Skilled Spec。**

**致谢**：方法论来自 [OpenSpec 团队](https://github.com/Fission-AI/OpenSpec)。我们以 Claude 技能使其更易用。

## 团队采纳

**基于插件（自动更新）**：
1. 创建私有的 marketplace 仓库
2. 添加 `skilled-spec-cn` 插件
3. 团队安装：`/plugin install skilled-spec-cn@your-org`

**直接复制（简单设置）**：
1. 将技能添加到项目的 `.claude/skills/`
2. 提交到版本控制
3. 团队克隆后自动获得技能

所有提案都可在 Pull Request 中审阅。

## 故障排查

**技能未加载？**
1. 安装后重启 Claude Code
2. 检查插件状态：`/plugin`
3. 验证技能位置：`ls .claude/skills/` 或 `ls skilled-spec-cn/skills/`

**技能未激活？** 使用触发短语：
- ✅ "create a proposal for X"
- ✅ "implement the X proposal"
- ✅ "archive the X change"
- ✅ "what specs exist?"

**插件安装失败？**
```bash
# 更新插件
/plugin update skilled-spec-cn

# 或重新安装
/plugin uninstall skilled-spec-cn
/plugin install skilled-spec-cn
```

**项目特定设置不工作？**
- 确保 `.claude/settings.json` 路径正确（相对 `.claude/` 为 `../skilled-spec-cn`）
- 在提示时信任仓库配置
- 验证：`ls -la skilled-spec-cn/skills/` 显示 4 个技能目录

**验证错误？** Claude 会明确指出问题：
```
✗ 缺少需求「User Login」的场景
  → 请在该需求后添加 "#### Scenario: ..."
```

## 贡献

欢迎贡献！

1. Fork 仓库
2. 创建分支：`git checkout -b feature/your-improvement`
3. 在真实项目中测试
4. 提交 PR

**建议方向**：参考文件、语言特定模板、集成指南、验证模式

## 许可证

MIT License - 参见 [LICENSE](LICENSE)

## 鸣谢

- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** - 方法论与 CLI 工具
- **[Anthropic](https://www.anthropic.com)** - Claude Code 与技能框架
- **[EARS](https://alistairmavin.com/ears/)** - 需求语法
- **[skilled-spec](https://github.com/mahidalhan/skilled-spec)** - 原英文版本

## 链接

- [Claude Code 文档](https://docs.claude.com/en/docs/claude-code/overview)
- [Claude 技能最佳实践](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
- [OpenSpec](https://github.com/Fission-AI/OpenSpec)

---

**基于 Claude Skills 构建，服务于 Claude Code**