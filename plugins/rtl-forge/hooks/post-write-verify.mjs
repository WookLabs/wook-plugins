#!/usr/bin/env node

/**
 * Post-Write Verification Hook
 *
 * RTL 파일 수정 후 자동으로 Verilator/Slang lint를 실행합니다.
 *
 * Hook Type: PostToolUse
 * Triggered: Edit, Write 도구 사용 후
 *
 * Claude Code Hook Input (stdin):
 * {
 *   "tool_name": "Edit" | "Write",
 *   "tool_input": {
 *     "file_path": "/absolute/path/to/file.sv",
 *     "old_string": "...",
 *     "new_string": "...",
 *     "content": "..."
 *   },
 *   "tool_result": { ... }
 * }
 *
 * Output (stdout):
 * {
 *   "systemMessage": "✅ Lint passed (verilator)"
 * }
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// RTL 파일 확장자
const RTL_EXTENSIONS = ['.v', '.sv', '.vh', '.svh'];

// 도구 설정 파일 경로
const TOOL_CONFIG_FILE = '.omc/rtl-forge/tool-config.json';

/**
 * 파일이 RTL 파일인지 확인
 */
function isRtlFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return RTL_EXTENSIONS.includes(ext);
}

/**
 * 도구 설정 로드
 */
function loadToolConfig() {
  try {
    if (fs.existsSync(TOOL_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(TOOL_CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {
    // Config 파일 읽기 실패 시 null 반환
  }
  return null;
}

/**
 * 명령어 실행 가능 여부 확인 (Windows/Unix 호환)
 */
function commandExists(command) {
  try {
    const which = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${which} ${command}`, {
      stdio: 'ignore',
      timeout: 2000
    });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 사용 가능한 lint 도구 찾기
 */
function findLintTool() {
  // 1. 설정 파일에서 찾기
  const config = loadToolConfig();
  if (config && config.tools) {
    if (config.tools.verilator && commandExists('verilator')) {
      return { name: 'verilator', path: 'verilator' };
    }
    if (config.tools.slang && commandExists('slang')) {
      return { name: 'slang', path: 'slang' };
    }
  }

  // 2. 자동 감지
  if (commandExists('verilator')) {
    return { name: 'verilator', path: 'verilator' };
  }
  if (commandExists('slang')) {
    return { name: 'slang', path: 'slang' };
  }

  return null;
}

/**
 * Verilator lint 실행
 */
function runVerilator(filePath) {
  try {
    const output = execSync(
      `verilator --lint-only -Wall "${filePath}"`,
      {
        encoding: 'utf-8',
        timeout: 25000,  // 25초 타임아웃
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );

    return {
      success: true,
      output: output.trim()
    };
  } catch (error) {
    // Verilator는 경고가 있어도 exit code 0이 아닐 수 있음
    const output = error.stdout || error.stderr || '';
    const hasErrors = output.toLowerCase().includes('%error');

    return {
      success: !hasErrors,
      output: output.trim(),
      hasWarnings: output.toLowerCase().includes('%warning')
    };
  }
}

/**
 * Slang lint 실행
 */
function runSlang(filePath) {
  try {
    const output = execSync(
      `slang --lint-only "${filePath}"`,
      {
        encoding: 'utf-8',
        timeout: 25000,
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );

    return {
      success: true,
      output: output.trim()
    };
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    const hasErrors = output.toLowerCase().includes('error');

    return {
      success: !hasErrors,
      output: output.trim(),
      hasWarnings: output.toLowerCase().includes('warning')
    };
  }
}

/**
 * Lint 결과 파싱 및 메시지 생성
 */
function formatLintResult(toolName, result) {
  if (result.success && !result.hasWarnings) {
    return `✅ Lint passed (${toolName})`;
  }

  if (result.hasWarnings && !result.output.toLowerCase().includes('%error')) {
    // 경고만 있는 경우
    const warnings = result.output
      .split('\n')
      .filter(line => line.includes('%Warning') || line.toLowerCase().includes('warning'))
      .slice(0, 5)  // 최대 5개 경고만 표시
      .map(line => `  - ${line.trim()}`)
      .join('\n');

    return `⚠️ Lint warnings (${toolName}):\n${warnings}`;
  }

  // 에러가 있는 경우
  const errors = result.output
    .split('\n')
    .filter(line => line.includes('%Error') || line.toLowerCase().includes('error'))
    .slice(0, 5)  // 최대 5개 에러만 표시
    .map(line => `  - ${line.trim()}`)
    .join('\n');

  return `❌ Lint errors (${toolName}):\n${errors}`;
}

/**
 * 메인 훅 핸들러
 */
async function main() {
  try {
    // stdin에서 hook context 읽기
    const stdinData = await readStdin();

    if (!stdinData) {
      // stdin이 없으면 조용히 종료
      process.exit(0);
      return;
    }

    const hookContext = JSON.parse(stdinData);
    const toolInput = hookContext.tool_input || {};
    const filePath = toolInput.file_path;

    // 파일 경로가 없으면 조용히 종료
    if (!filePath) {
      process.exit(0);
      return;
    }

    // RTL 파일이 아니면 조용히 종료
    if (!isRtlFile(filePath)) {
      process.exit(0);
      return;
    }

    // Lint 도구 찾기
    const lintTool = findLintTool();

    if (!lintTool) {
      // Lint 도구가 없으면 안내 메시지만 출력
      console.log(JSON.stringify({
        systemMessage: 'ℹ️ No lint tool available. Consider installing Verilator or Slang for RTL verification.'
      }));
      process.exit(0);
      return;
    }

    // Lint 실행
    let result;
    if (lintTool.name === 'verilator') {
      result = runVerilator(filePath);
    } else if (lintTool.name === 'slang') {
      result = runSlang(filePath);
    }

    // 결과 포맷팅 및 출력
    const message = formatLintResult(lintTool.name, result);
    console.log(JSON.stringify({
      systemMessage: message
    }));

    process.exit(0);
  } catch (error) {
    // 에러가 발생해도 hook은 실패하지 않음 (조용히 종료)
    console.log(JSON.stringify({
      systemMessage: `ℹ️ Post-write verification skipped: ${error.message}`
    }));
    process.exit(0);
  }
}

/**
 * stdin 읽기 (비동기)
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = '';

    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data.trim());
    });

    // stdin이 없으면 1초 후 타임아웃
    setTimeout(() => {
      if (!data) {
        resolve('');
      }
    }, 1000);
  });
}

// 메인 실행
main().catch(error => {
  console.log(JSON.stringify({
    systemMessage: `ℹ️ Hook error: ${error.message}`
  }));
  process.exit(0);
});
