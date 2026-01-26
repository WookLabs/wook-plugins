#!/usr/bin/env node

/**
 * Approve RTL Spec Command
 *
 * 대기 중인 스펙 문서를 승인합니다.
 *
 * Usage:
 *   /approve-spec
 *   /approve-spec --comment "승인합니다"
 *   /approve-spec --id <spec-id>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OMC_DIR = '.omc/rtl-forge';
const PENDING_SPECS_FILE = path.join(OMC_DIR, 'pending-specs.json');
const APPROVED_SPECS_FILE = path.join(OMC_DIR, 'approved-specs.json');
const SPEC_HISTORY_FILE = path.join(OMC_DIR, 'spec-history.json');

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

export default async function approveSpec(args) {
  const options = parseArgs(args);

  // 대기 중인 스펙 로드
  const pending = loadJson(PENDING_SPECS_FILE, { specs: [] });

  if (pending.specs.length === 0) {
    return {
      success: false,
      message: '승인 대기 중인 스펙 문서가 없습니다.'
    };
  }

  // 특정 ID가 지정된 경우
  let specToApprove;
  if (options.id) {
    specToApprove = pending.specs.find(s => s.id === options.id);
    if (!specToApprove) {
      return {
        success: false,
        message: `ID '${options.id}'에 해당하는 스펙을 찾을 수 없습니다.`
      };
    }
  } else {
    // 가장 최근 스펙 승인
    specToApprove = pending.specs[pending.specs.length - 1];
  }

  // 승인 처리
  const approvedSpec = {
    ...specToApprove,
    status: 'APPROVED',
    approvedAt: new Date().toISOString(),
    approvedBy: 'user',
    comment: options.comment || null
  };

  // 승인 목록에 추가
  const approved = loadJson(APPROVED_SPECS_FILE, { approved: [] });
  approved.approved.push({
    id: specToApprove.id,
    file: specToApprove.file,
    title: specToApprove.title,
    approvedAt: approvedSpec.approvedAt
  });
  saveJson(APPROVED_SPECS_FILE, approved);

  // 히스토리에 기록
  const history = loadJson(SPEC_HISTORY_FILE, { history: [] });
  history.history.push({
    ...approvedSpec,
    action: 'APPROVED'
  });
  saveJson(SPEC_HISTORY_FILE, history);

  // 대기 목록에서 제거
  pending.specs = pending.specs.filter(s => s.id !== specToApprove.id);
  saveJson(PENDING_SPECS_FILE, pending);

  return {
    success: true,
    message: `
╔═══════════════════════════════════════════════════════════════╗
║                    ✓ SPEC APPROVED                            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  파일: ${specToApprove.file.padEnd(50)}║
║  제목: ${specToApprove.title.substring(0, 50).padEnd(50)}║
║  스펙 ID: ${specToApprove.id.padEnd(46)}║
║  승인 시각: ${approvedSpec.approvedAt.padEnd(44)}║
${options.comment ? `║  코멘트: ${options.comment.substring(0, 48).padEnd(48)}║\n` : ''}║                                                               ║
║  스펙 문서가 승인되었습니다.                                  ║
║  이제 구현을 시작할 수 있습니다.                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`,
    spec: approvedSpec
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
  approveSpec(args)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
