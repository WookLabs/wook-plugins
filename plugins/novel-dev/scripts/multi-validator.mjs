#!/usr/bin/env node

/**
 * Novel-Sisyphus Multi-Validator Orchestration
 *
 * 3개 validator (critic, beta-reader, genre-validator)를 병렬 실행하고
 * 결과를 집계하여 consensus 판정을 내립니다.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Standard Mode Thresholds (일반 집필)
export const THRESHOLDS = {
  critic: 70,
  betaReader: 70,
  genreValidator: 85
};

// Masterpiece Mode Thresholds (마스터피스 모드 / Chapter 1 특별 기준)
export const CHAPTER_1_THRESHOLDS = {
  critic: 85,
  betaReader: 80,
  genreValidator: 95
};

// Alias for clarity
export const MASTERPIECE_THRESHOLDS = CHAPTER_1_THRESHOLDS;

/**
 * Run all 3 validators in parallel
 */
export async function runMultiValidation(projectPath, chapter) {
  const chapterPath = join(projectPath, 'chapters', `chapter-${chapter}.md`);

  if (!existsSync(chapterPath)) {
    throw new Error(`Chapter file not found: ${chapterPath}`);
  }

  const chapterContent = readFileSync(chapterPath, 'utf-8');
  const projectMeta = JSON.parse(readFileSync(join(projectPath, 'meta', 'project.json'), 'utf-8'));

  // Load previous chapter context for engagement-optimizer
  const emotionalContext = loadEmotionalContext(projectPath, chapter);

  console.log(`[Multi-Validator] Starting parallel validation for chapter ${chapter}...`);

  const startTime = Date.now();

  // This will be called from write-all.md with actual Task() invocations
  // Here we define the structure and validation logic

  return {
    projectPath,
    chapter,
    chapterContent,
    projectMeta,
    emotionalContext,
    startTime
  };
}

/**
 * Check consensus after all validators complete
 * @param {object} results - Validation results from all validators
 * @param {number|null} chapter - Chapter number (null for default thresholds, 1 for special chapter 1 thresholds)
 */
export function checkConsensus(results, chapter = null) {
  // Apply special thresholds for chapter 1
  const thresholds = chapter === 1 ? CHAPTER_1_THRESHOLDS : THRESHOLDS;

  const criticPassed = results.critic.score >= thresholds.critic;
  const betaReaderPassed = results.betaReader.engagement_score >= thresholds.betaReader;
  const genreValidatorPassed = results.genreValidator.compliance_score >= thresholds.genreValidator;

  const allPassed = criticPassed && betaReaderPassed && genreValidatorPassed;

  const failedValidators = [];
  if (!criticPassed) failedValidators.push('critic');
  if (!betaReaderPassed) failedValidators.push('beta-reader');
  if (!genreValidatorPassed) failedValidators.push('genre-validator');

  return {
    allPassed,
    failedValidators,
    chapter1Special: chapter === 1,
    details: {
      critic: { passed: criticPassed, score: results.critic.score, threshold: thresholds.critic },
      betaReader: { passed: betaReaderPassed, score: results.betaReader.engagement_score, threshold: thresholds.betaReader },
      genreValidator: { passed: genreValidatorPassed, score: results.genreValidator.compliance_score, threshold: thresholds.genreValidator }
    }
  };
}

/**
 * Generate diagnostic for failed validators
 */
