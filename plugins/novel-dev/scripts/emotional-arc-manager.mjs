#!/usr/bin/env node

/**
 * Novel-Sisyphus Emotional Arc Manager
 *
 * 텐션 곡선, 감정 비트, 클리프행어 추적 및 관리
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Emotion keywords for detection (from plan)
const EMOTION_KEYWORDS = {
  심쿵: {
    primary: ['심장', '두근', '콩닥', '쿵', '숨이 멎', '숨이 막히'],
    secondary: ['시선', '눈을 마주치', '손이 닿', '얼굴이 달아오르', '귀가 빨개'],
    baseIntensity: 5,
    primaryBonus: 2,
    secondaryBonus: 1,
    maxIntensity: 10
  },
  긴장: {
    primary: ['긴장', '숨을 죽', '식은땀', '손에 땀', '얼어붙'],
    secondary: ['노려보', '침묵', '정적', '분위기', '살기', '압박'],
    baseIntensity: 5,
    primaryBonus: 2,
    secondaryBonus: 1,
    maxIntensity: 10
  },
  설렘: {
    primary: ['설레', '기대', '두근거리', '가슴이 벅'],
    secondary: ['미소', '웃음', '기분 좋', '행복', '즐거'],
    baseIntensity: 5,
    primaryBonus: 2,
    secondaryBonus: 1,
    maxIntensity: 10
  },
  질투: {
    primary: ['질투', '샘', '시기', '배 아프'],
    secondary: ['눈살', '인상', '째려', '다른 여자', '다른 남자'],
    baseIntensity: 5,
    primaryBonus: 2,
    secondaryBonus: 1,
    maxIntensity: 10
  },
  밀당: {
    primary: ['밀어내', '당기', '거리', '멀어지'],
    secondary: ['차갑', '냉담', '무시', '외면', '피하'],
    baseIntensity: 5,
    primaryBonus: 2,
    secondaryBonus: 1,
    maxIntensity: 10
  },
  예지: {
    primary: ['알고 있', '기억', '전생', '예전', '미래'],
    secondary: ['바꿔', '이번엔', '이번에는', '다시'],
    baseIntensity: 5,
    primaryBonus: 2,
    secondaryBonus: 1,
    maxIntensity: 10
  },
  복수: {
    primary: ['복수', '갚아', '되돌려', '응징'],
    secondary: ['원한', '분노', '이를 갈', '주먹'],
    baseIntensity: 5,
    primaryBonus: 2,
    secondaryBonus: 1,
    maxIntensity: 10
  },
  성장: {
    primary: ['레벨', '강해', '성장', '각성', '진화'],
    secondary: ['능력', '스킬', '힘', '새로운'],
    baseIntensity: 5,
    primaryBonus: 2,
    secondaryBonus: 1,
    maxIntensity: 10
  }
};

// Genre-specific required emotions
const GENRE_EMOTIONS = {
  romance: ['심쿵', '설렘', '질투', '밀당'],
  fantasy: ['긴장', '성장'],
  regression: ['예지', '복수', '성장'],
  thriller: ['긴장']
};

/**
 * Initialize emotional-arc directory structure
 */
export function initEmotionalArc(projectPath) {
  const arcDir = join(projectPath, 'emotional-arc');

  if (!existsSync(arcDir)) {
    mkdirSync(arcDir, { recursive: true });
  }

  // Initialize tension-curve.json
  const tensionPath = join(arcDir, 'tension-curve.json');
  if (!existsSync(tensionPath)) {
    writeFileSync(tensionPath, JSON.stringify({
      novel_id: '',
      chapters: {},
      act_summary: {}
    }, null, 2));
  }

  // Initialize beat-counter.json
  const beatPath = join(arcDir, 'beat-counter.json');
  if (!existsSync(beatPath)) {
    writeFileSync(beatPath, JSON.stringify({
      novel_id: '',
      genre: '',
      total_chapters: 0,
      beat_totals: {},
      chapter_beats: {},
      compliance: {}
    }, null, 2));
  }

  // Initialize emotional-context.json (fast access cache)
  const contextPath = join(arcDir, 'emotional-context.json');
  if (!existsSync(contextPath)) {
    writeFileSync(contextPath, JSON.stringify({
      novel_id: '',
      last_updated: new Date().toISOString(),
      previous_chapters: [],
      cumulative_stats: {
        total_beats: {},
        average_tension_trend: [],
        tension_momentum: 'neutral'
      }
    }, null, 2));
  }

  return arcDir;
}

/**
 * Detect emotional beats in text
 */
