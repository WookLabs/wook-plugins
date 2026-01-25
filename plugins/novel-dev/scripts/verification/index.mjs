/**
 * Novel Verification Module
 *
 * Reusable verification protocol for novel quality checks.
 * Adapted from oh-my-claudecode's verification module for novel writing.
 */

/**
 * Standard verification checks for novel content
 */
export const NOVEL_CHECKS = {
  CONSISTENCY: {
    id: 'consistency',
    name: '일관성 검증',
    description: '설정, 캐릭터, 타임라인의 일관성 확인',
    evidenceType: 'consistency_verified',
    required: true,
    agent: 'consistency-verifier',
    threshold: 85,
    completed: false
  },
  CHARACTER_VOICE: {
    id: 'character_voice',
    name: '캐릭터 목소리',
    description: '캐릭터별 말투와 성격 일관성 확인',
    evidenceType: 'character_voice_verified',
    required: true,
    agent: 'character-voice-analyzer',
    threshold: 80,
    completed: false
  },
  PROSE_QUALITY: {
    id: 'prose_quality',
    name: '문장력 검증',
    description: 'Show vs Tell, 감각 묘사, 필터 워드 검사',
    evidenceType: 'prose_quality_verified',
    required: true,
    agent: 'prose-quality-analyzer',
    threshold: 75,
    completed: false
  },
  GENRE_COMPLIANCE: {
    id: 'genre_compliance',
    name: '장르 적합성',
    description: '장르 필수 요소 및 클리셰 검증',
    evidenceType: 'genre_compliance_verified',
    required: true,
    agent: 'genre-validator',
    threshold: 95,
    completed: false
  },
  PACING: {
    id: 'pacing',
    name: '페이싱 검증',
    description: '텐션 커브, 리듬, 호흡 조절 검사',
    evidenceType: 'pacing_verified',
    required: true,
    agent: 'pacing-analyzer',
    threshold: 70,
    completed: false
  },
  ENGAGEMENT: {
    id: 'engagement',
    name: '몰입도 검증',
    description: '독자 몰입도 및 이탈 위험 예측',
    evidenceType: 'engagement_verified',
    required: true,
    agent: 'beta-reader',
    threshold: 80,
    completed: false
  },
  DIALOGUE: {
    id: 'dialogue',
    name: '대화 검증',
    description: '대화 자연스러움, 서브텍스트, 정보 전달',
    evidenceType: 'dialogue_verified',
    required: false,
    agent: 'dialogue-analyzer',
    threshold: 75,
    completed: false
  },
  FORESHADOW: {
    id: 'foreshadow',
    name: '복선 검증',
    description: '복선 배치 및 회수 검증',
    evidenceType: 'foreshadow_verified',
    required: false,
    agent: 'plot-consistency-analyzer',
    threshold: 70,
    completed: false
  }
};

/**
 * Predefined verification protocols
 */
export const PROTOCOLS = {
  // 챕터 검증 프로토콜
  CHAPTER: {
    name: 'Chapter Verification',
    description: '개별 챕터 품질 검증',
    checks: [
      NOVEL_CHECKS.CONSISTENCY,
      NOVEL_CHECKS.CHARACTER_VOICE,
      NOVEL_CHECKS.PROSE_QUALITY,
      NOVEL_CHECKS.PACING,
      NOVEL_CHECKS.ENGAGEMENT
    ],
    strictMode: true
  },

  // 퇴고 프로토콜
  REVISION: {
    name: 'Revision Protocol',
    description: '퇴고 시 전체 품질 검증',
    checks: [
      NOVEL_CHECKS.PROSE_QUALITY,
      NOVEL_CHECKS.DIALOGUE,
      NOVEL_CHECKS.CHARACTER_VOICE,
      NOVEL_CHECKS.PACING
    ],
    strictMode: false
  },

  // 설계 검증 프로토콜
  DESIGN: {
    name: 'Design Verification',
    description: '설계 완료 후 일관성 검증',
    checks: [
      NOVEL_CHECKS.CONSISTENCY,
      NOVEL_CHECKS.GENRE_COMPLIANCE,
      NOVEL_CHECKS.FORESHADOW
    ],
    strictMode: true
  },

  // 출판 전 최종 검증
  PUBLICATION: {
    name: 'Publication Ready',
    description: '출판 전 최종 품질 검증',
    checks: Object.values(NOVEL_CHECKS),
    strictMode: true
  },

  // 1화 특별 검증 (Masterpiece Mode)
  CHAPTER_ONE: {
    name: 'Chapter One Masterpiece',
    description: '1화 특별 검증 (높은 기준)',
    checks: Object.values(NOVEL_CHECKS).map(check => ({
      ...check,
      threshold: Math.min(check.threshold + 10, 97)
    })),
    strictMode: true
  }
};

