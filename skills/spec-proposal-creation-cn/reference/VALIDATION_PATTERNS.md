# 验证模式

使用 grep 与 bash 的模式，在不依赖外部 CLI 工具的情况下验证提案结构。

## 目录
- 目录结构验证
- 提案文件验证
- 规范差异验证
- 需求格式验证
- 常用验证工作流

## 目录结构验证

### 检查变更目录是否存在

```powershell
# 验证变更目录是否已创建
if (Test-Path "spec/changes/{change-id}") { Write-Output "✓ 目录存在" } else { Write-Output "✗ 目录缺失" }
```

### 列出所有变更

```powershell
# 显示所有进行中的变更（排除 archive）
Get-ChildItem -Path 'spec/changes' | Where-Object { $_.Name -ne 'archive' } | Select-Object -ExpandProperty Name
```

### 检查是否有冲突

```powershell
# 搜索相似的变更 ID（忽略大小写）
Get-ChildItem -Path 'spec/changes' | Where-Object { $_.Name -match ("(?i){search-term}") } | Select-Object -ExpandProperty Name
```

## 提案文件验证

### 检查必需章节

```powershell
# 验证 proposal.md 是否包含必需章节
(Select-String -Path "spec/changes/{change-id}/proposal.md" -Pattern '^## Why' -AllMatches).Count
(Select-String -Path "spec/changes/{change-id}/proposal.md" -Pattern '^## What Changes' -AllMatches).Count
(Select-String -Path "spec/changes/{change-id}/proposal.md" -Pattern '^## Impact' -AllMatches).Count
```

**预期**：每个 grep 返回 1（如果有子章节则可能大于 1）

### 验证任务文件

```powershell
# 统计编号任务数量
(Select-String -Path "spec/changes/{change-id}/tasks.md" -Pattern '^\d+\.' -AllMatches).Count

# 显示任务列表
Select-String -Path "spec/changes/{change-id}/tasks.md" -Pattern '^\d+\.'
```

**预期**：通常为 5-15 个任务

## 规范差异验证

### 检查差异操作是否存在

```powershell
# 统计差异操作标题数量
(Select-String -Path "spec/changes/{change-id}/specs/**/*.md" -Pattern '## ADDED|MODIFIED|REMOVED' -AllMatches).Count
```

**预期**：至少 1 个匹配

### 列出差异操作

```powershell
# 以行号显示所有差异操作
Select-String -Path "spec/changes/{change-id}/specs/**/*.md" -Pattern '## ADDED|MODIFIED|REMOVED'
```

**示例输出**：
```
spec/changes/add-auth/specs/authentication/spec-delta.md:3:## ADDED Requirements
spec/changes/add-auth/specs/authentication/spec-delta.md:45:## MODIFIED Requirements
```

### 验证各部分是否有内容

```powershell
# 检查 ADDED 部分是否包含需求（粗略计数）
$files = Get-ChildItem -Path "spec/changes/{change-id}/specs" -Recurse -Filter '*.md'
$count = 0
foreach ($f in $files) {
  $lines = Get-Content -Path $f.FullName
  $inAdded = $false
  foreach ($line in $lines) {
    if ($line -match '^## ADDED') { $inAdded = $true; continue }
    if ($inAdded -and $line -match '^## [A-Z]') { $inAdded = $false }
    if ($inAdded -and $line -match '^### Requirement:') { $count++ }
  }
}
Write-Output $count
```

## 需求格式验证

### 检查需求标题

```powershell
# 列出所有需求标题
Select-String -Path "spec/changes/{change-id}/specs/**/*.md" -Pattern '### Requirement:'
```

**期望格式**：`### Requirement: 描述性名称`

### 验证场景格式

```powershell
# 检查场景（必须使用四个井号）
Select-String -Path "spec/changes/{change-id}/specs/**/*.md" -Pattern '#### Scenario:'
```

**期望格式**：`#### Scenario: 描述性名称`

### 统计需求与场景数量

```powershell
# 统计需求与场景数量，并输出比率
$REQS = (Select-String -Path "spec/changes/{change-id}/specs/**/*.md" -Pattern '### Requirement:' -AllMatches).Count
$SCENARIOS = (Select-String -Path "spec/changes/{change-id}/specs/**/*.md" -Pattern '#### Scenario:' -AllMatches).Count
Write-Output ("Requirements: {0}" -f $REQS)
Write-Output ("Scenarios: {0}" -f $SCENARIOS)
$Ratio = if ($REQS -gt 0) { [math]::Round($SCENARIOS / $REQS, 1) } else { 0 }
Write-Output ("Ratio: {0}" -f $Ratio)
```

