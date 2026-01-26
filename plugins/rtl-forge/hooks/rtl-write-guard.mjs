#!/usr/bin/env node

/**
 * RTL Write Guard Hook
 *
 * RTL 파일에 대한 무단 수정을 차단합니다.
 * 모든 RTL 수정은 rtl-change-protocol을 통해 사용자 승인을 받아야 합니다.
 *
 * Hook Type: PreToolUse
 * Triggered: Edit, Write 도구 사용 시
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// RTL 파일 확장자
const RTL_EXTENSIONS = [
  '.v',      // Verilog
  '.sv',     // SystemVerilog
  '.vh',     // Verilog Header
  '.svh',    // SystemVerilog Header
  '.vhd',    // VHDL
  '.vhdl'    // VHDL
];

// 승인된 변경 저장 경로
const APPROVED_CHANGES_FILE = '.omc/rtl-forge/approved-changes.json';

/**
 * 승인된 변경 목록 로드
 */
function loadApprovedChanges() {
  try {
    if (fs.existsSync(APPROVED_CHANGES_FILE)) {
      return JSON.parse(fs.readFileSync(APPROVED_CHANGES_FILE, 'utf-8'));
    }
  } catch (e) {
    // 파일 없거나 파싱 실패 시 빈 객체 반환
  }
  return { approved: [] };
}

/**
 * 파일이 RTL 파일인지 확인
 */
function isRtlFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return RTL_EXTENSIONS.includes(ext);
}

/**
 * 변경이 승인되었는지 확인
 */
function isChangeApproved(filePath, changeHash) {
  const approved = loadApprovedChanges();
  return approved.approved.some(
    change => change.file === filePath && change.hash === changeHash
  );
}

/**
 * 변경 해시 생성 (SHA-256)
 */
function generateChangeHash(content) {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 16);  // 앞 16자리만 사용
}

/**
 * 메인 훅 핸들러
 */
export default function rtlWriteGuard(hookContext) {
  const { tool, parameters } = hookContext;

  // Edit 또는 Write 도구만 검사
  if (tool !== 'Edit' && tool !== 'Write') {
    return { decision: 'approve' };
  }

  const filePath = parameters.file_path || parameters.path;

  if (!filePath) {
    return { decision: 'approve' };
  }

  // RTL 파일이 아니면 허용
  if (!isRtlFile(filePath)) {
    return { decision: 'approve' };
  }

  // RTL 파일에 대한 수정 시도 감지
  const content = parameters.content || parameters.new_string || '';
  const changeHash = generateChangeHash(content);

  // 승인된 변경인지 확인
  if (isChangeApproved(filePath, changeHash)) {
    return { decision: 'approve' };
  }

  // 미승인 RTL 수정 차단
  return {
    decision: 'block',
    reason: `
╔═══════════════════════════════════════════════════════════════╗
║                    ⚠️  RTL WRITE BLOCKED                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  RTL 파일 수정이 차단되었습니다.                               ║
║                                                               ║
║  파일: ${path.basename(filePath).padEnd(50)}║
║                                                               ║
║  RTL 코드는 직접 수정할 수 없습니다.                          ║
║  모든 변경은 rtl-change-protocol을 통해                       ║
║  사용자 승인을 받아야 합니다.                                 ║
║                                                               ║
║  필수 절차:                                                   ║
║  1. 변경 이유 명시                                           ║
║  2. BEFORE 타이밍 다이어그램 작성                             ║
║  3. AFTER 타이밍 다이어그램 작성                              ║
║  4. 영향 분석 수행                                           ║
║  5. /approve-change 로 사용자 승인                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Use rtl-change-protocol skill to propose changes with proper timing diagrams and get user approval.
`
  };
}

// CLI 테스트용
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  console.log('RTL Write Guard Hook');
  console.log('====================');
  console.log('Protected extensions:', RTL_EXTENSIONS.join(', '));
  console.log('Approved changes file:', APPROVED_CHANGES_FILE);

  // 테스트
  const testCases = [
    { tool: 'Write', parameters: { file_path: 'test.v', content: 'module test;' } },
    { tool: 'Write', parameters: { file_path: 'test.js', content: 'const x = 1;' } },
    { tool: 'Edit', parameters: { file_path: 'design.sv', new_string: 'always @(posedge clk)' } },
  ];

  console.log('\nTest results:');
  for (const test of testCases) {
    const result = rtlWriteGuard(test);
    console.log(`  ${test.parameters.file_path}: ${result.allow ? '✓ ALLOWED' : '✗ BLOCKED'}`);
  }
}
