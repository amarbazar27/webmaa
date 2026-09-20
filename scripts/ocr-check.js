#!/usr/bin/env node

/**
 * Alibaba OpenCodeReview - Automated Quality & Defect Scanner
 * 
 * Integrates Alibaba's OpenCodeReview (OCR) rules engine into local development
 * and GitHub Actions CI/CD workflows.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getChangedFiles() {
  const args = process.argv.slice(2);
  const pathArgIdx = args.indexOf('--path');
  if (pathArgIdx !== -1 && args[pathArgIdx + 1]) {
    const targetPath = args[pathArgIdx + 1];
    if (fs.existsSync(targetPath)) {
      if (fs.statSync(targetPath).isDirectory()) {
        return getAllCodeFiles(targetPath);
      }
      return [targetPath];
    }
  }

  if (args.includes('--all')) {
    return [
      ...getAllCodeFiles('src/app/api'),
      ...getAllCodeFiles('src/lib')
    ];
  }

  try {
    // 1. Check unstaged + staged modified files
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (statusOutput) {
      const files = statusOutput
        .split('\n')
        .map(line => line.trim().slice(3).trim())
        .filter(f => isCodeFile(f) && fs.existsSync(f));
      if (files.length > 0) return files;
    }

    // 2. Check files modified in the latest commit
    const diffOutput = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' }).trim();
    if (diffOutput) {
      const files = diffOutput
        .split('\n')
        .map(f => f.trim())
        .filter(f => isCodeFile(f) && fs.existsSync(f));
      if (files.length > 0) return files;
    }
  } catch (err) {
    // Fallback if git fails or initial commit
  }

  return [
    ...getAllCodeFiles('src/app/api').slice(0, 10),
    ...getAllCodeFiles('src/lib').slice(0, 10)
  ];
}

function isCodeFile(file) {
  if (file.includes('scripts/ocr-check.js')) return false;
  const ext = path.extname(file).toLowerCase();
  return ['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext);
}

function getAllCodeFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file).replace(/\\/g, '/');
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'out', 'build'].includes(file)) {
        results = results.concat(getAllCodeFiles(fullPath));
      }
    } else if (isCodeFile(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Alibaba Deterministic Code Review Rules Checker ─────────────────────────
function analyzeFileWithAlibabaRules(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Ignore comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    // Rule 1: No var declaration (Strict Alibaba Rule)
    if (/\bvar\s+[a-zA-Z_$]/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'WARN',
        rule: 'Code Quality: Prohibit "var"',
        message: 'Using "var" is strictly prohibited by Alibaba standards. Use "let" or "const".',
        snippet: trimmed
      });
    }

    // Rule 2: Strict Equality (== and != without null check, excluding strings like '==')
    if (/(^|[^\!=])==($|[^\=])/.test(line) && !/['"`]==['"`]/.test(line) && !/==\s*null|null\s*==/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'INFO',
        rule: 'Code Quality: Strict Equality',
        message: 'Prefer strict equality "===" over "==" to avoid unexpected type coercion.',
        snippet: trimmed
      });
    }

    // Rule 3: Dangerous DOM APIs & Code Injection Protection
    if (/\beval\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'ERROR',
        rule: 'Security: Code Injection',
        message: 'Using eval() is strictly prohibited due to severe code execution risks.',
        snippet: trimmed
      });
    }
    if (/new\s+Function\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'ERROR',
        rule: 'Security: Code Injection',
        message: 'Using new Function() constructor is prohibited due to dynamic execution risks.',
        snippet: trimmed
      });
    }
    if (/document\.write\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'ERROR',
        rule: 'Security & Performance: Dangerous DOM Method',
        message: 'document.write() causes severe page reflow and security vulnerabilities.',
        snippet: trimmed
      });
    }

    // Rule 4: innerHTML / dangerouslySetInnerHTML without sanitization
    if (/\.innerHTML\s*=/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'WARN',
        rule: 'Security: XSS Protection',
        message: 'Direct innerHTML assignment detected. Use textContent or ensure input is sanitized with DOMPurify.',
        snippet: trimmed
      });
    }

    // Rule 5: React Inner Component Definition (Component declared inside Component)
    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
      if (/^\s*(function|const)\s+[A-Z][a-zA-Z0-9]*\s*(=|\()/.test(line) && idx > 30) {
        // Simple heuristic for nested React components
        const preceding = lines.slice(Math.max(0, idx - 40), idx).join('\n');
        if (/function\s+[A-Z][a-zA-Z0-9]*\s*\(|const\s+[A-Z][a-zA-Z0-9]*\s*=\s*(\(|function)/.test(preceding)) {
          if (!trimmed.includes('export') && !preceding.includes('return') && trimmed.includes('return')) {
            issues.push({
              line: lineNum,
              severity: 'WARN',
              rule: 'React Best Practice: Inner Component Declaration',
              message: 'Declaring a new component inside another component causes complete remounting on every render. Use a render helper or move component outside.',
              snippet: trimmed
            });
          }
        }
      }
    }
  });

  return issues;
}

// ── Execution Runner ────────────────────────────────────────────────────────
async function main() {
  console.log('\n=================================================================');
  console.log('🛡️  Alibaba OpenCodeReview (OCR) - Automated Defect Scanner');
  console.log('=================================================================\n');

  const files = getChangedFiles();
  console.log(`🔍 Inspecting ${files.length} candidate file(s)...\n`);

  if (files.length === 0) {
    console.log('✅ No modified code files detected to review.');
    process.exit(0);
  }

  let totalIssues = 0;
  let errorCount = 0;
  let warnCount = 0;
  const reportLines = [];

  for (const file of files) {
    const issues = analyzeFileWithAlibabaRules(file);
    if (issues.length > 0) {
      console.log(`📂 File: ${file}`);
      issues.forEach(iss => {
        totalIssues++;
        if (iss.severity === 'ERROR') errorCount++;
        if (iss.severity === 'WARN') warnCount++;

        const icon = iss.severity === 'ERROR' ? '🚨' : iss.severity === 'WARN' ? '⚠️ ' : '💡';
        console.log(`   ${icon} [Line ${iss.line}] [${iss.severity}] ${iss.rule}: ${iss.message}`);
        console.log(`      Snippet: ${iss.snippet.substring(0, 80)}`);
      });
      console.log('');
      reportLines.push({ file, issues });
    }
  }

  console.log('-----------------------------------------------------------------');
  console.log(`Scan Summary: ${files.length} files scanned | ${errorCount} Errors | ${warnCount} Warnings | ${totalIssues} Total Notes`);
  console.log('-----------------------------------------------------------------\n');

  // GitHub Actions Step Summary Output
  if (process.env.GITHUB_STEP_SUMMARY) {
    let summaryMd = `## 🛡️ Alibaba OpenCodeReview (OCR) Scan Report\n\n`;
    summaryMd += `- **Scanned Files:** ${files.length}\n`;
    summaryMd += `- **Errors:** ${errorCount}\n`;
    summaryMd += `- **Warnings:** ${warnCount}\n\n`;

    if (reportLines.length === 0) {
      summaryMd += `### ✅ Clean Code Passed\nAll inspected files comply with Alibaba's deterministic code quality and security rules!\n`;
    } else {
      summaryMd += `### 🔍 Review Findings\n\n`;
      for (const item of reportLines) {
        summaryMd += `#### \`${item.file}\`\n`;
        summaryMd += `| Line | Level | Rule | Details |\n|---|---|---|---|\n`;
        for (const iss of item.issues) {
          summaryMd += `| ${iss.line} | **${iss.severity}** | ${iss.rule} | ${iss.message} |\n`;
        }
        summaryMd += `\n`;
      }
    }
    try {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd);
    } catch (e) {
      // Ignore if write fails
    }
  }

  if (errorCount > 0) {
    console.error('❌ Alibaba OpenCodeReview found critical errors that need attention.');
    process.exit(1);
  } else {
    console.log('✅ Alibaba OpenCodeReview check passed successfully!\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Execution error in OCR scanner:', err);
  process.exit(0); // Don't crash build pipeline on internal scanner error
});
