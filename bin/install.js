#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 终端输出的 ANSI 颜色码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

/**
 * 日志输出工具
 * @param {string} message 输出的消息文本
 * @param {keyof colors} [color='reset'] 颜色键（reset/bright/green/blue/yellow/red）
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 递归复制目录或文件（保持目录结构）
 * @param {string} src 源路径
 * @param {string} dest 目标路径
 */
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    // 若目标目录不存在则创建（递归）
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    // 遍历子项并逐一复制
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    // 复制文件
    fs.copyFileSync(src, dest);
  }
}

/**
 * 安装 Skilled Spec 到当前项目的 `.claude/skills/` 目录。
 * 步骤：
 * 1) 创建 `.claude` 目录
 * 2) 创建/准备 `skills` 目录
 * 3) 从包内复制 `skills` 到目标目录
 * 4) 创建或更新 `settings.json`
 * 5) 输出后续指引
 */
function install() {
  log('\n🚀 正在为 Claude Code 安装 Skilled Spec...\n', 'bright');

  // 目标目录：用户执行命令的工作目录
  const targetDir = process.cwd();
  const claudeDir = path.join(targetDir, '.claude');
  const skillsTargetDir = path.join(claudeDir, 'skills');
  const settingsFile = path.join(claudeDir, 'settings.json');

  // 源目录：当前包的根目录
  const packageRoot = path.join(__dirname, '..');
  const skillsSourceDir = path.join(packageRoot, 'skills');

  try {
    // 步骤 1：创建 .claude 目录
    log('📁 正在创建 .claude 目录...', 'blue');
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
      log('   ✓ 已创建 .claude/', 'green');
    } else {
      log('   ✓ .claude/ 已存在', 'green');
    }

    // 步骤 2：创建 skills 目录
    if (!fs.existsSync(skillsTargetDir)) {
      fs.mkdirSync(skillsTargetDir, { recursive: true });
    }

    // 步骤 3：复制技能目录
    log('\n📦 正在安装技能...', 'blue');
    const skills = fs.readdirSync(skillsSourceDir);

    skills.forEach(skill => {
      const sourcePath = path.join(skillsSourceDir, skill);
      const targetPath = path.join(skillsTargetDir, skill);

      if (fs.statSync(sourcePath).isDirectory()) {
        copyRecursiveSync(sourcePath, targetPath);
        log(`   ✓ ${skill}`, 'green');
      }
    });

    // 步骤 4：创建或更新 settings.json
    log('\n⚙️  正在配置设置...', 'blue');
    let settings = {};

    if (fs.existsSync(settingsFile)) {
      try {
        const content = fs.readFileSync(settingsFile, 'utf8');
        settings = JSON.parse(content);
        log('   ✓ 已更新现有 settings.json', 'green');
      } catch (e) {
        log('   ⚠ 无法解析现有 settings.json，将创建新的', 'yellow');
      }
    } else {
      log('   ✓ 已创建 settings.json', 'green');
    }

    // 保持所需结构（不覆盖已有配置）
    if (!settings.permissions) {
      settings.permissions = {
        allow: [],
        deny: [],
        ask: []
      };
    }

    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));

    // 成功信息
    log('\n✨ 安装完成！\n', 'bright');
    log('技能安装位置：', 'blue');
    log(`   ${path.relative(targetDir, skillsTargetDir)}/\n`, 'green');

    log('📚 后续步骤：', 'bright');
    log('   1. 启动 Claude Code：claude', 'blue');
    log('   2. 尝试："我想创建提案，添加用户认证"', 'blue');
    log('   3. 阅读：README 获取使用示例\n', 'blue');

    log('🔗 了解更多：https://github.com/forztf/skilled-spec-cn\n', 'blue');

  } catch (error) {
    log('\n❌ 安装失败：', 'red');
    log(`   ${error.message}\n`, 'red');
    process.exit(1);
  }
}

// 执行安装
install();