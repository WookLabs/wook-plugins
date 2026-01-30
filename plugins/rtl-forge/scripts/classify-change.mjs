#!/usr/bin/env node
/**
 * RTL 파일 변경 분류기 / RTL File Change Classifier
 *
 * SystemVerilog/Verilog 파일의 변경사항을 분석하여 영향도를 5단계로 분류합니다.
 * Analyzes SystemVerilog/Verilog file changes and classifies impact into 5 levels.
 *
 * Levels:
 * - TRIVIAL: 헤더, 주석, 공백, TB 파일, lint fix / Headers, comments, whitespace, TB files, lint fixes
 * - MINOR-MECHANICAL: 파라미터 값, 신호명/폭 변경 / Parameter values, signal renames/width changes
 * - MINOR-LOGIC: 단일 always 블록, 로직 버그 수정 / Single always block, logic bug fixes
 * - MAJOR: FSM 변경, 파이프라인 변경, 포트 추가/삭제 / FSM changes, pipeline changes, port add/remove
 * - ARCHITECTURAL: 신규/삭제, 모듈 선언, CDC, top-level 인터페이스 / New/delete, module decl, CDC, top interface
 */

import { fileURLToPath } from 'url';

/**
 * RTL 파일 변경사항 분류 / Classify RTL file changes
 * @param {Object} params
 * @param {string} params.filePath - 파일 경로 / File path
 * @param {string} params.oldContent - 이전 내용 / Old content
 * @param {string} params.newContent - 새 내용 / New content
 * @param {boolean} params.isNewFile - 신규 파일 여부 / Is new file
 * @param {boolean} params.isDelete - 삭제 파일 여부 / Is delete
 * @returns {{level: string, subClassification?: string, confidence: number, reasons: string[]}}
 */
