#!/usr/bin/env node

/**
 * Reject Spec Command
 *
 * 대기 중인 스펙 문서를 거부합니다.
 *
 * Usage:
 *   /reject-spec --reason "인터페이스 재검토 필요"
 *   /reject-spec --id <spec-id> --reason "이유"
 */

import fs from 'fs';
import path from 'path';

const OMC_DIR = '.omc/rtl-forge';
const PENDING_FILE = path.join(OMC_DIR, 'pending-specs.json');
const HISTORY_FILE = path.join(OMC_DIR, 'spec-history.json');

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

export default async function rejectSpec(args) {
  const options = parseArgs(args);

  if (!options.reason) {
    return {
      success: false,
      message: '거부 이유를 명시해주세요: /reject-spec --reason "이유"'
    };
  }

  // 대기 중인 스펙 로드
  const pending = loadJson(PENDING_FILE, { specs: [] });

  if (pending.specs.length === 0) {
    return {
      success: false,
      message: '거부할 스펙 문서가 없습니다.'
    };
  }

  // 특정 ID가 지정된 경우
  let specToReject;
  if (options.id) {
    specToReject = pending.specs.find(s => s.id === options.id);
    if (!specToReject) {
      return {
        success: false,
        message: `ID '${options.id}'에 해당하는 스펙을 찾을 수 없습니다.`
      };
    }
  } else {
    // 가장 최근 스펙 거부
    specToReject = pending.specs[pending.specs.length - 1];
  }

  // 거부 처리
  const rejectedSpec = {
    ...specToReject,
    status: 'REJECTED',
    rejectedAt: new Date().toISOString(),
    rejectedBy: 'user',
    reason: options.reason
  };

  // 히스토리에 기록
  const history = loadJson(HISTORY_FILE, { history: [] });
  history.history.push({
    ...rejectedSpec,
    action: 'REJECTED'
  });
  saveJson(HISTORY_FILE, history);

  // 대기 목록에서 제거
  pending.specs = pending.specs.filter(s => s.id !== specToReject.id);
  saveJson(PENDING_FILE, pending);

  // 모듈명 추출 (안전하게)
  const moduleName = specToReject.module || specToReject.name || 'unknown';
  const specId = specToReject.id || 'unknown';

  return {
    success: true,
    message: `
╔═══════════════════════════════════════════════════════════════╗
║                    ✗ SPEC DOCUMENT REJECTED                   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  모듈: ${moduleName.substring(0, 54).padEnd(54)}║
║  스펙 ID: ${specId.substring(0, 51).padEnd(51)}║
║  거부 시각: ${rejectedSpec.rejectedAt.padEnd(49)}║
║                                                               ║
║  거부 이유:                                                   ║
║  ${options.reason.substring(0, 59).padEnd(59)}║
║                                                               ║
║  스펙 문서를 수정하여 다시 제출해주세요.                      ║
║  문서 상태: DRAFT로 되돌아갑니다.                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`,
    spec: rejectedSpec
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
  rejectSpec(args)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
