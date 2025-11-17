---
name: spec-context-loading-cn
description: 加载项目上下文，列出现有规范与变更，搜索能力与需求。用于用户询问项目状态、现有规范、进行中的变更、可用能力或需要发现上下文时。触发词包括「有哪些规范」「显示变更」「列出能力」「项目上下文」「查找规范」「规范包含什么」「展示规范」。
---

# 规范上下文加载

发现并加载项目规范、进行中的变更和需求，以提供上下文。

## 快速开始

上下文加载可帮助回答：
- 项目有哪些规范？
- 目前有哪些进行中的变更？
- 已定义了哪些需求？
- 系统具备哪些能力？
- 某项功能在何处有所规范？

**基本模式**：搜索 → 阅读 → 总结

## 发现命令

注意将控制台与管道输出编码统一为 UTF-8，确保中文字符正确显示。

### 列出所有规范

```powershell
# 查找所有规范文件
Get-ChildItem -Path 'spec/specs' -Filter 'spec.md' -File -Recurse

# 查找所有能力目录（仅一级目录）
Get-ChildItem -Path 'spec/specs' -Directory

# 显示规范树（Windows 内置 tree；或使用递归列出）
tree spec/specs
# 或
Get-ChildItem -Path 'spec/specs' -Recurse
```

**输出格式**：
```
spec/specs/
├── authentication/
│   └── spec.md
├── billing/
│   └── spec.md
└── notifications/
    └── spec.md
```

### 列出进行中的变更

```powershell
# 显示所有进行中的变更（排除 archive 并按名称排序）
Get-ChildItem -Path 'spec/changes' -Directory |
  Where-Object { $_.Name -ne 'archive' } |
  Sort-Object Name

# 显示每个变更目录的修改时间
Get-ChildItem -Path 'spec/changes' -Directory |
  Where-Object { $_.Name -ne 'archive' } |
  Select-Object Name, LastWriteTime

# 统计进行中的变更数量
(Get-ChildItem -Path 'spec/changes' -Directory |
  Where-Object { $_.Name -ne 'archive' }).Count
```

### 列出已归档的变更

```powershell
# 显示所有已归档变更（仅名称）
Get-ChildItem -Path 'spec/archive' | Select-Object -ExpandProperty Name

# 显示详细信息（包含时间与权限）
Get-ChildItem -Path 'spec/archive' -Force | Format-Table Mode, LastWriteTime, Length, Name

# 查找最近 7 天归档的变更（按目录时间过滤）
Get-ChildItem -Path 'spec/archive' -Directory |
  Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }
```

### 搜索需求

```powershell
# 查找所有需求（递归匹配 .md 文件）
Select-String -Path 'spec/specs/**/*.md' -Pattern '### Requirement:'

# 在特定能力中查找需求
Select-String -Path 'spec/specs/authentication/spec.md' -Pattern '### Requirement:'

# 列出唯一需求名称（抽取标题文本并去重）
Select-String -Path 'spec/specs/**/*.md' -Pattern '^### Requirement:\s*(.+)$' |
  ForEach-Object { $_.Matches[0].Groups[1].Value } |
  Sort-Object -Unique
```

### 搜索场景

```powershell
# 查找所有场景（递归匹配）
Select-String -Path 'spec/specs/**/*.md' -Pattern '#### Scenario:'

# 统计每个规范中的场景数量
$specs = Get-ChildItem -Path 'spec/specs' -Recurse -Filter 'spec.md'
foreach ($s in $specs) {
  $count = (Select-String -Path $s.FullName -Pattern '#### Scenario:' -AllMatches).Count
  Write-Output "$($s.FullName): $count 个场景"
}
```

### 关键词搜索

```powershell
# 查找提到 "authentication" 的规范（不区分大小写）
Select-String -Path 'spec/specs/**/*.md' -Pattern 'authentication' -CaseSensitive:$false

# 查找与 "password" 相关的需求（展示上下文并过滤出需求段）
Select-String -Path 'spec/specs/**/*.md' -Pattern 'password' -CaseSensitive:$false -Context 1,5 |
  ForEach-Object { $_.Context.PreContext + $_.Line + $_.Context.PostContext } |
  Where-Object { $_ -match '### Requirement:' }

# 查找提到 "error" 的场景（展示上下文）
Select-String -Path 'spec/specs/**/*.md' -Pattern 'error' -CaseSensitive:$false -Context 1,10 |
  ForEach-Object { $_.Context.PreContext + $_.Line + $_.Context.PostContext } |
  Where-Object { $_ -match '#### Scenario:' }
```