export function classifyChange({ filePath, oldContent, newContent, isNewFile, isDelete }) {
  const reasons = [];

  // === ARCHITECTURAL CHECKS (우선순위 최상 / Highest priority) ===

  // 파일 삭제 / File deletion
  if (isDelete) {
    return {
      level: 'ARCHITECTURAL',
      confidence: 95,
      reasons: ['File deletion']
    };
  }

  // 신규 파일 생성 (단, testbench 제외) / New file creation (except testbench)
  if (isNewFile) {
    if (isTestbenchFile(filePath)) {
      return {
        level: 'TRIVIAL',
        confidence: 90,
        reasons: ['New testbench file']
      };
    }
    return {
      level: 'ARCHITECTURAL',
      confidence: 90,
      reasons: ['New RTL file creation']
    };
  }

  // === TRIVIAL CHECKS (빠른 판별 / Fast detection) ===

  // 헤더 파일 (.vh, .svh) / Header files
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext === 'vh' || ext === 'svh') {
    return {
      level: 'TRIVIAL',
      confidence: 95,
      reasons: ['Header file only (.vh/.svh)']
    };
  }

  // Testbench 파일 / Testbench files
  if (isTestbenchFile(filePath)) {
    return {
      level: 'TRIVIAL',
      confidence: 90,
      reasons: ['Testbench file change']
    };
  }

  // 내용 비교 분석 / Content comparison analysis
  if (oldContent && newContent) {
    const diff = computeDiff(oldContent, newContent);

    // 변경 없음 / No changes
    if (diff.added.length === 0 && diff.removed.length === 0) {
      return {
        level: 'TRIVIAL',
        confidence: 100,
        reasons: ['No actual changes detected']
      };
    }

    // 주석만 변경 / Comment-only changes
    if (isCommentOnlyChange(diff)) {
      return {
        level: 'TRIVIAL',
        confidence: 95,
        reasons: ['Comment-only change']
      };
    }

    // 공백/포맷만 변경 / Whitespace/formatting only
    if (isWhitespaceOnlyChange(diff)) {
      return {
        level: 'TRIVIAL',
        confidence: 95,
        reasons: ['Whitespace/formatting only']
      };
    }

    // Lint fix 패턴 / Lint fix patterns
    if (isLintFixChange(diff)) {
      return {
        level: 'TRIVIAL',
        confidence: 90,
        reasons: ['Lint fix pattern detected']
      };
    }

    // === ARCHITECTURAL PATTERNS ===

    // 모듈 선언 변경 / Module declaration change
    if (hasModuleDeclarationChange(diff)) {
      reasons.push('Module declaration modified');
    }

    // Clock domain crossing 패턴 / CDC patterns
    if (hasCDCPattern(diff)) {
      reasons.push('Clock domain crossing pattern detected');
    }

    // Top-level 인터페이스 변경 (파일명 기반) / Top-level interface change
    if (isTopLevelFile(filePath) && hasPortChange(diff)) {
      reasons.push('Top-level interface change');
    }

    if (reasons.length > 0) {
      return {
        level: 'ARCHITECTURAL',
        confidence: 85,
        reasons
      };
    }

    // === MAJOR PATTERNS ===

    // FSM 변경 / FSM changes
    if (hasFSMChange(diff)) {
      reasons.push('FSM state or transition change');
    }

    // 파이프라인 변경 / Pipeline changes
    if (hasPipelineChange(diff)) {
      reasons.push('Pipeline stage change');
    }

    // 포트 추가/삭제 / Port add/remove
    if (hasPortChange(diff)) {
      reasons.push('Module port added or removed');
    }

    // Clock/reset 로직 / Clock/reset logic
    if (hasClockResetChange(diff)) {
      reasons.push('Clock or reset logic modified');
    }

    // 다중 always 블록 수정 / Multiple always blocks modified
    const alwaysCount = countAlwaysBlockChanges(diff);
    if (alwaysCount > 1) {
      reasons.push(`${alwaysCount} always blocks modified`);
    }

    if (reasons.length > 0) {
      return {
        level: 'MAJOR',
        confidence: 75,
        reasons
      };
    }

    // === MINOR PATTERNS ===

    // 단일 always 블록 / Single always block
    if (alwaysCount === 1) {
      reasons.push('Single always block modified');
    }

    // 파라미터/localparam 값 변경 / Parameter value change
    if (hasParameterValueChange(diff)) {
      reasons.push('Parameter or localparam value changed');
    }

    // 신호 이름 변경 / Signal rename
    if (hasSignalRename(diff)) {
      reasons.push('Wire/reg/logic signal renamed');
    }

    // 신호 폭 변경 / Signal width change
    if (hasSignalWidthChange(diff)) {
      reasons.push('Signal width changed');
    }

    if (reasons.length > 0) {
      // Determine sub-classification for MINOR
      const isLogicChange = alwaysCount >= 1 || hasLogicKeywords(diff);
      return {
        level: 'MINOR',
        subClassification: isLogicChange ? 'MINOR-LOGIC' : 'MINOR-MECHANICAL',
        confidence: 80,
        reasons
      };
    }
  }

  // 기본값: 분류 불가 시 MINOR로 안전하게 처리 / Default: safely classify as MINOR-LOGIC
  return {
    level: 'MINOR',
    subClassification: 'MINOR-LOGIC',  // Default to safer option
    confidence: 60,
    reasons: ['Unable to classify - defaulting to MINOR-LOGIC']
  };
}

// ============================================================================
// HELPER FUNCTIONS / 헬퍼 함수들
// ============================================================================

/**
 * Testbench 파일 여부 판별 / Detect testbench files
 */
function isTestbenchFile(filePath) {
  const filename = filePath.split(/[/\\]/).pop()?.toLowerCase() || '';
  return filename.startsWith('tb_') ||
         filename.endsWith('_tb.sv') ||
         filename.endsWith('_tb.v') ||
         filename.startsWith('test_');
}

/**
 * Top-level 파일 여부 판별 / Detect top-level files
 */
function isTopLevelFile(filePath) {
  const filename = filePath.split(/[/\\]/).pop()?.toLowerCase() || '';
  return filename.includes('top') || filename.startsWith('soc_');
}

/**
 * 간단한 라인 단위 diff 계산 / Compute line-by-line diff
 */
