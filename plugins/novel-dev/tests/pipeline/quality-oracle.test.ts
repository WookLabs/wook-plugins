import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Constants
  FILTER_WORDS,
  SENSORY_CATEGORIES,
  MAX_DIRECTIVES_PER_PASS,
  MIN_SENSES_PER_500_CHARS,
  MAX_CONSECUTIVE_SAME_ENDINGS,
  // Functions
  resetDirectiveCounter,
  generateDirectiveId,
  countFilterWords,
  getFilterWordsOutsideDialogue,
  countUniqueSenses,
  assessSensoryGrounding,
  findRhythmIssues,
  getParagraphs,
  findParagraphForPosition,
  createDirective,
  analyzeChapter,
  analyzeAndReport,
} from '../../src/pipeline/quality-oracle.js';

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  resetDirectiveCounter();
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Quality Oracle Constants', () => {
  it('should have filter words defined', () => {
    expect(FILTER_WORDS).toContain('느꼈다');
    expect(FILTER_WORDS).toContain('보였다');
    expect(FILTER_WORDS).toContain('생각했다');
    expect(FILTER_WORDS.length).toBeGreaterThan(10);
  });

  it('should have 5 sensory categories', () => {
    expect(Object.keys(SENSORY_CATEGORIES)).toHaveLength(5);
    expect(SENSORY_CATEGORIES).toHaveProperty('visual');
    expect(SENSORY_CATEGORIES).toHaveProperty('auditory');
    expect(SENSORY_CATEGORIES).toHaveProperty('tactile');
    expect(SENSORY_CATEGORIES).toHaveProperty('olfactory');
    expect(SENSORY_CATEGORIES).toHaveProperty('gustatory');
  });

  it('should have correct limits', () => {
    expect(MAX_DIRECTIVES_PER_PASS).toBe(5);
    expect(MIN_SENSES_PER_500_CHARS).toBe(2);
    expect(MAX_CONSECUTIVE_SAME_ENDINGS).toBe(5);
  });
});

// ============================================================================
// Directive ID Generation Tests
// ============================================================================

describe('generateDirectiveId', () => {
  it('should generate sequential IDs', () => {
    const id1 = generateDirectiveId('filter-word-removal');
    const id2 = generateDirectiveId('sensory-enrichment');
    const id3 = generateDirectiveId('filter-word-removal');

    expect(id1).toBe('dir_filter-word-removal_001');
    expect(id2).toBe('dir_sensory-enrichment_002');
    expect(id3).toBe('dir_filter-word-removal_003');
  });

  it('should reset counter correctly', () => {
    generateDirectiveId('show-not-tell');
    generateDirectiveId('show-not-tell');
    resetDirectiveCounter();
    const id = generateDirectiveId('show-not-tell');

    expect(id).toBe('dir_show-not-tell_001');
  });
});

// ============================================================================
// Filter Word Detection Tests
// ============================================================================

describe('countFilterWords', () => {
  it('should detect filter words in content', () => {
    const content = '그녀는 슬픔을 느꼈다. 그의 얼굴이 보였다.';
    const results = countFilterWords(content);

    expect(results.length).toBe(2);
    expect(results.some(r => r.word === '느꼈다')).toBe(true);
    expect(results.some(r => r.word === '보였다')).toBe(true);
  });

  it('should track positions correctly', () => {
    const content = '그녀는 느꼈다.';
    const results = countFilterWords(content);

    expect(results[0].position).toBe(content.indexOf('느꼈다'));
  });

  it('should detect filter words inside dialogue', () => {
    const content = '"나도 느꼈다." 그녀가 말했다.';
    const results = countFilterWords(content);

    expect(results.length).toBe(1);
    expect(results[0].inDialogue).toBe(true);
  });

  it('should distinguish dialogue from narration', () => {
    const content = '"나는 느꼈다"라고 말했다. 그도 무언가를 느꼈다.';
    const results = countFilterWords(content);

    // First '느꼈다' is in dialogue, second is not
    const inDialogue = results.filter(r => r.inDialogue);
    const outsideDialogue = results.filter(r => !r.inDialogue);

    expect(inDialogue.length).toBe(1);
    expect(outsideDialogue.length).toBe(1);
  });
});

