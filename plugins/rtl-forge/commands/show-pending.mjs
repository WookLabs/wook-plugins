#!/usr/bin/env node

/**
 * Show Pending RTL Changes & Specs Command
 *
 * 승인 대기 중인 RTL 변경 및 스펙 문서 목록을 표시합니다.
 *
 * Usage:
 *   /show-pending
 *   /show-pending --verbose
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OMC_DIR = '.omc/rtl-forge';
const PENDING_CHANGES_FILE = path.join(OMC_DIR, 'pending-changes.json');
const PENDING_SPECS_FILE = path.join(OMC_DIR, 'pending-specs.json');

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

export default async function showPending(args) {
  const options = parseArgs(args);
  const pendingChanges = loadJson(PENDING_CHANGES_FILE, { changes: [] });
  const pendingSpecs = loadJson(PENDING_SPECS_FILE, { specs: [] });

  const hasChanges = pendingChanges.changes.length > 0;
  const hasSpecs = pendingSpecs.specs.length > 0;

  if (!hasChanges && !hasSpecs) {
    return {
      success: true,
      message: `
╔═══════════════════════════════════════════════════════════════╗
║              📋 PENDING SPECS & RTL CHANGES                   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  승인 대기 중인 스펙 문서 및 RTL 변경이 없습니다.             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`,
      specs: [],
      changes: []
    };
  }

  let output = `
╔═══════════════════════════════════════════════════════════════╗
║              📋 PENDING SPECS & RTL CHANGES                   ║
╠═══════════════════════════════════════════════════════════════╣
`;

  // Pending Specs Section
  if (hasSpecs) {
    output += `║                                                               ║
║  📄 PENDING SPECS (${String(pendingSpecs.specs.length).padEnd(2)} 건)                                   ║
║───────────────────────────────────────────────────────────────║
`;
    for (const spec of pendingSpecs.specs) {
      output += `║                                                               ║
║  ID: ${spec.id.padEnd(54)}║
║  모듈: ${(spec.module || 'N/A').padEnd(52)}║
║  타입: ${(spec.type || 'N/A').padEnd(52)}║
║  제출 시각: ${spec.submittedAt.padEnd(46)}║
`;
      if (options.verbose && spec.summary) {
        output += `║  요약: ${spec.summary.substring(0, 52).padEnd(52)}║
`;
      }
      output += `║───────────────────────────────────────────────────────────────║
`;
    }
  }

  // Pending Changes Section
  if (hasChanges) {
    output += `║                                                               ║
║  🔧 PENDING CHANGES (${String(pendingChanges.changes.length).padEnd(2)} 건)                                ║
║───────────────────────────────────────────────────────────────║
`;
    for (const change of pendingChanges.changes) {
      output += `║                                                               ║
║  ID: ${change.id.padEnd(54)}║
║  파일: ${change.file.padEnd(52)}║
║  제안 시각: ${change.proposedAt.padEnd(46)}║
║  이유: ${(change.reason || 'N/A').substring(0, 52).padEnd(52)}║
║  위험도: ${(change.riskLevel || 'N/A').padEnd(50)}║
`;

      if (options.verbose && change.summary) {
        output += `║  요약: ${change.summary.substring(0, 52).padEnd(52)}║
`;
      }

      output += `║───────────────────────────────────────────────────────────────║
`;
    }
  }

  output += `║                                                               ║
║  📌 명령어:                                                   ║
║    /approve-spec            - 최근 스펙 승인                  ║
║    /approve-spec --id ID    - 특정 스펙 승인                  ║
║    /reject-spec --reason "이유"  - 스펙 거부                  ║
║                                                               ║
║    /approve-change          - 최근 변경 승인                  ║
║    /approve-change --id ID  - 특정 변경 승인                  ║
║    /reject-change --reason "이유"  - 변경 거부                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

  return {
    success: true,
    message: output,
    specs: pendingSpecs.specs,
    changes: pendingChanges.changes
  };
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--verbose' || args[i] === '-v') {
      options.verbose = true;
    }
  }
  return options;
}

// CLI entry point
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  showPending(args)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