function computeDiff(oldContent, newContent) {
  const oldLines = oldContent.split('\n').map(l => l.trim());
  const newLines = newContent.split('\n').map(l => l.trim());

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  const added = newLines.filter(l => !oldSet.has(l) && l.length > 0);
  const removed = oldLines.filter(l => !newSet.has(l) && l.length > 0);

  return { added, removed, oldLines, newLines };
}

/**
 * 주석만 변경되었는지 확인 / Check if only comments changed
 */
function isCommentOnlyChange(diff) {
  const isComment = (line) => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') ||
           trimmed.startsWith('/*') ||
           trimmed.startsWith('*') ||
           trimmed.endsWith('*/');
  };

  return diff.added.every(isComment) && diff.removed.every(isComment);
}

/**
 * 공백/포맷만 변경되었는지 확인 / Check if only whitespace changed
 */
function isWhitespaceOnlyChange(diff) {
  // 공백 제거 후 비교 / Compare after removing whitespace
  const normalize = (line) => line.replace(/\s+/g, '');

  const addedNorm = diff.added.map(normalize);
  const removedNorm = diff.removed.map(normalize);

  // 정규화 후 동일하면 공백만 변경 / If identical after normalization, whitespace only
  return addedNorm.sort().join('') === removedNorm.sort().join('');
}

/**
 * Lint fix 패턴 검사 / Detect lint fix patterns
 */
function isLintFixChange(diff) {
  const lintPatterns = [
    /verilator\s+lint_off/,
    /verilator\s+lint_on/,
    /synthesis\s+translate_off/,
    /synthesis\s+translate_on/,
    /pragma/
  ];

  const hasLintPattern = (line) => lintPatterns.some(p => p.test(line));

  return diff.added.some(hasLintPattern) || diff.removed.some(hasLintPattern);
}

/**
 * 모듈 선언 변경 검사 / Detect module declaration changes
 */
function hasModuleDeclarationChange(diff) {
  const isModuleLine = (line) => /^\s*module\s+\w+/.test(line);

  return diff.added.some(isModuleLine) || diff.removed.some(isModuleLine);
}

/**
 * CDC 패턴 검사 / Detect CDC patterns
 */
function hasCDCPattern(diff) {
  const cdcPatterns = [
    /async.*fifo/i,
    /cdc/i,
    /gray.*code/i,
    /metastability/i,
    /synchronizer/i,
    /clock.*crossing/i
  ];

  const allChanges = [...diff.added, ...diff.removed];
  return allChanges.some(line => cdcPatterns.some(p => p.test(line)));
}

/**
 * FSM 변경 검사 / Detect FSM changes
 */