export function detectEmotionalBeats(text, genre = 'romance') {
  const results = [];
  const emotionsToCheck = GENRE_EMOTIONS[genre] || Object.keys(EMOTION_KEYWORDS);

  // Split into paragraphs for location tracking
  const paragraphs = text.split(/\n\n+/);

  paragraphs.forEach((para, paraIndex) => {
    for (const emotion of emotionsToCheck) {
      const config = EMOTION_KEYWORDS[emotion];
      if (!config) continue;

      let intensity = config.baseIntensity;
      const matches = [];

      // Check primary keywords
      for (const keyword of config.primary) {
        if (para.includes(keyword)) {
          intensity += config.primaryBonus;
          matches.push({ type: 'primary', keyword });
        }
      }

      // Check secondary keywords
      for (const keyword of config.secondary) {
        if (para.includes(keyword)) {
          intensity += config.secondaryBonus;
          matches.push({ type: 'secondary', keyword });
        }
      }

      // Cap intensity
      intensity = Math.min(intensity, config.maxIntensity);

      // Only report if above threshold (6+) and has matches
      if (intensity >= 6 && matches.length > 0) {
        results.push({
          emotion,
          intensity,
          location: `paragraph_${paraIndex + 1}`,
          matches,
          text_snippet: para.substring(0, 100) + '...'
        });
      }
    }
  });

  return results;
}

/**
 * Update tension curve after chapter analysis
 */
export function updateTensionCurve(projectPath, chapter, tensionData) {
  const arcDir = join(projectPath, 'emotional-arc');
  const tensionPath = join(arcDir, 'tension-curve.json');

  let curve = { chapters: {}, act_summary: {} };
  if (existsSync(tensionPath)) {
    curve = JSON.parse(readFileSync(tensionPath, 'utf-8'));
  }

  // Add/update chapter data
  curve.chapters[chapter] = {
    scenes: tensionData.scenes || [],
    average: tensionData.average || 0,
    peak: tensionData.peak || 0,
    valley: tensionData.valley || 10,
    arc_compliance: tensionData.arc_compliance || 'UNKNOWN'
  };

  writeFileSync(tensionPath, JSON.stringify(curve, null, 2));

  // Also save chapter-specific state
  const chapterStatePath = join(arcDir, `chapter-${chapter}-state.json`);
  writeFileSync(chapterStatePath, JSON.stringify({
    chapter,
    ...tensionData,
    saved_at: new Date().toISOString()
  }, null, 2));

  return curve;
}

/**
 * Update beat counter after chapter analysis
 */
export function updateBeatCounter(projectPath, chapter, beats, genre = 'romance') {
  const arcDir = join(projectPath, 'emotional-arc');
  const beatPath = join(arcDir, 'beat-counter.json');

  let counter = { beat_totals: {}, chapter_beats: {}, compliance: {} };
  if (existsSync(beatPath)) {
    counter = JSON.parse(readFileSync(beatPath, 'utf-8'));
  }

  // Update chapter beats
  counter.chapter_beats[chapter] = beats;

  // Update totals
  for (const beat of beats) {
    const emotion = beat.emotion;
    if (!counter.beat_totals[emotion]) {
      counter.beat_totals[emotion] = { count: 0, last_occurrence: 0 };
    }
    counter.beat_totals[emotion].count++;
    counter.beat_totals[emotion].last_occurrence = chapter;
  }

  // Check compliance for genre
  const requiredEmotions = GENRE_EMOTIONS[genre] || [];
  for (const emotion of requiredEmotions) {
    const chapterBeats = beats.filter(b => b.emotion === emotion);
    counter.compliance[emotion] = {
      required_per_chapter: emotion === '심쿵' ? '1-2' : 'varies',
      actual_this_chapter: chapterBeats.length,
      status: chapterBeats.length > 0 ? 'PASS' : 'NEEDS_ATTENTION'
    };
  }

  counter.genre = genre;
  counter.total_chapters = Math.max(counter.total_chapters || 0, chapter);

  writeFileSync(beatPath, JSON.stringify(counter, null, 2));
  return counter;
}

/**
 * Update emotional context (sliding window cache)
 */
