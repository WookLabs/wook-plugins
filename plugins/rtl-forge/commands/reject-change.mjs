#!/usr/bin/env node

/**
 * Reject RTL Change Command
 *
 * 대기 중인 RTL 변경을 거부합니다.
 *
 * Usage:
 *   /reject-change --reason "타이밍 다이어그램 재검토 필요"
 *   /reject-change --id <change-id> --reason "이유"
 */

import fs from 'fs';
import path from 'path';

const OMC_DIR = '.omc/rtl-forge';
const PENDING_FILE = path.join(OMC_DIR, 'pending-changes.json');
const HISTORY_FILE = path.join(OMC_DIR, 'change-history.json');

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
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export default async function rejectChange(args) {
  const options = parseArgs(args);

  if (!options.reason) {
    return {
      success: false,
      message: '거부 이유를 명시해주세요: /reject-change --reason "이유"'
    };
  }

  // 대기 중인 변경 로드
  const pending = loadJson(PENDING_FILE, { changes: [] });

  if (pending.changes.length === 0) {
    return {
      success: false,
      message: '거부할 RTL 변경이 없습니다.'
    };
  }

  // 특정 ID가 지정된 경우
  let changeToReject;
  if (options.id) {
    changeToReject = pending.changes.find(c => c.id === options.id);
    if (!changeToReject) {
      return {
        success: false,
        message: `ID '${options.id}'에 해당하는 변경을 찾을 수 없습니다.`
      };
    }
  } else {
    // 가장 최근 변경 거부
    changeToReject = pending.changes[pending.changes.length - 1];
  }

  // 거부 처리
  const rejectedChange = {
    ...changeToReject,
    rejectedAt: new Date().toISOString(),
    rejectedBy: 'user',
    reason: options.reason
  };

  // 히스토리에 기록
  const history = loadJson(HISTORY_FILE, { history: [] });
  history.history.push({
    ...rejectedChange,
    action: 'REJECTED'
  });
  saveJson(HISTORY_FILE, history);

  // 대기 목록에서 제거
  pending.changes = pending.changes.filter(c => c.id !== changeToReject.id);
  saveJson(PENDING_FILE, pending);

  return {
    success: true,
    message: `
╔═══════════════════════════════════════════════════════════════╗
║                    ✗ RTL CHANGE REJECTED                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  파일: ${changeToReject.file.padEnd(50)}║
║  변경 ID: ${changeToReject.id.padEnd(46)}║
║  거부 시각: ${rejectedChange.rejectedAt.padEnd(44)}║
║                                                               ║
║  거부 이유:                                                   ║
║  ${options.reason.substring(0, 57).padEnd(57)}║
║                                                               ║
║  변경 제안을 수정하여 다시 제출해주세요.                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`,
    change: rejectedChange
  };
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--reason' && args[i + 1]) {
      options.reason = args[i + 1];
      i++;
    } else if (args[i] === '--id' && args[i + 1]) {
      options.id = args[i + 1];
      i++;
    }
  }
  return options;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  rejectChange(args)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