function hasFSMChange(diff) {
  const fsmPatterns = [
    /enum.*state/i,
    /_state\s*=/,
    /next_state/i,
    /current_state/i,
    /FSM/,
    /case\s*\(\s*state/i
  ];

  const allChanges = [...diff.added, ...diff.removed];
  return allChanges.some(line => fsmPatterns.some(p => p.test(line)));
}

/**
 * 파이프라인 변경 검사 / Detect pipeline changes
 */
function hasPipelineChange(diff) {
  const pipelinePatterns = [
    /_stage\d+/,
    /pipeline.*stage/i,
    /_d\d+\s*[;,]/,  // Signal naming: xxx_d1, xxx_d2 (delay stages)
    /valid.*ready/i
  ];

  const allChanges = [...diff.added, ...diff.removed];
  return allChanges.some(line => pipelinePatterns.some(p => p.test(line)));
}

/**
 * 포트 변경 검사 / Detect port changes
 */
function hasPortChange(diff) {
  const portPatterns = [
    /^\s*(input|output|inout)\s+/,
    /^\s*(input|output|inout)\s+\w+\s+\w+/
  ];

  const allChanges = [...diff.added, ...diff.removed];
  return allChanges.some(line => portPatterns.some(p => p.test(line)));
}

/**
 * Clock/reset 로직 변경 검사 / Detect clock/reset changes
 */
function hasClockResetChange(diff) {
  const clkRstPatterns = [
    /posedge\s+clk/,
    /negedge\s+rst/,
    /posedge\s+rst/,
    /if\s*\(\s*rst/,
    /if\s*\(\s*!rst/
  ];

  const allChanges = [...diff.added, ...diff.removed];
  return allChanges.some(line => clkRstPatterns.some(p => p.test(line)));
}

/**
 * always 블록 변경 개수 세기 / Count always block changes
 */
function countAlwaysBlockChanges(diff) {
  const alwaysPattern = /^\s*always(_ff|_comb|_latch)?\s*[@(]/;

  const addedCount = diff.added.filter(l => alwaysPattern.test(l)).length;
  const removedCount = diff.removed.filter(l => alwaysPattern.test(l)).length;

  return Math.max(addedCount, removedCount);
}

/**
 * 파라미터 값 변경 검사 / Detect parameter value changes
 */
function hasParameterValueChange(diff) {
  const paramPattern = /^\s*(parameter|localparam)\s+/;

  const addedParams = diff.added.filter(l => paramPattern.test(l));
  const removedParams = diff.removed.filter(l => paramPattern.test(l));

  // 파라미터 이름은 같지만 값이 다른 경우 / Same param name but different value
  const extractParamName = (line) => {
    const match = line.match(/^\s*(parameter|localparam)\s+\w*\s*(\w+)\s*=/);
    return match ? match[2] : null;
  };

  const addedNames = addedParams.map(extractParamName).filter(Boolean);
  const removedNames = removedParams.map(extractParamName).filter(Boolean);

  return addedNames.some(name => removedNames.includes(name));
}

/**
 * 신호 이름 변경 검사 / Detect signal rename
 */
function hasSignalRename(diff) {
  const signalPattern = /^\s*(wire|reg|logic)\s+/;

  return diff.added.some(l => signalPattern.test(l)) &&
         diff.removed.some(l => signalPattern.test(l));
}

/**
 * 신호 폭 변경 검사 / Detect signal width changes
 */
function hasSignalWidthChange(diff) {
  const widthPattern = /\[\d+:\d+\]/;

  const allChanges = [...diff.added, ...diff.removed];
  return allChanges.some(line => widthPattern.test(line));
}

/**
 * 로직 키워드 검사 / Detect logic keywords
 */
function hasLogicKeywords(diff) {
  const logicPatterns = [
    /\bif\s*\(/,
    /\bcase\s*\(/,
    /\bassign\b/,
    /<=\s*[^=]/,  // non-blocking assignment
    /\balways\b/,
    /\belse\b/,
    /\?\s*.*\s*:/  // ternary operator
  ];
  const allChanges = [...diff.added, ...diff.removed];
  return allChanges.some(line => logicPatterns.some(p => p.test(line)));
}

// ============================================================================
// CLI INTERFACE / CLI 인터페이스
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
RTL Change Classifier - CLI Usage

Usage:
  node classify-change.mjs --file <path> --old <content> --new <content>
  node classify-change.mjs --file <path> --new-file
  node classify-change.mjs --file <path> --delete

Options:
  --file <path>       File path (required)
  --old <content>     Old content (optional)
  --new <content>     New content (optional)
  --new-file          Mark as new file
  --delete            Mark as deleted file
  --help, -h          Show this help

Example:
  node classify-change.mjs --file rtl/core.sv --old "module core();" --new "module core_v2();"
    `);
    process.exit(0);
  }

  const params = {
    filePath: '',
    oldContent: '',
    newContent: '',
    isNewFile: false,
    isDelete: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') params.filePath = args[++i];
    else if (args[i] === '--old') params.oldContent = args[++i];
    else if (args[i] === '--new') params.newContent = args[++i];
    else if (args[i] === '--new-file') params.isNewFile = true;
    else if (args[i] === '--delete') params.isDelete = true;
  }

  if (!params.filePath) {
    console.error('Error: --file is required');
    process.exit(1);
  }

  const result = classifyChange(params);

  console.log('\n=== RTL Change Classification Result ===\n');
  console.log(`File: ${params.filePath}`);
  console.log(`Level: ${result.level}`);
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Reasons:`);
  result.reasons.forEach(r => console.log(`  - ${r}`));
  console.log();
}