describe('getFilterWordsOutsideDialogue', () => {
  it('should return only filter words outside dialogue', () => {
    const content = '"느꼈다"고 했다. 그녀는 그것을 느꼈다.';
    const results = getFilterWordsOutsideDialogue(content);

    expect(results.length).toBe(1);
    expect(results[0].word).toBe('느꼈다');
  });

  it('should return empty array when all filter words in dialogue', () => {
    const content = '"나는 보였다. 그것이 보였다."';
    const results = getFilterWordsOutsideDialogue(content);

    expect(results.length).toBe(0);
  });
});

// ============================================================================
// Sensory Detection Tests
// ============================================================================

describe('countUniqueSenses', () => {
  it('should detect visual sense', () => {
    const content = '빛이 창문으로 들어왔다. 붉은 색이 번졌다.';
    const result = countUniqueSenses(content);

    expect(result.categories).toContain('visual');
    expect(result.details.visual?.length).toBeGreaterThan(0);
  });

  it('should detect auditory sense', () => {
    const content = '소리가 울려 퍼졌다. 목소리가 들렸다.';
    const result = countUniqueSenses(content);

    expect(result.categories).toContain('auditory');
  });

  it('should detect tactile sense', () => {
    const content = '차가운 바람이 피부에 닿았다.';
    const result = countUniqueSenses(content);

    expect(result.categories).toContain('tactile');
  });

  it('should detect olfactory sense', () => {
    const content = '꽃향기가 코를 간지럽혔다. 냄새가 났다.';
    const result = countUniqueSenses(content);

    expect(result.categories).toContain('olfactory');
  });

  it('should detect gustatory sense', () => {
    const content = '쓴맛이 입안에 퍼졌다. 달콤한 맛이었다.';
    const result = countUniqueSenses(content);

    expect(result.categories).toContain('gustatory');
  });

  it('should count multiple senses', () => {
    const content = '빛이 눈부셨다. 소리가 들렸다. 따뜻한 공기. 꽃향기. 단맛.';
    const result = countUniqueSenses(content);

    expect(result.count).toBe(5);
    expect(result.categories).toEqual(
      expect.arrayContaining(['visual', 'auditory', 'tactile', 'olfactory', 'gustatory'])
    );
  });

  it('should return 0 for content without sensory words', () => {
    const content = '그녀는 생각했다. 시간이 흘렀다.';
    const result = countUniqueSenses(content);

    expect(result.count).toBe(0);
  });
});