/**
 * Create a verification protocol
 */
export function createProtocol(name, description, checks, strictMode = true) {
  return {
    name,
    description,
    checks: checks.map(c => ({ ...c, completed: false })),
    strictMode
  };
}

/**
 * Create a verification checklist from a protocol
 */
export function createChecklist(protocol) {
  return {
    protocol,
    startedAt: new Date(),
    checks: protocol.checks.map(check => ({ ...check, completed: false })),
    status: 'pending'
  };
}

/**
 * Check if evidence meets threshold
 */
function meetsThreshold(score, threshold) {
  return score >= threshold;
}

/**
 * Generate verification evidence from agent result
 */
export function createEvidence(check, agentResult) {
  const score = agentResult.score || agentResult.overall_score || 0;
  const passed = meetsThreshold(score, check.threshold);

  return {
    type: check.evidenceType,
    passed,
    score,
    threshold: check.threshold,
    agent: check.agent,
    details: agentResult.details || agentResult.analysis || {},
    issues: agentResult.issues || [],
    recommendations: agentResult.recommendations || [],
    timestamp: new Date()
  };
}

/**
 * Generate summary of verification results
 */
export function generateSummary(checklist) {
  const total = checklist.checks.length;
  const passed = checklist.checks.filter(c => c.evidence?.passed).length;
  const failed = checklist.checks.filter(c => c.completed && !c.evidence?.passed).length;
  const skipped = checklist.checks.filter(c => !c.completed).length;

  const requiredChecks = checklist.checks.filter(c => c.required);
  const allRequiredPassed = requiredChecks.every(c => c.evidence?.passed);

  const failedChecks = checklist.checks
    .filter(c => c.completed && !c.evidence?.passed)
    .map(c => ({
      id: c.id,
      name: c.name,
      score: c.evidence?.score || 0,
      threshold: c.threshold,
      issues: c.evidence?.issues || []
    }));

  // Calculate average score
  const scores = checklist.checks
    .filter(c => c.evidence?.score !== undefined)
    .map(c => c.evidence.score);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  let verdict;
  if (skipped > 0) {
    verdict = 'incomplete';
  } else if (checklist.protocol.strictMode && failed > 0) {
    verdict = 'rejected';
  } else if (allRequiredPassed) {
    verdict = 'approved';
  } else {
    verdict = 'rejected';
  }

  return {
    total,
    passed,
    failed,
    skipped,
    averageScore,
    allRequiredPassed,
    failedChecks,
    verdict
  };
}

/**
 * Format verification report as markdown
 */
