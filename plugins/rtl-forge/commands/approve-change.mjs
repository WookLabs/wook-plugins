#!/usr/bin/env node

/**
 * Approve RTL Change Command
 *
 * 대기 중인 RTL 변경을 승인합니다.
 *
 * Usage:
 *   /approve-change
 *   /approve-change --comment "조건부 승인: 테스트 추가 필요"
 *   /approve-change --id <change-id>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OMC_DIR = '.omc/rtl-forge';
const PENDING_FILE = path.join(OMC_DIR, 'pending-changes.json');
const APPROVED_FILE = path.join(OMC_DIR, 'approved-changes.json');
const HISTORY_FILE = path.join(OMC_DIR, 'change-history.json');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function loadJson(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error loading ${filePath}:`, e.message);
  }
  return defaultValue;
}

function saveJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export default async function approveChange(args) {
  const options = parseArgs(args);

  // 대기 중인 변경 로드
  const pending = loadJson(PENDING_FILE, { changes: [] });

  if (pending.changes.length === 0) {
    return {
      success: false,
      message: '승인 대기 중인 RTL 변경이 없습니다.'
    };
  }

  // 특정 ID가 지정된 경우
  let changeToApprove;
  if (options.id) {
    changeToApprove = pending.changes.find(c => c.id === options.id);
    if (!changeToApprove) {
      return {
        success: false,
        message: `ID '${options.id}'에 해당하는 변경을 찾을 수 없습니다.`
      };
    }
  } else {
    // 가장 최근 변경 승인
    changeToApprove = pending.changes[pending.changes.length - 1];
  }

  // 승인 처리
  const approvedChange = {
    ...changeToApprove,
    approvedAt: new Date().toISOString(),
    approvedBy: 'user',
    comment: options.comment || null
  };

  // 승인 목록에 추가
  const approved = loadJson(APPROVED_FILE, { approved: [] });
  approved.approved.push({
    file: changeToApprove.file,
    hash: changeToApprove.hash,
    approvedAt: approvedChange.approvedAt
  });
  saveJson(APPROVED_FILE, approved);

  // 히스토리에 기록
  const history = loadJson(HISTORY_FILE, { history: [] });
  history.history.push({
    ...approvedChange,
    action: 'APPROVED'
  });
  saveJson(HISTORY_FILE, history);

  // 대기 목록에서 제거
  pending.changes = pending.changes.filter(c => c.id !== changeToApprove.id);
  saveJson(PENDING_FILE, pending);

  return {
    success: true,
    message: `
╔═══════════════════════════════════════════════════════════════╗
║                    ✓ RTL CHANGE APPROVED                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  파일: ${changeToApprove.file.padEnd(50)}║
║  변경 ID: ${changeToApprove.id.padEnd(46)}║
║  승인 시각: ${approvedChange.approvedAt.padEnd(44)}║
${options.comment ? `║  코멘트: ${options.comment.substring(0, 48).padEnd(48)}║\n` : ''}║                                                               ║
║  이제 RTL 파일을 수정할 수 있습니다.                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`,
    change: approvedChange
  };
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--comment' && args[i + 1]) {
      options.comment = args[i + 1];
      i++;
    } else if (args[i] === '--id' && args[i + 1]) {
      options.id = args[i + 1];
      i++;
    }
  }
  return options;
}

// CLI entry point
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  approveChange(args)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