## 常见查询

### 查询 1：「项目有哪些规范？」

```powershell
# 列出所有能力（仅一级目录名）
Get-ChildItem -Path 'spec/specs' -Directory | Select-Object -ExpandProperty Name

# 统计每个能力的需求数量
foreach ($cap in Get-ChildItem -Path 'spec/specs' -Directory) {
  $name = $cap.Name
  $specPath = Join-Path $cap.FullName 'spec.md'
  if (Test-Path $specPath) {
    $count = (Select-String -Path $specPath -Pattern '### Requirement:' -AllMatches).Count
  } else { $count = 0 }
  Write-Output "$name: $count 条需求"
}
```

**响应格式**：
```markdown
## 现有规范

项目具备以下能力的规范：

- **authentication**：8 条需求
- **billing**：12 条需求
- **notifications**：5 条需求

合计：3 个能力，25 条需求
```

### 查询 2：「当前有哪些变更在进行？」

```powershell
# 附带提案摘要的列表（仅前 20 行，并展示 Why 段）
foreach ($change in (Get-ChildItem -Path 'spec/changes' -Directory | Where-Object { $_.Name -ne 'archive' })) {
  $id = $change.Name
  Write-Output "=== $id ==="
  Get-Content -Path (Join-Path $change.FullName 'proposal.md') -TotalCount 20 |
    Select-String -Pattern '## Why' -Context 0,3
}
```

**响应格式**：
```markdown
## 进行中的变更

当前进行中的变更：

### add-user-auth
**Why**：用户需要安全的认证...

### update-billing-api
**Why**：支付处理需要 v2 API...

合计：2 个进行中变更
```

### 查询 3：「查找 authentication 规范」

```powershell
# 阅读完整规范
Get-Content -Path 'spec/specs/authentication/spec.md'

# 或展示摘要
Write-Output '需求：'
Select-String -Path 'spec/specs/authentication/spec.md' -Pattern '### Requirement:'

Write-Output ''
Write-Output '场景：'
Select-String -Path 'spec/specs/authentication/spec.md' -Pattern '#### Scenario:'
```

**响应格式**：
```markdown
## Authentication 规范

（包含 spec.md 的完整内容）

摘要：
- 8 条需求
- 16 个场景
- 最近修改时间：[来自 git log 的日期]
```

### 查询 4：「查找与 password 相关的规范」

```powershell
# 关键词搜索（附带后文 5 行）
Select-String -Path 'spec/specs/**/*.md' -Pattern 'password' -CaseSensitive:$false -Context 0,5

# 显示提到该关键词的规范（唯一文件列表）
Select-String -Path 'spec/specs/**/*.md' -Pattern 'password' -CaseSensitive:$false |
  Select-Object -ExpandProperty Path |
  Sort-Object -Unique
```

**响应格式**：
```markdown
## Specs Mentioning "Password"

发现于：
- spec/specs/authentication/spec.md（3 条需求）
- spec/specs/security/spec.md（1 条需求）

相关需求：
### Requirement: Password Validation
### Requirement: Password Reset
### Requirement: Password Strength
```

### 查询 5：「变更 X 的具体内容是什么？」

```powershell
# 展示完整的变更上下文
$CHANGE_ID = 'add-user-auth'

Write-Output '=== 提案 ==='
Get-Content -Path ("spec/changes/$CHANGE_ID/proposal.md")

Write-Output ''
Write-Output '=== 任务 ==='
Get-Content -Path ("spec/changes/$CHANGE_ID/tasks.md")

Write-Output ''
Write-Output '=== 规范差异 ==='
Get-ChildItem -Path ("spec/changes/$CHANGE_ID/specs") -Recurse -Filter '*.md' |
  ForEach-Object {
    Write-Output ("文件：{0}" -f $_.FullName)
    Get-Content -Path $_.FullName
  }
```

## 仪表盘视图