describe('assessSensoryGrounding', () => {
  it('should pass content with adequate senses', () => {
    // Content with multiple senses throughout
    const content = '빛이 창문으로 들어왔다. 소리가 들렸다. ' +
      '차가운 바람이 불었다. 향기가 났다. '.repeat(5);

    const result = assessSensoryGrounding(content);

    expect(result.adequate).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  it('should flag segments without adequate senses', () => {
    // 500+ chars without sensory words
    const content = '그녀는 생각했다. 시간이 흘렀다. 무언가가 변했다. '.repeat(20);

    const result = assessSensoryGrounding(content);

    expect(result.adequate).toBe(false);
    expect(result.issueSegments.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Rhythm Analysis Tests
// ============================================================================

describe('findRhythmIssues', () => {
  it('should detect consecutive same endings', () => {
    // 6 consecutive -다 endings
    const content = '갔다. 봤다. 했다. 왔다. 갔다. 봤다.';
    const issues = findRhythmIssues(content);

    expect(issues.length).toBe(1);
    expect(issues[0].pattern).toBe('-다');
    expect(issues[0].count).toBe(6);
  });

  it('should not flag varied endings', () => {
    const content = '갔다. 왔나? 했지! 봤네. 그랬다.';
    const issues = findRhythmIssues(content);

    expect(issues.length).toBe(0);
  });

  it('should detect -요 ending monotony', () => {
    const content = '했어요. 봤어요. 갔어요. 왔어요. 알아요. 해요.';
    const issues = findRhythmIssues(content);

    expect(issues.length).toBe(1);
    expect(issues[0].pattern).toBe('-요');
  });

  it('should track positions of rhythm issues', () => {
    const content = '갔다. 봤다. 했다. 왔다. 갔다. 봤다.';
    const issues = findRhythmIssues(content);

    expect(issues[0].startPosition).toBe(0);
    expect(issues[0].endPosition).toBeGreaterThan(0);
  });

  it('should handle exactly 5 consecutive (threshold)', () => {
    // Exactly 5 - should trigger
    const content = '갔다. 봤다. 했다. 왔다. 왔다.';
    const issues = findRhythmIssues(content);

    expect(issues.length).toBe(1);
  });

  it('should handle 4 consecutive (below threshold)', () => {
    // 4 consecutive - should not trigger
    const content = '갔다. 봤다. 했다. 왔다.';
    const issues = findRhythmIssues(content);

    expect(issues.length).toBe(0);
  });
});

// ============================================================================
// Paragraph Utilities Tests
// ============================================================================

describe('getParagraphs', () => {
  it('should split content into paragraphs', () => {
    const content = '첫 번째 문단.\n\n두 번째 문단.\n\n세 번째 문단.';
    const paragraphs = getParagraphs(content);

    expect(paragraphs.length).toBe(3);
    expect(paragraphs[0].text).toBe('첫 번째 문단.');
    expect(paragraphs[1].text).toBe('두 번째 문단.');
    expect(paragraphs[2].text).toBe('세 번째 문단.');
  });

  it('should track paragraph indices', () => {
    const content = '문단 1.\n\n문단 2.\n\n문단 3.';
    const paragraphs = getParagraphs(content);

    expect(paragraphs[0].index).toBe(0);
    expect(paragraphs[1].index).toBe(1);
    expect(paragraphs[2].index).toBe(2);
  });

  it('should track character positions', () => {
    const content = '첫째.\n\n둘째.';
    const paragraphs = getParagraphs(content);

    expect(paragraphs[0].startChar).toBe(0);
    expect(paragraphs[0].endChar).toBe(3);
  });

  it('should handle empty content', () => {
    const paragraphs = getParagraphs('');

    expect(paragraphs.length).toBe(0);
  });

  it('should skip empty paragraphs', () => {
    const content = '문단 1.\n\n\n\n문단 2.';
    const paragraphs = getParagraphs(content);

    expect(paragraphs.length).toBe(2);
  });
});

describe('findParagraphForPosition', () => {
  it('should find correct paragraph for position', () => {
    const content = '첫 번째 문단입니다.\n\n두 번째 문단입니다.';
    const paragraphs = getParagraphs(content);

    const paraIdx = findParagraphForPosition(paragraphs, 5);

    expect(paraIdx).toBe(0);
  });

  it('should find paragraph for position in later paragraph', () => {
    const content = '첫째.\n\n둘째 문단입니다.';
    const paragraphs = getParagraphs(content);

    // Position in second paragraph
    const paraIdx = findParagraphForPosition(paragraphs, 10);

    expect(paraIdx).toBe(1);
  });

  it('should return last paragraph for out-of-range position', () => {
    const content = '문단 1.\n\n문단 2.';
    const paragraphs = getParagraphs(content);

    const paraIdx = findParagraphForPosition(paragraphs, 1000);

    expect(paraIdx).toBe(1);
  });
});

// ============================================================================
// Directive Creation Tests
// ============================================================================

describe('createDirective', () => {
  it('should create directive with all required fields', () => {
    const directive = createDirective(
      'filter-word-removal',
      2,
      { sceneNumber: 1, paragraphStart: 0, paragraphEnd: 0 },
      '필터 워드 발견',
      '그녀는 느꼈다.',
      '느꼈다를 제거하세요',
      1
    );

    expect(directive.id).toBe('dir_filter-word-removal_001');
    expect(directive.type).toBe('filter-word-removal');
    expect(directive.priority).toBe(2);
    expect(directive.location.sceneNumber).toBe(1);
    expect(directive.issue).toBe('필터 워드 발견');
    expect(directive.currentText).toBe('그녀는 느꼈다.');
    expect(directive.instruction).toBe('느꼈다를 제거하세요');
    expect(directive.maxScope).toBe(1);
  });

  it('should include exemplar when provided', () => {
    const directive = createDirective(
      'show-not-tell',
      1,
      { sceneNumber: 1, paragraphStart: 0, paragraphEnd: 1 },
      'Telling 문장',
      '그녀는 슬펐다.',
      '감정을 신체 반응으로 표현하세요',
      2,
      { id: 'exm_emotion_001', content: '눈물이 볼을 타고 흘렀다.' }
    );

    expect(directive.exemplarId).toBe('exm_emotion_001');
    expect(directive.exemplarContent).toBe('눈물이 볼을 타고 흘렀다.');
  });

  it('should not include exemplar fields when not provided', () => {
    const directive = createDirective(
      'rhythm-variation',
      5,
      { sceneNumber: 1, paragraphStart: 0, paragraphEnd: 2 },
      '리듬 문제',
      '갔다. 봤다. 했다.',
      '문장 종결을 다양화하세요',
      3
    );

    expect(directive.exemplarId).toBeUndefined();
    expect(directive.exemplarContent).toBeUndefined();
  });
});

// ============================================================================
// Main Analysis Function Tests
// ============================================================================

describe('analyzeChapter', () => {
  it('should return PASS for clean content', () => {
    // Good prose: no filter words, varied rhythm, sensory content, with texture
    const content = '빛이 창문으로 쏟아졌다. ' +
      '소리가 들려왔는가? ' +
      '차가운 바람이 피부를 스쳤네. ' +
      '향긋한 냄새가 코를 간질였지. ' +
      '단맛이 혀끝에 맴돌았다!';

    // Disable texture assessment for this basic test
    const result = analyzeChapter(content, 1, { assessKoreanTexture: false });

    expect(result.verdict).toBe('PASS');
    expect(result.directives.length).toBe(0);
  });

  it('should return REVISE with directives for problematic content', () => {
    // Bad prose: filter words and no sensory detail
    const content = '그녀는 슬픔을 느꼈다. 그것이 보였다. 그는 생각했다. '.repeat(10);

    const result = analyzeChapter(content);

    expect(result.verdict).toBe('REVISE');
    expect(result.directives.length).toBeGreaterThan(0);
    expect(result.directives.length).toBeLessThanOrEqual(MAX_DIRECTIVES_PER_PASS);
  });

  it('should limit directives to MAX_DIRECTIVES_PER_PASS', () => {
    // Content with many issues
    const content = '느꼈다. 보였다. 생각했다. 알 수 있었다. 깨달았다. '.repeat(20);

    const result = analyzeChapter(content);

    expect(result.directives.length).toBeLessThanOrEqual(MAX_DIRECTIVES_PER_PASS);
  });

  it('should include assessment with all dimensions', () => {
    const content = '테스트 내용입니다.';
    const result = analyzeChapter(content);

    expect(result.assessment).toHaveProperty('proseQuality');
    expect(result.assessment).toHaveProperty('sensoryGrounding');
    expect(result.assessment).toHaveProperty('filterWordDensity');
    expect(result.assessment).toHaveProperty('rhythmVariation');
    expect(result.assessment).toHaveProperty('characterVoice');
    expect(result.assessment).toHaveProperty('transitionQuality');
  });

  it('should include reader experience feedback', () => {
    const content = '테스트 내용입니다.';
    const result = analyzeChapter(content);

    expect(result.readerExperience).toBeDefined();
    expect(typeof result.readerExperience).toBe('string');
    expect(result.readerExperience.length).toBeGreaterThan(0);
  });

  it('should detect filter words in assessment', () => {
    const content = '그녀는 슬픔을 느꼈다. 무언가가 보였다.';
    const result = analyzeChapter(content);

    expect(result.assessment.filterWordDensity.count).toBe(2);
  });

  it('should generate filter-word-removal directives', () => {
    const content = '그녀는 두려움을 느꼈다.\n\n그것이 다가오는 것이 보였다.';
    const result = analyzeChapter(content);

    const filterDirectives = result.directives.filter(d => d.type === 'filter-word-removal');
    expect(filterDirectives.length).toBeGreaterThan(0);

    const directive = filterDirectives[0];
    expect(directive.location).toBeDefined();
    expect(directive.instruction).toContain('제거');
  });

  it('should handle multi-scene chapters', () => {
    const content = '장면 1 내용.\n\n장면 2 내용.\n\n장면 3 내용.';
    const result = analyzeChapter(content, 3);

    // Verify that scene numbers are assigned correctly in directives
    for (const directive of result.directives) {
      expect(directive.location.sceneNumber).toBeGreaterThanOrEqual(1);
      expect(directive.location.sceneNumber).toBeLessThanOrEqual(3);
    }
  });
});

// ============================================================================
// Simple Analysis Tests
// ============================================================================

describe('analyzeAndReport', () => {
  it('should return simplified report', () => {
    const content = '빛이 눈부셨다. 소리가 들렸다. 차갑다.';
    const report = analyzeAndReport(content);

    expect(report).toHaveProperty('filterWordCount');
    expect(report).toHaveProperty('sensoryCategories');
    expect(report).toHaveProperty('rhythmIssues');
    expect(report).toHaveProperty('overallVerdict');
  });

  it('should count filter words correctly', () => {
    const content = '느꼈다. 보였다. 생각했다.';
    const report = analyzeAndReport(content);

    expect(report.filterWordCount).toBe(3);
  });

  it('should report PASS for good content', () => {
    const content = '빛이 눈부셨다. 소리가 들렸나? 차갑네. 향긋하지. 달다!';
    const report = analyzeAndReport(content);

    expect(report.overallVerdict).toBe('PASS');
  });

  it('should report REVISE for bad content', () => {
    const content = '느꼈다. 보였다. 생각했다. '.repeat(10);
    const report = analyzeAndReport(content);

    expect(report.overallVerdict).toBe('REVISE');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty content', () => {
    const result = analyzeChapter('');

    expect(result.verdict).toBeDefined();
    expect(result.assessment).toBeDefined();
    expect(result.directives).toBeDefined();
  });

  it('should handle content with only dialogue', () => {
    const content = '"안녕하세요?" "네, 안녕하세요." "느꼈다는 표현은요?" "네, 느꼈습니다."';
    const result = analyzeChapter(content);

    // Filter words inside dialogue should not be counted for directives
    const filterDirectives = result.directives.filter(d => d.type === 'filter-word-removal');
    expect(filterDirectives.length).toBe(0);
  });

  it('should handle very short content', () => {
    const result = analyzeChapter('짧은 문장.');

    expect(result.verdict).toBeDefined();
  });

  it('should handle content with Korean and English mixed', () => {
    const content = 'The light was bright. 빛이 눈부셨다. He felt it. 그는 느꼈다.';
    const result = analyzeChapter(content);

    // Should still detect Korean filter word
    expect(result.assessment.filterWordDensity.count).toBeGreaterThan(0);
  });
});
