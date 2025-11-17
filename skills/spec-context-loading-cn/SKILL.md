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

```bash
# 查找所有规范文件
find spec/specs -type f -name 'spec.md'

# 查找所有能力目录（仅一级目录）
find spec/specs -maxdepth 1 -mindepth 1 -type d

# 显示规范树（Windows 内置 tree；或使用递归列出）
tree spec/specs
# 或
find spec/specs -print
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

```bash
# 显示所有进行中的变更（排除 archive 并按名称排序）
find spec/changes -maxdepth 1 -mindepth 1 -type d ! -name 'archive' | sort

# 显示每个变更目录的修改时间
for d in spec/changes/*; do
  [ -d "$d" ] && [ "$(basename "$d")" != "archive" ] && printf "%s\t%s\n" "$(basename "$d")" "$(stat -c '%y' "$d")";
done

# 统计进行中的变更数量
find spec/changes -maxdepth 1 -mindepth 1 -type d ! -name 'archive' | wc -l
```

### 列出已归档的变更

```bash
# 显示所有已归档变更（仅名称）
find spec/archive -maxdepth 1 -mindepth 1 -printf '%f\n'

# 显示详细信息（包含时间与权限）
stat -c "%A %y %s %n" spec/archive/*

# 查找最近 7 天归档的变更（按目录时间过滤）
find spec/archive -maxdepth 1 -mindepth 1 -type d -mtime -7 -printf '%f\n'
```

### 搜索需求

```bash
# 查找所有需求（递归匹配 .md 文件）
grep -R -n '^### Requirement:' spec/specs --include='*.md'

# 在特定能力中查找需求
grep -n '^### Requirement:' spec/specs/authentication/spec.md

# 列出唯一需求名称（抽取标题文本并去重）
grep -R -E '^### Requirement:\s*(.+)$' spec/specs --include='*.md' | sed -E 's/.*### Requirement:\s*(.+)$/\1/' | sort -u
```

### 搜索场景

```bash
# 查找所有场景（递归匹配）
grep -R -n '^#### Scenario:' spec/specs --include='*.md'

# 统计每个规范中的场景数量
for s in $(find spec/specs -type f -name 'spec.md'); do
  count=$(grep -c '^#### Scenario:' "$s")
  echo "$s: $count 个场景"
done
```

### 关键词搜索

```bash
# 查找提到 "authentication" 的规范（不区分大小写）
grep -R -i 'authentication' spec/specs --include='*.md'

# 查找与 "password" 相关的需求（展示上下文并过滤出需求段）
grep -R -i -n -C 5 'password' spec/specs --include='*.md' | grep '### Requirement:'

# 查找提到 "error" 的场景（展示上下文）
grep -R -i -n -C 10 'error' spec/specs --include='*.md' | grep '#### Scenario:'
```

## 常见查询

### 查询 1：「项目有哪些规范？」

```bash
# 列出所有能力（仅一级目录名）
find spec/specs -maxdepth 1 -mindepth 1 -type d -printf '%f\n'

# 统计每个能力的需求数量
for cap in spec/specs/*; do
  [ -d "$cap" ] || continue
  name=$(basename "$cap")
  specPath="$cap/spec.md"
  if [ -f "$specPath" ]; then
    count=$(grep -c '^### Requirement:' "$specPath")
  else
    count=0
  fi
  echo "$name: $count 条需求"
done
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

```bash
# 附带提案摘要的列表（仅前 20 行，并展示 Why 段）
for change in $(find 'spec/changes' -maxdepth 1 -mindepth 1 -type d ! -name 'archive'); do
  id=$(basename "$change")
  echo "=== $id ==="
  head -n 20 "$change/proposal.md" | grep -n '## Why' -A 3
done
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

```bash
# 阅读完整规范
cat 'spec/specs/authentication/spec.md'

# 或展示摘要
echo '需求：'
grep -n '### Requirement:' 'spec/specs/authentication/spec.md'

echo ''
echo '场景：'
grep -n '#### Scenario:' 'spec/specs/authentication/spec.md'
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

```bash
# 关键词搜索（附带后文 5 行）
grep -R -i -n -A 5 'password' spec/specs --include='*.md'

# 显示提到该关键词的规范（唯一文件列表）
grep -R -i -l 'password' spec/specs --include='*.md' | sort -u
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

```bash
# 展示完整的变更上下文
CHANGE_ID='add-user-auth'

echo '=== 提案 ==='
cat "spec/changes/$CHANGE_ID/proposal.md"

echo ''
echo '=== 任务 ==='
cat "spec/changes/$CHANGE_ID/tasks.md"

echo ''
echo '=== 规范差异 ==='
find "spec/changes/$CHANGE_ID/specs" -type f -name '*.md' | while read -r f; do
  echo "文件：$f"
  cat "$f"
done
```

## 仪表盘视图

创建全面的项目概览：

```bash
# 项目规范仪表盘（在 bash 中运行）

echo '===  规范仪表盘 ==='
echo ''

# 能力
echo '## 能力'
CAPS=$(find 'spec/specs' -maxdepth 1 -mindepth 1 -type d | wc -l)
echo "能力总数：$CAPS"
for cap in spec/specs/*; do
  [ -d "$cap" ] || continue
  name=$(basename "$cap")
  specPath="$cap/spec.md"
  if [ -f "$specPath" ]; then
    reqs=$(grep -c '### Requirement:' "$specPath")
  else
    reqs=0
  fi
  echo "  - $name: $reqs 条需求"
done
echo ''

# 需求
echo '## 需求'
TOTAL_REQS=$(grep -R -E '### Requirement:' spec/specs --include='*.md' | wc -l)
TOTAL_SCENARIOS=$(grep -R -E '#### Scenario:' spec/specs --include='*.md' | wc -l)
echo "需求总数：$TOTAL_REQS"
echo "场景总数：$TOTAL_SCENARIOS"
if [ "$TOTAL_REQS" -gt 0 ]; then avg=$(awk -v s=$TOTAL_SCENARIOS -v r=$TOTAL_REQS 'BEGIN{printf "%.1f", s/r}'); else avg=0; fi
echo "每条需求平均场景数：$avg"
echo ''

# 变更
echo '## 变更'
ACTIVE=$(find 'spec/changes' -maxdepth 1 -mindepth 1 -type d ! -name 'archive' | wc -l)
ARCHIVED=$(find 'spec/archive' -maxdepth 1 -mindepth 1 | wc -l)
echo "进行中变更：$ACTIVE"
echo "已归档变更：$ARCHIVED"
echo ''

# 最近活动
echo '## 最近活动'
echo '最近修改的规范：'
find 'spec/specs' -type f -name 'spec.md' -printf '%T@ %p\n' | sort -nr | head -5 | awk '{print $2}' | while read -r f; do
  days=$(( ( $(date +%s) - $(stat -c %Y "$f") ) / 86400 ))
  echo "- $f（$days 天前）"
done
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

```bash
# 查找提到其他需求的内容（展示上下文并过滤出需求行）
grep -R -n -C 10 'User Login' spec/specs --include='*.md' | grep '### Requirement:'

# 查找交叉引用（包含 "See Requirement:")
grep -R -n 'See Requirement:' spec/specs --include='*.md'
```

### 分析覆盖度

```bash
# 查找无场景的需求（近邻 50 行范围内无场景）
find 'spec/specs' -type f -name 'spec.md' | while read -r f; do
  awk '
    /^### Requirement:/ { req_line=NR; has=0 }
    (NR>req_line && NR<=req_line+50 && /#### Scenario:/) { has=1 }
    (NR>req_line+50 && req_line) { if(!has) print f":"req_line; req_line=0; has=0 }
    END { if(req_line && !has) print req_line }
  ' f="$f" "$f"
done

# 查找不包含完整 Given/When/Then 的场景（上下文 5 行检查）
grep -R -n -C 5 '#### Scenario:' spec/specs --include='*.md' | awk 'BEGIN{RS="\n--\n"} { block=$0; if (block !~ /GIVEN/ || block !~ /WHEN/ || block !~ /THEN/) print block }'
```

### 对比进行中与已归档

```bash
# 展示时间演化
echo '归档历史：'
ls -1 spec/archive | head -10

echo '最近归档（过去 30 天）：'
find 'spec/archive' -maxdepth 1 -mindepth 1 -type d -mtime -30 -printf '%f\n'
```

## 搜索模式

### 模式 1：能力发现

用户提问：「系统能做什么？」

```bash
# 列出能力（仅一级目录名）
find 'spec/specs' -maxdepth 1 -mindepth 1 -type d -printf '%f\n'

# 展示高层需求（每个能力取前三条）
for cap in spec/specs/*; do
  [ -d "$cap" ] || continue
  echo "=== $(basename "$cap") ==="
  grep -n '### Requirement:' "$cap/spec.md" | head -3
done
```

### 模式 2：功能搜索

用户提问：「有密码重置的规范吗？」

```bash
# 关键词搜索（上下文：前 1 行，后 10 行）
grep -R -i -n -C 10 'password reset' spec/specs --include='*.md'

# 若找到，展示完整需求（根据标题匹配，附加上下文）
grep -R -i -n -C 20 'Requirement:.*Password Reset' spec/specs --include='*.md'
```

### 模式 3：变更跟踪

用户提问：「现在做什么？」

```bash
# 附带状态展示进行中的变更
for change in spec/changes/*; do
  [ -d "$change" ] || continue
  [ "$(basename "$change")" = 'archive' ] && continue
  id=$(basename "$change")
  echo "$id:"
  if [ -f "$change/IMPLEMENTED" ]; then
    echo '  状态：已实施'
  else
    echo '  状态：进行中'
  fi
  taskFile="$change/tasks.md"
  if [ -f "$taskFile" ]; then
    taskCount=$(grep -c -E '^\\d+\.' "$taskFile")
  else
    taskCount=0
  fi
  echo "  任务数：$taskCount"
done
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

```bash
# 结合过滤器提高精度（先匹配需求，再按行过滤包含 auth）
grep -R -n '### Requirement:' spec/specs --include='*.md' | grep -i 'auth'

# 使用上下文标志提升可读性（前 2 行，后 10 行）
grep -n -C 10 '#### Scenario:' spec/specs/authentication/spec.md
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