创建全面的项目概览：

```powershell
# 项目规范仪表盘（在 PowerShell 中运行）

Write-Output '===  规范仪表盘 ==='
Write-Output ''

# 能力
Write-Output '## 能力'
$CAPS = (Get-ChildItem -Path 'spec/specs' -Directory).Count
Write-Output ("能力总数：{0}" -f $CAPS)
foreach ($cap in Get-ChildItem -Path 'spec/specs' -Directory) {
  $name = $cap.Name
  $specPath = Join-Path $cap.FullName 'spec.md'
  $reqs = (Test-Path $specPath) ? (Select-String -Path $specPath -Pattern '### Requirement:' -AllMatches).Count : 0
  Write-Output ("  - {0}: {1} 条需求" -f $name, $reqs)
}
Write-Output ''

# 需求
Write-Output '## 需求'
$TOTAL_REQS = (Select-String -Path 'spec/specs/**/*.md' -Pattern '### Requirement:' -AllMatches).Count
$TOTAL_SCENARIOS = (Select-String -Path 'spec/specs/**/*.md' -Pattern '#### Scenario:' -AllMatches).Count
Write-Output ("需求总数：{0}" -f $TOTAL_REQS)
Write-Output ("场景总数：{0}" -f $TOTAL_SCENARIOS)
$avg = if ($TOTAL_REQS -gt 0) { [math]::Round($TOTAL_SCENARIOS / $TOTAL_REQS, 1) } else { 0 }
Write-Output ("每条需求平均场景数：{0}" -f $avg)
Write-Output ''

# 变更
Write-Output '## 变更'
$ACTIVE = (Get-ChildItem -Path 'spec/changes' -Directory | Where-Object { $_.Name -ne 'archive' }).Count
$ARCHIVED = (Get-ChildItem -Path 'spec/archive' | Measure-Object).Count
Write-Output ("进行中变更：{0}" -f $ACTIVE)
Write-Output ("已归档变更：{0}" -f $ARCHIVED)
Write-Output ''

# 最近活动
Write-Output '## 最近活动'
Write-Output '最近修改的规范：'
Get-ChildItem -Path 'spec/specs' -Recurse -Filter 'spec.md' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 5 |
  ForEach-Object {
    $days = [int]((Get-Date) - $_.LastWriteTime).TotalDays
    Write-Output ("- {0}（{1} 天前）" -f $_.FullName, $days)
  }
```

**响应格式**：
```markdown
# 规范仪表盘
## 能力
能力总数：3
  - authentication：8 条需求
  - billing：12 条需求
  - notifications：5 条需求
## 需求
需求总数：25
场景总数：52
每条需求平均场景数：2.1
## 变更
进行中变更：2
已归档变更：15
## 最近活动
最近修改的规范：
- spec/specs/billing/spec.md（2 天前）
- spec/specs/authentication/spec.md（1 周前）
```

## 高级查询

### 查找相关需求

```powershell
# 查找提到其他需求的内容（展示上下文并过滤出需求行）
Select-String -Path 'spec/specs/**/*.md' -Pattern 'User Login' -Context 0,10 |
  ForEach-Object { $_.Context.PreContext + $_.Line + $_.Context.PostContext } |
  Where-Object { $_ -match '### Requirement:' }

# 查找交叉引用（包含 "See Requirement:")
Select-String -Path 'spec/specs/**/*.md' -Pattern 'See Requirement:'
```

### 分析覆盖度

```powershell
# 查找无场景的需求（近邻 50 行范围内无场景）
foreach ($file in Get-ChildItem -Path 'spec/specs' -Recurse -Filter 'spec.md') {
  $content = Get-Content -Path $file.FullName
  $matches = Select-String -Path $file.FullName -Pattern '### Requirement:'
  foreach ($m in $matches) {
    $hasScenario = $false
    for ($i = $m.LineNumber; $i -lt [Math]::Min($m.LineNumber + 50, $content.Length); $i++) {
      if ($content[$i - 1] -match '#### Scenario:') { $hasScenario = $true; break }
    }
    if (-not $hasScenario) { Write-Output $m.Line }
  }
}

# 查找不包含完整 Given/When/Then 的场景（上下文 5 行检查）
Select-String -Path 'spec/specs/**/*.md' -Pattern '#### Scenario:' -Context 0,5 |
  Where-Object { ($_.Context.PreContext + $_.Line + $_.Context.PostContext) -join "`n" -notmatch 'GIVEN|WHEN|THEN' }
