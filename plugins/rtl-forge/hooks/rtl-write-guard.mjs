#!/usr/bin/env node

/**
 * RTL Write Guard Hook - Classification-Based Smart Guard
 *
 * RTL 파일에 대한 변경을 분류하여 차단/허용을 결정합니다.
 * Classification-based write protection for RTL files.
 *
 * Hook Type: PreToolUse
 * Triggered: Edit, Write 도구 사용 시
 */

import fs from 'fs';
import path from 'path';

// RTL 파일 확장자 / RTL file extensions
const RTL_EXTENSIONS = [
  '.v',      // Verilog
  '.sv',     // SystemVerilog
  '.vh',     // Verilog Header
  '.svh',    // SystemVerilog Header
  '.vhd',    // VHDL
  '.vhdl'    // VHDL
];

// 테스트벤치 패턴 / Testbench patterns
const TESTBENCH_PATTERNS = [
  /^tb_.*\.sv$/,      // tb_*.sv
  /.*_tb\.sv$/,       // *_tb.sv
  /^test_.*\.sv$/     // test_*.sv
];

// 승인된 변경 저장 경로 / Approved changes file path
const APPROVED_CHANGES_FILE = '.omc/rtl-forge/approved-changes.json';

/**
 * 파일이 RTL 파일인지 확인 / Check if file is RTL
 */
function isRtlFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return RTL_EXTENSIONS.includes(ext);
}

/**
 * 파일이 테스트벤치인지 확인 / Check if file is testbench
 */
function isTestbench(filePath) {
  const basename = path.basename(filePath);
  return TESTBENCH_PATTERNS.some(pattern => pattern.test(basename));
}

/**
 * 승인된 변경 목록 로드 / Load approved changes list
 */
function loadApprovedChanges() {
  try {
    if (fs.existsSync(APPROVED_CHANGES_FILE)) {
      return JSON.parse(fs.readFileSync(APPROVED_CHANGES_FILE, 'utf-8'));
    }
  } catch (e) {
    // 파일 없거나 파싱 실패 시 빈 객체 반환 / Return empty on error
  }
  return { approved: [] };
}

/**
 * 파일에 대한 승인 항목이 있는지 확인 / Check if file has approval entry
 */
function hasApproval(filePath) {
  const approved = loadApprovedChanges();
  return approved.approved.some(change => change.file === filePath);
}

/**
 * stdin에서 JSON 데이터 읽기 / Read JSON data from stdin
 */
async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error(`Failed to parse stdin JSON: ${e.message}`));
      }
    });

    process.stdin.on('error', reject);
  });
}

/**
 * 변경사항 분류 (동적 import) / Classify change (dynamic import)
 */
async function classifyChange(filePath, oldContent, newContent) {
  try {
    const { classifyChange: classify } = await import('../scripts/classify-change.mjs');
    const result = classify({
      filePath,
      oldContent,
      newContent,
      isNewFile: !oldContent,
      isDelete: false
    });
    return result;  // Returns {level, confidence, reasons, subClassification}
  } catch (e) {
    // Import 실패 시 안전하게 허용 / Allow on import failure
    console.error('⚠️ Failed to import classify-change.mjs, allowing change:', e.message);
    return { level: 'TRIVIAL', confidence: 50, reasons: ['Classification failed'] };
  }
}

/**
 * 메인 훅 핸들러 / Main hook handler
 */