export function generateDiagnostic(failedValidators, results) {
  const diagnostics = [];

  for (const validator of failedValidators) {
    let diagnosis;

    switch (validator) {
      case 'critic': {
        const criticThreshold = THRESHOLDS.critic;
        diagnosis = {
          validator: 'critic',
          root_cause: results.critic.lowest_dimension || 'overall_quality',
          severity: results.critic.score < 70 ? 'critical' : 'major',
          score_gap: criticThreshold - results.critic.score,
          issues: results.critic.weaknesses || [],
          suggested_fix: generateCriticFix(results.critic),
          estimated_effort: results.critic.score < 70 ? 'significant' : 'moderate'
        };
        break;
      }

      case 'beta-reader': {
        const betaThreshold = THRESHOLDS.betaReader;
        diagnosis = {
          validator: 'beta-reader',
          root_cause: results.betaReader.primary_issue || 'low_engagement',
          severity: results.betaReader.engagement_score < 60 ? 'critical' : 'major',
          score_gap: betaThreshold - results.betaReader.engagement_score,
          drop_off_zones: results.betaReader.drop_off_risk || [],
          suggested_fix: generateBetaReaderFix(results.betaReader),
          estimated_effort: (results.betaReader.drop_off_risk?.length || 0) > 3 ? 'significant' : 'moderate'
        };
        break;
      }

      case 'genre-validator': {
        const genreThreshold = THRESHOLDS.genreValidator;
        diagnosis = {
          validator: 'genre-validator',
          root_cause: 'missing_genre_elements',
          severity: results.genreValidator.compliance_score < 80 ? 'critical' : 'major',
          score_gap: genreThreshold - results.genreValidator.compliance_score,
          missing_elements: Object.entries(results.genreValidator.required_elements || {})
            .filter(([, v]) => v.status === 'FAIL')
            .map(([k]) => k),
          suggested_fix: generateGenreFix(results.genreValidator),
          estimated_effort: 'quick'
        };
        break;
      }
    }

    diagnostics.push(diagnosis);
  }

  // Sort by severity
  diagnostics.sort((a, b) => {
    const order = { critical: 0, major: 1, minor: 2 };
    return order[a.severity] - order[b.severity];
  });

  return {
    primary_issue: diagnostics[0],
    all_issues: diagnostics,
    recommended_action: diagnostics[0]?.suggested_fix,
    total_effort: calculateTotalEffort(diagnostics)
  };
}

function generateCriticFix(criticResult) {
  const fixes = {
    narrative_quality: '서사 흐름 개선: 장면 전환 부드럽게, 묘사와 대화 균형',
    plot_coherence: '플롯 일관성: 전후 맥락 확인, 논리적 흐름 강화',
    character_consistency: '캐릭터 일관성: 설정집 참조하여 성격/말투 통일',
    worldbuilding: '세계관 일관성: 설정 모순 확인, 용어 통일'
  };
  return fixes[criticResult.lowest_dimension] || '전반적 품질 향상 필요';
}

function generateBetaReaderFix(betaReaderResult) {
  if (betaReaderResult.drop_off_risk?.length > 0) {
    const zone = betaReaderResult.drop_off_risk[0];
    return `${zone.location}의 ${zone.reason} 해결: 대화 추가 또는 액션 삽입`;
  }
  return '몰입도 향상: 훅 추가, 페이싱 조절';
}

function generateGenreFix(genreResult) {
  const missing = Object.entries(genreResult.required_elements || {})
    .filter(([, v]) => v.status === 'FAIL')
    .map(([k]) => k);

  if (missing.length > 0) {
    return `필수 요소 추가: ${missing.join(', ')}`;
  }
  return '장르 컨벤션 강화';
}

function calculateTotalEffort(diagnostics) {
  const efforts = diagnostics.map(d => d.estimated_effort);
  if (efforts.includes('significant')) return 'significant';
  if (efforts.includes('moderate')) return 'moderate';
  return 'quick';
}

/**
 * Load emotional context for cross-chapter state access
 */
function loadEmotionalContext(projectPath, currentChapter) {
  const contextPath = join(projectPath, 'emotional-arc', 'emotional-context.json');

  if (existsSync(contextPath)) {
    return JSON.parse(readFileSync(contextPath, 'utf-8'));
  }

  return {
    previous_chapters: [],
    cumulative_stats: {},
    is_first_chapter: true
  };
}

/**
 * Save validation results
 */
export function saveValidationResult(projectPath, chapter, result) {
  const validationsDir = join(projectPath, 'validations');
  if (!existsSync(validationsDir)) {
    mkdirSync(validationsDir, { recursive: true });
  }

  const resultPath = join(validationsDir, `chapter-${chapter}-validation.json`);
  writeFileSync(resultPath, JSON.stringify(result, null, 2));

  return resultPath;
}

// Export for use in commands
export default {
  THRESHOLDS,
  CHAPTER_1_THRESHOLDS,
  runMultiValidation,
  checkConsensus,
  generateDiagnostic,
  saveValidationResult
};