export function updateEmotionalContext(projectPath, chapter, chapterState) {
  const arcDir = join(projectPath, 'emotional-arc');
  const contextPath = join(arcDir, 'emotional-context.json');

  let context = {
    previous_chapters: [],
    cumulative_stats: { total_beats: {}, average_tension_trend: [], tension_momentum: 'neutral' }
  };

  if (existsSync(contextPath)) {
    context = JSON.parse(readFileSync(contextPath, 'utf-8'));
  }

  // Add new chapter to front, maintain 3-chapter window
  const chapterSummary = {
    chapter,
    average_tension: chapterState.average_tension || 0,
    peak_tension: chapterState.peak_tension || 0,
    emotional_beats: {},
    cliffhanger_type: chapterState.cliffhanger_type || 'NONE',
    cliffhanger_strength: chapterState.cliffhanger_strength || 0,
    unresolved_hooks: chapterState.unresolved_hooks || [],
    character_emotional_state: chapterState.character_emotional_state || {}
  };

  // Count beats by emotion
  if (chapterState.beats) {
    for (const beat of chapterState.beats) {
      chapterSummary.emotional_beats[beat.emotion] =
        (chapterSummary.emotional_beats[beat.emotion] || 0) + 1;
    }
  }

  context.previous_chapters.unshift(chapterSummary);
  context.previous_chapters = context.previous_chapters.slice(0, 3);

  // Update cumulative stats
  context.cumulative_stats.average_tension_trend.push(chapterState.average_tension || 0);
  if (context.cumulative_stats.average_tension_trend.length > 10) {
    context.cumulative_stats.average_tension_trend.shift();
  }

  // Calculate momentum
  const trend = context.cumulative_stats.average_tension_trend;
  if (trend.length >= 2) {
    const recent = trend.slice(-3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgPrev = trend.slice(-6, -3).reduce((a, b) => a + b, 0) / Math.max(1, trend.slice(-6, -3).length);

    if (avgRecent > avgPrev + 0.5) {
      context.cumulative_stats.tension_momentum = 'rising';
    } else if (avgRecent < avgPrev - 0.5) {
      context.cumulative_stats.tension_momentum = 'falling';
    } else {
      context.cumulative_stats.tension_momentum = 'stable';
    }
  }

  context.last_updated = new Date().toISOString();

  writeFileSync(contextPath, JSON.stringify(context, null, 2));
  return context;
}

/**
 * Load previous chapter context for engagement-optimizer
 */
export function loadPreviousChapterContext(projectPath, currentChapter) {
  const contextPath = join(projectPath, 'emotional-arc', 'emotional-context.json');

  if (existsSync(contextPath)) {
    const context = JSON.parse(readFileSync(contextPath, 'utf-8'));
    return {
      previous_chapters: context.previous_chapters,
      cumulative: context.cumulative_stats,
      recommendations: generateRecommendations(context, currentChapter)
    };
  }

  return {
    previous_chapters: [],
    cumulative: {},
    recommendations: [],
    is_first_chapter: true
  };
}

/**
 * Generate recommendations based on previous context
 */
function generateRecommendations(context, currentChapter) {
  const recommendations = [];
  const prev = context.previous_chapters[0];

  if (!prev) return recommendations;

  // Tension momentum recommendation
  if (context.cumulative_stats.tension_momentum === 'rising') {
    recommendations.push({
      type: 'TENSION',
      message: '상승 추세 유지. 이번 회차 평균 텐션 5-6 권장'
    });
  } else if (context.cumulative_stats.tension_momentum === 'falling') {
    recommendations.push({
      type: 'TENSION',
      message: '하강 추세. 회복을 위해 강한 훅이나 위기 상황 권장'
    });
  }

  // Unresolved hooks reminder
  if (prev.unresolved_hooks?.length > 0) {
    recommendations.push({
      type: 'HOOKS',
      message: `미해결 떡밥: ${prev.unresolved_hooks.join(', ')}`,
      action: '일부 진전 또는 새 떡밥 추가 권장'
    });
  }

  // Beat deficit check (romance-specific)
  if (prev.emotional_beats) {
    if (!prev.emotional_beats['심쿵'] || prev.emotional_beats['심쿵'] < 1) {
      recommendations.push({
        type: 'BEAT_DEFICIT',
        message: '직전 회차 심쿵 비트 부족. 이번 회차 심쿵 1-2개 필수'
      });
    }
  }

  // Cliffhanger check
  if (prev.cliffhanger_strength < 6) {
    recommendations.push({
      type: 'CLIFFHANGER',
      message: '직전 회차 클리프행어 약함. 이번 회차 강한 엔딩 훅 권장'
    });
  }

  return recommendations;
}

/**
 * Analyze cliffhanger effectiveness
 */
export function analyzeCliffhanger(text) {
  const lastParagraphs = text.split(/\n\n+/).slice(-3).join('\n');

  // Cliffhanger type detection
  const types = {
    REVELATION: ['사실', '진실', '정체', '알고 있었', '숨겨', '비밀'],
    CLIFFHANGER: ['위험', '총', '칼', '죽', '떨어', '사라', '급'],
    QUESTION: ['왜', '누구', '어디', '무엇', '?'],
    EMOTIONAL: ['사랑', '미워', '떠나', '이별', '눈물'],
    TWIST: ['하지만', '그런데', '그러나', '반전', '예상']
  };

  let detectedType = 'NONE';
  let strength = 0;

  for (const [type, keywords] of Object.entries(types)) {
    for (const keyword of keywords) {
      if (lastParagraphs.includes(keyword)) {
        if (strength < 5) {
          detectedType = type;
        }
        strength += 2;
      }
    }
  }

  // Cap strength
  strength = Math.min(strength, 10);

  return {
    type: detectedType,
    strength,
    effectiveness: {
      surprise: Math.min(10, strength + (detectedType === 'TWIST' ? 2 : 0)),
      emotional_impact: Math.min(10, strength + (detectedType === 'EMOTIONAL' ? 2 : 0)),
      curiosity_generation: Math.min(10, strength + (detectedType === 'QUESTION' ? 2 : 0)),
      connection_to_plot: strength
    }
  };
}

// Export all functions
export default {
  EMOTION_KEYWORDS,
  GENRE_EMOTIONS,
  initEmotionalArc,
  detectEmotionalBeats,
  updateTensionCurve,
  updateBeatCounter,
  updateEmotionalContext,
  loadPreviousChapterContext,
  analyzeCliffhanger
};