**预期**：比率 >= 2.0（每个需求至少 2 个场景）

### 检查 SHALL 关键字

```powershell
# 验证需求中是否使用 SHALL（具约束性的要求指示）
(Select-String -Path "spec/changes/{change-id}/specs/**/*.md" -Pattern '\bSHALL\b' -AllMatches).Count
```

**预期**：SHALL 的数量至少与需求数量相当

## 完整验证工作流

### 预提交验证脚本

```powershell
# 验证变更提案结构（PowerShell 版本）
param(
  [Parameter(Mandatory=$true)]
  [string]$CHANGE_ID
)
$BASE_PATH = "spec/changes/$CHANGE_ID"

Write-Output "Validating proposal: $CHANGE_ID"
Write-Output "================================"

# 1. 目录存在
if (-not (Test-Path $BASE_PATH)) { Write-Output '✗ Change directory not found'; exit 1 }
Write-Output '✓ Change directory exists'

# 2. 必需文件存在
foreach ($file in 'proposal.md','tasks.md') {
  if (-not (Test-Path (Join-Path $BASE_PATH $file))) { Write-Output ("✗ Missing {0}" -f $file); exit 1 }
  Write-Output ("✓ Found {0}" -f $file)
}

# 3. 提案包含必需章节
foreach ($section in '## Why','## What Changes','## Impact') {
  if (-not (Select-String -Path (Join-Path $BASE_PATH 'proposal.md') -Pattern ([regex]::Escape($section)))) {
    Write-Output ("✗ proposal.md missing section: {0}" -f $section); exit 1
  }
}
Write-Output '✓ Proposal has required sections'

# 4. 任务文件包含编号任务
$TASK_COUNT = (Select-String -Path (Join-Path $BASE_PATH 'tasks.md') -Pattern '^\d+\.' -AllMatches).Count
if ($TASK_COUNT -lt 3) { Write-Output ("✗ tasks.md has insufficient tasks ({0})" -f $TASK_COUNT); exit 1 }
Write-Output ("✓ Found {0} tasks" -f $TASK_COUNT)

# 5. 存在规范差异文件
$DELTA_COUNT = (Get-ChildItem -Path (Join-Path $BASE_PATH 'specs') -Recurse -Filter '*.md' -ErrorAction SilentlyContinue | Measure-Object).Count
if ($DELTA_COUNT -eq 0) { Write-Output '✗ No spec delta files found'; exit 1 }
Write-Output ("✓ Found {0} spec delta file(s)" -f $DELTA_COUNT)

# 6. 存在差异操作
$OPERATIONS = (Select-String -Path (Join-Path $BASE_PATH 'specs/**/*.md') -Pattern '## ADDED|MODIFIED|REMOVED' -AllMatches -ErrorAction SilentlyContinue).Count
if ($OPERATIONS -eq 0) { Write-Output '✗ No delta operations found'; exit 1 }
Write-Output ("✓ Found {0} delta operation(s)" -f $OPERATIONS)

# 7. 需求具备场景
$REQ_COUNT = (Select-String -Path (Join-Path $BASE_PATH 'specs/**/*.md') -Pattern '### Requirement:' -AllMatches -ErrorAction SilentlyContinue).Count
$SCENARIO_COUNT = (Select-String -Path (Join-Path $BASE_PATH 'specs/**/*.md') -Pattern '#### Scenario:' -AllMatches -ErrorAction SilentlyContinue).Count
if ($REQ_COUNT -eq 0) { Write-Output '✗ No requirements found'; exit 1 }
if ($SCENARIO_COUNT -lt $REQ_COUNT) {
  Write-Output ("⚠ Warning: Fewer scenarios ({0}) than requirements ({1})" -f $SCENARIO_COUNT, $REQ_COUNT)
  Write-Output '  Recommendation: At least 2 scenarios per requirement'
} else {
  Write-Output ("✓ Found {0} requirement(s) with {1} scenario(s)" -f $REQ_COUNT, $SCENARIO_COUNT)
}

Write-Output '================================'
Write-Output '✓ Validation passed'
```

**用法**：
```powershell
# 运行 PowerShell 版本验证脚本示例
.\n+```  

```powershell
# 用法示例：保存为 validate-proposal.ps1 后运行
powershell -ExecutionPolicy Bypass -File .\validate-proposal.ps1 -CHANGE_ID add-user-auth
```

## 常见问题与修复

### 问题：缺少场景