```

### 对比进行中与已归档

```powershell
# 展示时间演化
Write-Output '归档历史：'
Get-ChildItem -Path 'spec/archive' | Select-Object -ExpandProperty Name | Select-Object -First 10

Write-Output '最近归档（过去 30 天）：'
Get-ChildItem -Path 'spec/archive' -Directory |
  Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-30) } |
  Select-Object -ExpandProperty Name
```

## 搜索模式

### 模式 1：能力发现

用户提问：「系统能做什么？」

```powershell
# 列出能力（仅一级目录名）
Get-ChildItem -Path 'spec/specs' -Directory | Select-Object -ExpandProperty Name

# 展示高层需求（每个能力取前三条）
foreach ($cap in Get-ChildItem -Path 'spec/specs' -Directory) {
  Write-Output ("=== {0} ===" -f $cap.Name)
  Select-String -Path (Join-Path $cap.FullName 'spec.md') -Pattern '### Requirement:' |
    Select-Object -First 3
}
```

### 模式 2：功能搜索

用户提问：「有密码重置的规范吗？」

```powershell
# 关键词搜索（上下文：前 1 行，后 10 行）
Select-String -Path 'spec/specs/**/*.md' -Pattern 'password reset' -CaseSensitive:$false -Context 1,10

# 若找到，展示完整需求（根据标题匹配，附加上下文）
Select-String -Path 'spec/specs/**/*.md' -Pattern 'Requirement:.*Password Reset' -CaseSensitive:$false -Context 1,20
```

### 模式 3：变更跟踪

用户提问：「现在做什么？」

```powershell
# 附带状态展示进行中的变更
foreach ($change in Get-ChildItem -Path 'spec/changes' -Directory | Where-Object { $_.Name -ne 'archive' }) {
  $id = $change.Name
  Write-Output ("{0}:" -f $id)
  if (Test-Path (Join-Path $change.FullName 'IMPLEMENTED')) {
    Write-Output '  状态：已实施'
  } else {
    Write-Output '  状态：进行中'
  }
  $taskFile = Join-Path $change.FullName 'tasks.md'
  $taskCount = (Test-Path $taskFile) ? (Select-String -Path $taskFile -Pattern '^\d+\.' -AllMatches).Count : 0
  Write-Output ("  任务数：{0}" -f $taskCount)
}
```

## 最佳实践

### 模式 1：先提供上下文再给细节

**良好流程**：
```markdown
1. 展示仪表盘（高层概览）
2. 用户询问具体能力
3. 展示该能力的需求
4. 用户询问具体需求
5. 展示包含场景的完整需求
```

### 模式 2：高效使用 grep

```powershell
# 结合过滤器提高精度（先匹配需求，再按行过滤包含 auth）
Select-String -Path 'spec/specs/**/*.md' -Pattern '### Requirement:' |
  Where-Object { $_.Line -match '(?i)auth' }

# 使用上下文标志提升可读性（前 2 行，后 10 行）
Select-String -Path 'spec/specs/authentication/spec.md' -Pattern '#### Scenario:' -Context 2,10
```

### 模式 3：聚合信息

不要只是复制文件内容。应做总结：

```markdown
**坏**：（直接输出整个规范文件）

**好**：
"authentication 规范包含 8 条需求，覆盖：
- 用户登录
- 密码管理
- 会话处理
- 多因素认证

需要我展示某条具体需求吗？"
```

## 反模式避免

**不要**：
- 未经请求就读取整个规范文件
- 默认列出所有需求
- 输出未经格式化的原始 grep 结果
- 假定用户知道能力名称

**要**：
- 先给高层概览
- 询问用户希望深入了解的领域
- 清晰格式化输出
- 提供导航提示

## 参考资料

- [SEARCH_PATTERNS.md](reference/SEARCH_PATTERNS.md) - 高级 grep/find 模式

---

**Token 预算**：此 SKILL.md 约 490 行，低于建议的 500 行上限。