export function formatReport(checklist, options = {}) {
  const { includeDetails = true, korean = true } = options;

  const lines = [];
  const summary = checklist.summary || generateSummary(checklist);

  // Header
  lines.push(`# ${korean ? '검증 리포트' : 'Verification Report'}: ${checklist.protocol.name}`);
  lines.push('');

  // Status badge
  const statusEmoji = {
    'approved': '✅',
    'rejected': '❌',
    'incomplete': '⏳',
    'pending': '🔄'
  };
  lines.push(`**${korean ? '상태' : 'Status'}:** ${statusEmoji[summary.verdict] || '❓'} ${summary.verdict.toUpperCase()}`);
  lines.push(`**${korean ? '평균 점수' : 'Average Score'}:** ${summary.averageScore}점`);
  lines.push('');

  // Summary table
  lines.push(`## ${korean ? '요약' : 'Summary'}`);
  lines.push('');
  lines.push(`| ${korean ? '항목' : 'Item'} | ${korean ? '값' : 'Value'} |`);
  lines.push('|------|------|');
  lines.push(`| ${korean ? '전체 검사' : 'Total'} | ${summary.total} |`);
  lines.push(`| ${korean ? '통과' : 'Passed'} | ${summary.passed} |`);
  lines.push(`| ${korean ? '실패' : 'Failed'} | ${summary.failed} |`);
  lines.push(`| ${korean ? '건너뜀' : 'Skipped'} | ${summary.skipped} |`);
  lines.push('');

  // Individual checks
  lines.push(`## ${korean ? '상세 결과' : 'Details'}`);
  lines.push('');

  for (const check of checklist.checks) {
    const status = check.evidence?.passed ? '✓' : check.completed ? '✗' : '○';
    const score = check.evidence?.score !== undefined ? `${check.evidence.score}점` : '-';
    const required = check.required ? `(${korean ? '필수' : 'required'})` : `(${korean ? '선택' : 'optional'})`;

    lines.push(`### ${status} ${check.name} ${required}`);
    lines.push('');
    lines.push(`- **${korean ? '점수' : 'Score'}:** ${score} / ${check.threshold}점 기준`);
    lines.push(`- **${korean ? '에이전트' : 'Agent'}:** ${check.agent}`);

    if (includeDetails && check.evidence) {
      if (check.evidence.issues && check.evidence.issues.length > 0) {
        lines.push(`- **${korean ? '문제점' : 'Issues'}:**`);
        check.evidence.issues.forEach(issue => {
          lines.push(`  - ${issue}`);
        });
      }

      if (check.evidence.recommendations && check.evidence.recommendations.length > 0) {
        lines.push(`- **${korean ? '개선 제안' : 'Recommendations'}:**`);
        check.evidence.recommendations.forEach(rec => {
          lines.push(`  - ${rec}`);
        });
      }
    }

    lines.push('');
  }

  // Failed checks highlight
  if (summary.failedChecks.length > 0) {
    lines.push(`## ${korean ? '실패한 검사' : 'Failed Checks'}`);
    lines.push('');
    for (const failed of summary.failedChecks) {
      lines.push(`### ❌ ${failed.name}`);
      lines.push(`- ${korean ? '점수' : 'Score'}: ${failed.score}점 (${korean ? '기준' : 'threshold'}: ${failed.threshold}점)`);
      if (failed.issues.length > 0) {
        lines.push(`- ${korean ? '주요 문제' : 'Main issues'}:`);
        failed.issues.slice(0, 3).forEach(issue => {
          lines.push(`  - ${issue}`);
        });
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Get protocol by name
 */
export function getProtocol(name) {
  const protocolMap = {
    'chapter': PROTOCOLS.CHAPTER,
    'revision': PROTOCOLS.REVISION,
    'design': PROTOCOLS.DESIGN,
    'publication': PROTOCOLS.PUBLICATION,
    'chapter-one': PROTOCOLS.CHAPTER_ONE,
    'masterpiece': PROTOCOLS.CHAPTER_ONE
  };

  return protocolMap[name.toLowerCase()] || PROTOCOLS.CHAPTER;
}

/**
 * Create custom protocol from check IDs
 */
export function createCustomProtocol(name, checkIds, strictMode = true) {
  const checks = checkIds
    .map(id => Object.values(NOVEL_CHECKS).find(c => c.id === id))
    .filter(Boolean);

  return createProtocol(name, `Custom protocol: ${checkIds.join(', ')}`, checks, strictMode);
}

export default {
  NOVEL_CHECKS,
  PROTOCOLS,
  createProtocol,
  createChecklist,
  createEvidence,
  generateSummary,
  formatReport,
  getProtocol,
  createCustomProtocol
};
