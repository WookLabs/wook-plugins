#!/usr/bin/env node

/**
 * Propose RTL Change Command
 *
 * RTL 변경 제안을 pending-changes.json에 등록합니다.
 *
 * Usage:
 *   /propose-change --file <path> --hash <hash> --reason <reason>
 *   /propose-change --file src/core.rtl --hash abc123 --reason "Critical bug fix" --summary "Fix overflow" --risk HIGH
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OMC_DIR = '.omc/rtl-forge';
const PENDING_FILE = path.join(OMC_DIR, 'pending-changes.json');

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

function generateChangeId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `chg-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export default async function proposeChange(args) {
  const options = parseArgs(args);

  // 필수 파라미터 검증
  if (!options.file) {
    return {
      success: false,
      message: 'Error: --file parameter is required'
    };
  }

  if (!options.hash) {
    return {
      success: false,
      message: 'Error: --hash parameter is required'
    };
  }

  if (!options.reason) {
    return {
      success: false,
      message: 'Error: --reason parameter is required'
    };
  }

  // 대기 중인 변경 목록 로드
  const pending = loadJson(PENDING_FILE, { changes: [] });

  // 새 변경 제안 생성
  const newChange = {
    id: generateChangeId(),
    file: options.file,
    hash: options.hash,
    reason: options.reason,
    summary: options.summary || null,
    riskLevel: options.risk || 'MEDIUM',
    proposedAt: new Date().toISOString()
  };

  // 변경 목록에 추가
  pending.changes.push(newChange);
  saveJson(PENDING_FILE, pending);

  return {
    success: true,
    message: `
╔═══════════════════════════════════════════════════════════════╗
║                  ✓ RTL CHANGE PROPOSED                        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  변경 ID: ${newChange.id.padEnd(46)}║
║  파일: ${newChange.file.padEnd(50)}║
║  해시: ${newChange.hash.padEnd(50)}║
║  위험도: ${newChange.riskLevel.padEnd(48)}║
${newChange.summary ? `║  요약: ${newChange.summary.substring(0, 50).padEnd(50)}║\n` : ''}║  사유: ${newChange.reason.substring(0, 50).padEnd(50)}║
║  제안 시각: ${newChange.proposedAt.padEnd(44)}║
║                                                               ║
║  승인 대기 중입니다. /approve-change로 승인하세요.            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`,
    change: newChange
  };
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      options.file = args[i + 1];
      i++;
    } else if (args[i] === '--hash' && args[i + 1]) {
      options.hash = args[i + 1];
      i++;
    } else if (args[i] === '--reason' && args[i + 1]) {
      options.reason = args[i + 1];
      i++;
    } else if (args[i] === '--summary' && args[i + 1]) {
      options.summary = args[i + 1];
      i++;
    } else if (args[i] === '--risk' && args[i + 1]) {
      options.risk = args[i + 1];
      i++;
    }
  }
  return options;
}

// CLI entry point
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  proposeChange(args)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