async function main() {
  try {
    // stdin에서 입력 읽기 / Read input from stdin
    const input = await readStdin();
    const { tool_name, tool_input } = input;

    // Edit 또는 Write 도구만 검사 / Only check Edit or Write tools
    if (tool_name !== 'Edit' && tool_name !== 'Write') {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          permissionDecision: 'allow',
          updatedInput: {}
        }
      }));
      process.exit(0);
      return;
    }

    const filePath = tool_input.file_path;

    if (!filePath) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          permissionDecision: 'allow',
          updatedInput: {}
        }
      }));
      process.exit(0);
      return;
    }

    // RTL 파일이 아니면 허용 / Allow if not RTL file
    if (!isRtlFile(filePath)) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          permissionDecision: 'allow',
          updatedInput: {}
        }
      }));
      process.exit(0);
      return;
    }

    // 테스트벤치는 항상 허용 / Always allow testbenches
    if (isTestbench(filePath)) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          permissionDecision: 'allow',
          updatedInput: {}
        }
      }));
      process.exit(0);
      return;
    }

    // 기존 파일 내용 읽기 / Read old file content
    let oldContent = '';
    try {
      oldContent = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      // 새 파일인 경우 / New file case
      oldContent = '';
    }

    // 새 내용 계산 / Compute new content
    let newContent = '';
    if (tool_name === 'Write') {
      newContent = tool_input.content || '';
    } else if (tool_name === 'Edit') {
      const oldString = tool_input.old_string || '';
      const newString = tool_input.new_string || '';
      newContent = oldContent.replace(oldString, newString);
    }

    // 변경사항 분류 / Classify the change
    const result = await classifyChange(filePath, oldContent, newContent);

    // TRIVIAL → 허용, 메시지 없음 / TRIVIAL → allow, no message
    if (result.level === 'TRIVIAL') {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          permissionDecision: 'allow',
          updatedInput: {}
        }
      }));
      process.exit(0);
      return;
    }

    // MINOR → 허용, 하위 분류에 따라 메시지 다름 / MINOR → allow with subclassification-specific message
    if (result.level === 'MINOR') {
      if (result.subClassification === 'MINOR-LOGIC') {
        // MINOR-LOGIC: 허용하되 로직 검증 필요 / Allow but require logic reasoning
        console.log(JSON.stringify({
          hookSpecificOutput: {
            permissionDecision: 'allow',
            updatedInput: {}
          },
          systemMessage: '🧠 MINOR-LOGIC RTL change. Logic Quick Check (Tier 1) required before proceeding. Use logic-reasoning skill.'
        }));
      } else {
        // MINOR-MECHANICAL: 허용, 간단한 알림 / Allow with simple notice
        console.log(JSON.stringify({
          hookSpecificOutput: {
            permissionDecision: 'allow',
            updatedInput: {}
          },
          systemMessage: 'ℹ️ MINOR-MECHANICAL RTL change. Post-write lint will verify.'
        }));
      }
      process.exit(0);
      return;
    }

    // MAJOR, ARCHITECTURAL → 승인 확인 / MAJOR, ARCHITECTURAL → check approval
    if (hasApproval(filePath)) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          permissionDecision: 'allow',
          updatedInput: {}
        }
      }));
      process.exit(0);
      return;
    }

    // 미승인 MAJOR/ARCHITECTURAL 변경 차단 / Block unapproved MAJOR/ARCHITECTURAL
    const fileName = path.basename(filePath);
    let message = '';

    if (result.level === 'MAJOR') {
      message = `
╔═══════════════════════════════════════════════════════════════╗
║                 ⚠️  MAJOR RTL CHANGE BLOCKED                  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  File: ${fileName.padEnd(56)}║
║  Classification: MAJOR                                        ║
║                                                               ║
║  This change modifies RTL logic and requires approval.        ║
║                                                               ║
║  Required steps:                                              ║
║  1. Describe change rationale                                 ║
║  2. Create BEFORE timing diagram                              ║
║  3. Create AFTER timing diagram                               ║
║  4. Perform impact analysis                                   ║
║  5. Get user approval via /approve-change                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Use sim-first-workflow skill to propose changes with timing diagrams.
`;
    } else if (result.level === 'ARCHITECTURAL') {
      message = `
╔═══════════════════════════════════════════════════════════════╗
║              ⚠️  ARCHITECTURAL CHANGE BLOCKED                 ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  File: ${fileName.padEnd(56)}║
║  Classification: ARCHITECTURAL                                ║
║                                                               ║
║  This change modifies design architecture and requires        ║
║  systematic planning via Ralplan + formal approval.           ║
║                                                               ║
║  Required steps:                                              ║
║  1. Run Ralplan for iterative design consensus                ║
║  2. Document architectural rationale                          ║
║  3. Create comprehensive timing diagrams                      ║
║  4. Perform cross-module impact analysis                      ║
║  5. Get user approval via /approve-change                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

ARCHITECTURAL changes require Ralplan before sim-first-workflow.
`;
    }

    console.log(JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: 'deny',
        updatedInput: {}
      },
      systemMessage: message.trim()
    }));
    process.exit(0);

  } catch (error) {
    // 에러 시 안전하게 허용 (훅 장애로 작업 중단 방지) / Allow on error to prevent blocking work
    console.error('❌ RTL Write Guard Error:', error.message);
    console.log(JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: 'allow',
        updatedInput: {}
      },
      systemMessage: `⚠️ RTL Write Guard encountered an error and allowed the change: ${error.message}`
    }));
    process.exit(0);
  }
}

// 훅 실행 / Execute hook
main();
