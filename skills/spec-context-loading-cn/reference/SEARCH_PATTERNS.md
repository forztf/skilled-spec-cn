# Windows终端下查找Markdown文件内容技巧汇总

以下整理一些在Windows终端（如 PowerShell、CMD 或 Windows Terminal）下，针对 Markdown 文件内容查找的常用方法和技巧：

## 1. 使用 findstr 查找内容

`findstr` 是 Windows 下常用的命令行查找工具，支持正则表达式。

### 查找包含关键词的行

```powershell
findstr /C:"关键词" *.md
```

### 支持递归查找

```powershell
findstr /S /C:"关键词" *.md
```
- `/S`：递归子目录查找

### 查找多个关键词（包含任一）

```powershell
findstr /I "关键字1 关键字2" *.md
```
- `/I`：忽略大小写

### 查找不包含某关键词的行

```powershell
findstr /V "不包含的词" *.md
```
- `/V`：查找不包含指定内容的行

### 使用正则表达式查找（部分支持）

```powershell
findstr /R /C:"^# " *.md
```
- `/R`：使用正则表达式
- `/C:"表达式"`：指定搜索字符串或表达式

## 2. 利用 PowerShell 强大字符串处理能力

### 获取包含关键词的行及文件名

```powershell
Get-ChildItem -Recurse -Filter *.md | Select-String "关键词"
```

### 查找包含多关键词的行

```powershell
Get-ChildItem -Recurse -Filter *.md | Select-String "关键字1|关键字2"
```

### 查找并统计匹配数量

```powershell
(Get-ChildItem -Recurse -Filter *.md | Select-String "关键词").Count
```

### 只显示文件名

```powershell
Get-ChildItem -Recurse -Filter *.md | Select-String "关键词" | Select-Object -ExpandProperty Path
```

## 3. 模糊/复杂模式查找建议

- 使用正则表达式时，建议采用 PowerShell 的 `Select-String`。
- 例如查找代码块开头：

```powershell
Select-String "^```" *.md
```

- 查找所有标题（以 # 开头）：

```powershell
Select-String "^#" *.md
```

## 4. 其他技巧

- 查看与标记相关内容（如 TODO、FIXME）：

```powershell
findstr /S /I "TODO FIXME" *.md
```

- 结合管道进行更复杂的过滤处理：

```powershell
Get-ChildItem -Recurse -Filter *.md | Select-String "关键词" | Where-Object { $_.Line -notmatch "排除词" }
```

## 5. 扩展工具推荐

- **grep for Windows**：可安装 [GnuWin32 grep](http://gnuwin32.sourceforge.net/packages/grep.htm) 或 [Git Bash (含grep)](https://gitforwindows.org/) 获得和 Linux 一样的强大 grep 查找能力。

  示例：

  ```bash
  grep -rn "关键词" *.md
  ```

## 6. 中文显示乱码解决方案（Windows 终端）

在 Windows 的 PowerShell/CMD/Windows Terminal 下，显示中文可能出现乱码。以下为通用修复方案：

### 6.1 PowerShell（建议）

```powershell
# 将控制台与管道输出编码统一为 UTF-8
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()

# 切换控制台代码页为 UTF-8（可选，但常见场景需要）
chcp 65001

# 验证：应正确显示中文
Write-Output "中文测试：你好，世界"
```

- 如需写入文件，请显式使用 UTF-8 编码：

```powershell
# 将查询结果保存为 UTF-8 文件，避免中文乱码
Select-String -Path '*.md' -Pattern '中文' | Out-File 'result.txt' -Encoding utf8
```

- 读取文件时指定编码：

```powershell
Get-Content -Path '.\\README.md' -Encoding utf8
```

### 6.2 CMD（命令提示符）

```powershell
# 切换代码页至 UTF-8
chcp 65001

# 验证输出
echo 中文测试：你好，世界
```

> 提示：`findstr` 在非 UTF-8 代码页下易产生乱码，先执行 `chcp 65001` 再运行查找命令。

### 6.3 Windows Terminal 建议

- 在设置中将字体选择为支持中文的等宽字体（如 `Microsoft YaHei Mono`、`NSimSun` 等）。
- 优先使用 PowerShell 7+（默认更友好地支持 UTF-8）。

### 6.4 文件编码与管道注意事项

- 确保 Markdown 文件实际保存为 UTF-8（推荐无 BOM）。
- 当通过管道或重定向写入文件时，显式指定 `-Encoding utf8`。
- 若仍出现乱码，先执行 6.1 的两行编码设置，再运行查找命令。

### 6.5 快速一键修复片段

```powershell
# 常用的一次性修复：设置控制台与管道为 UTF-8 并切换代码页
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001
```

---

**总结：**  
Windows终端下推荐优先用 `findstr` 和 PowerShell 的 `Select-String` 实现高效 Markdown 文件内容查找。面对更复杂的需求，也可安装 grep 使用。