**检测**：
```powershell
# 查找没有场景的需求（简单近邻检查）
foreach ($file in Get-ChildItem -Path "spec/changes/{change-id}/specs" -Recurse -Filter 'spec.md') {
  $content = Get-Content -Path $file.FullName
  $matches = Select-String -Path $file.FullName -Pattern '^### Requirement:'
  foreach ($m in $matches) {
    $hasScenario = $false
    for ($i = $m.LineNumber; $i -lt [Math]::Min($m.LineNumber + 50, $content.Length); $i++) {
      if ($content[$i - 1] -match '^#### Scenario:') { $hasScenario = $true; break }
    }
    if (-not $hasScenario) { Write-Output $m.Line }
  }
}
```

**修复**：为每个需求添加场景

### 问题：场景标题层级错误

**检测**：
```powershell
# 查找场景标题井号数量错误（不完全等于 4）
Select-String -Path "spec/changes/{change-id}/specs/**/*.md" -Pattern '^###\?\s+Scenario:|^#####\+\s+Scenario:'
```

**修复**：场景必须使用恰好 4 个井号：`#### Scenario:`

### 问题：缺少差异操作

**检测**：
```powershell
# 检查文件存在需求但无差异操作头
foreach ($file in Get-ChildItem -Path "spec/changes/{change-id}/specs" -Recurse -Filter '*.md') {
  $hasReq = Select-String -Path $file.FullName -Pattern '### Requirement:'
  $hasOp = Select-String -Path $file.FullName -Pattern '## ADDED|MODIFIED|REMOVED'
  if ($hasReq -and -not $hasOp) { Write-Output ("Missing delta operation in: {0}" -f $file.FullName) }
}
```

**修复**：添加适当的差异操作标题（ADDED/MODIFIED/REMOVED）

## 快速验证命令

### 一行命令：完整结构检查

```powershell
# 快速验证变更结构
$CHANGE_ID = 'add-user-auth'
if (Test-Path "spec/changes/$CHANGE_ID/proposal.md" -and \
    Test-Path "spec/changes/$CHANGE_ID/tasks.md" -and \
    (Select-String -Path "spec/changes/$CHANGE_ID/specs/**/*.md" -Pattern '## ADDED|MODIFIED|REMOVED') -and \
    (Select-String -Path "spec/changes/$CHANGE_ID/specs/**/*.md" -Pattern '### Requirement:') -and \
    (Select-String -Path "spec/changes/$CHANGE_ID/specs/**/*.md" -Pattern '#### Scenario:')) {
  Write-Output '✓ All validations passed'
} else {
  Write-Output '✗ Validation failed'
}
```

### 显示提案摘要

```powershell
# 展示提案概览
$CHANGE_ID = 'add-user-auth'
Write-Output ("Proposal: {0}" -f $CHANGE_ID)
Write-Output ("Files: {0}" -f ((Get-ChildItem -Path "spec/changes/$CHANGE_ID" -Recurse -File).Count))
Write-Output ("Tasks: {0}" -f ((Select-String -Path "spec/changes/$CHANGE_ID/tasks.md" -Pattern '^\d+\.' -AllMatches).Count))
Write-Output ("Requirements: {0}" -f ((Select-String -Path "spec/changes/$CHANGE_ID/specs/**/*.md" -Pattern '### Requirement:' -AllMatches).Count))
Write-Output ("Scenarios: {0}" -f ((Select-String -Path "spec/changes/$CHANGE_ID/specs/**/*.md" -Pattern '#### Scenario:' -AllMatches).Count))
```

## 验证清单

在面向用户展示提案之前：

```markdown
手动检查：
- [ ] 变更 ID 描述性且唯一
- [ ] proposal.md 的 Why 部分解释问题
- [ ] proposal.md 的 What 部分列出具体变更
- [ ] proposal.md 的 Impact 部分标识受影响区域
- [ ] tasks.md 含 5-15 个具体、可测试的任务
- [ ] 任务按依赖顺序排列

自动检查：
- [ ] 目录结构存在
- [ ] 必需文件存在（proposal.md、tasks.md、spec-delta.md）
- [ ] 差异操作存在（ADDED/MODIFIED/REMOVED）
- [ ] 需求遵循格式：`### Requirement: 名称`
- [ ] 场景遵循格式：`#### Scenario: 名称`
- [ ] 每个需求至少包含 2 个场景
- [ ] 需求使用 SHALL 关键字
```

运行所有自动检查：
```powershell
# 执行 PowerShell 版本验证脚本
powershell -ExecutionPolicy Bypass -File .\validate-proposal.ps1 -CHANGE_ID {change-id}
```