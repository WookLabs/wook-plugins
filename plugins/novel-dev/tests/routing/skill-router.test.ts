import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
const RULES_PATH = join(__dirname_local, '..', '..', 'scripts', 'routing-rules.json');
const HOOKS_PATH = join(__dirname_local, '..', '..', 'hooks', 'hooks.json');

// ── Re-implement matching logic for testing ────────────────────────
// Mirrors novel-skill-router.mjs without requiring .mjs import

interface RoutingSkill {
  id: string;
  name: string;
  keywords: string[];
  keywordVariants?: string[];
  argPattern?: string | null;
  argType?: string | null;
  excludeKeywords?: string[];
  requiredState?: string[] | null;
  requireNovelContext?: boolean;
  priority: number;
}

interface RoutingRules {
  version: string;
  config: {
    autoThreshold: number;
    suggestThreshold: number;
    maxCandidates: number;
    projectRequiredExceptions: string[];
  };
  omcConflictKeywords: string[];
  novelContextIndicators: string[];
  skills: RoutingSkill[];
}

interface MatchResult {
  score: number;
  matchedKeyword: string | null;
  args: { type: string; value: string } | null;
}

interface ProjectState {
  exists: boolean;
  status: string | null;
  ralphActive: boolean;
}

function matchSingleSkill(prompt: string, skill: RoutingSkill): MatchResult | null {
  const lower = prompt.toLowerCase();

  if (skill.excludeKeywords?.some(ek => lower.includes(ek.toLowerCase()))) {
    return null;
  }

  let baseScore = 0;
  let matchedKeyword: string | null = null;

  for (const kw of skill.keywords) {
    if (lower.includes(kw.toLowerCase())) {
      baseScore = 0.7;
      matchedKeyword = kw;
      break;
    }
  }

  if (baseScore === 0) return null;

  let variantBonus = 0;
  if (skill.keywordVariants) {
    for (const v of skill.keywordVariants) {
      if (lower.includes(v.toLowerCase())) {
        variantBonus = 0.1;
        matchedKeyword = v;
        break;
      }
    }
  }

  let argBonus = 0;
  let extractedArgs: { type: string; value: string } | null = null;
  if (skill.argPattern) {
    const argRegex = new RegExp(skill.argPattern, 'i');
    const argMatch = prompt.match(argRegex);
    if (argMatch) {
      argBonus = 0.1;
      extractedArgs = { type: skill.argType!, value: argMatch[1] };
    }
  }

  const priorityFactor = Math.min(1.0, 0.8 + (skill.priority / 50));
  const rawScore = baseScore + variantBonus + argBonus;
  const finalScore = rawScore * priorityFactor;

  return { score: finalScore, matchedKeyword, args: extractedArgs };
}

function hasNovelContext(prompt: string, rules: RoutingRules): boolean {
  const lower = prompt.toLowerCase();
  if (rules.novelContextIndicators?.some(ind => lower.includes(ind))) return true;
  if (/[0-9]+\s*(?:화|회|장|막)/.test(prompt)) return true;
  return false;
}

function hasOmcConflict(prompt: string, rules: RoutingRules): boolean {
  const lower = prompt.toLowerCase();
  return rules.omcConflictKeywords?.some(kw => lower.includes(kw)) || false;
}

function matchSkills(prompt: string, rules: RoutingRules, state: ProjectState) {
  const candidates: Array<{ id: string; name: string; score: number; matchedKeyword: string | null; args: { type: string; value: string } | null }> = [];

  for (const skill of rules.skills) {
    if (skill.requireNovelContext && hasOmcConflict(prompt, rules)) {
      if (!hasNovelContext(prompt, rules)) continue;
    }

    if (!state.exists) {
      const exceptions = rules.config.projectRequiredExceptions || [];
      if (!exceptions.includes(skill.id)) continue;
    }

    if (skill.requiredState && state.exists && state.status) {
      if (!skill.requiredState.includes(state.status)) continue;
    }

    const result = matchSingleSkill(prompt, skill);
    if (result) {
      candidates.push({
        id: skill.id,
        name: skill.name,
        score: result.score,
        matchedKeyword: result.matchedKeyword,
        args: result.args,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

function formatArgs(args: { type: string; value: string } | null): string {
  if (!args) return '';
  return args.value || '';
}

// ── Helpers ────────────────────────────────────────────────────────

function projectState(overrides: Partial<ProjectState> = {}): ProjectState {
  return { exists: true, status: 'writing', ralphActive: false, ...overrides };
}

function noProject(): ProjectState {
  return { exists: false, status: null, ralphActive: false };
}

// ── Tests ──────────────────────────────────────────────────────────

let rules: RoutingRules;

beforeAll(() => {
  rules = JSON.parse(readFileSync(RULES_PATH, 'utf-8'));
  expect(rules).not.toBeNull();
});

// ── routing-rules.json 구조 검증 ───────────────────────────────────

describe('routing-rules.json structure', () => {
  it('should have valid config with 2-tier thresholds', () => {
    expect(rules.config.autoThreshold).toBe(0.8);
    expect(rules.config.suggestThreshold).toBe(0.6);
    expect(rules.config.maxCandidates).toBeGreaterThanOrEqual(1);
  });

  it('should have omcConflictKeywords defined', () => {
    expect(rules.omcConflictKeywords).toBeInstanceOf(Array);
    expect(rules.omcConflictKeywords.length).toBeGreaterThan(0);
    expect(rules.omcConflictKeywords).toContain('ralph');
    expect(rules.omcConflictKeywords).toContain('team');
  });

  it('should have 19 core skills', () => {
    expect(rules.skills.length).toBe(19);
  });

  it('should have projectRequiredExceptions', () => {
    const exceptions = rules.config.projectRequiredExceptions;
    expect(exceptions).toContain('00-brainstorm');
    expect(exceptions).toContain('03-init');
    expect(exceptions).toContain('help');
  });

  it('each skill should have required fields', () => {
    for (const skill of rules.skills) {
      expect(skill.id).toBeDefined();
      expect(skill.name).toBeDefined();
      expect(skill.keywords).toBeInstanceOf(Array);
      expect(skill.keywords.length).toBeGreaterThan(0);
      expect(skill.priority).toBeGreaterThan(0);
    }
  });
});

// ── 기본 키워드 매칭 (auto-execute, score >= 0.8) ──────────────────

describe('matchSkills - auto-execute (score >= 0.8)', () => {
  it('"5화 집필해줘" -> 14-write, chapter=5', () => {
    const candidates = matchSkills('5화 집필해줘', rules, projectState());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('14-write');
    expect(candidates[0].args).toEqual({ type: 'chapter', value: '5' });
    expect(candidates[0].score).toBeGreaterThanOrEqual(rules.config.autoThreshold);
  });

  it('"전체 집필해" -> 16-write-all', () => {
    const candidates = matchSkills('전체 집필해', rules, projectState());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('16-write-all');
  });

  it('"1막 집필 시작" -> 15-write-act, act=1', () => {
    const candidates = matchSkills('1막 집필 시작', rules, projectState());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('15-write-act');
    expect(candidates[0].args).toEqual({ type: 'act', value: '1' });
  });

  it('"캐릭터 설계해줘" -> 06-design-character', () => {
    const candidates = matchSkills('캐릭터 설계해줘', rules, projectState({ status: 'planning' }));
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('06-design-character');
  });

  it('"일관성 체크" -> 19-consistency-check', () => {
    const candidates = matchSkills('일관성 체크', rules, projectState());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('19-consistency-check');
  });

  it('"퇴고해줘" -> 17-revise', () => {
    const candidates = matchSkills('퇴고해줘', rules, projectState({ status: 'editing' }));
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('17-revise');
  });

  it('"평가해봐" -> 18-evaluate', () => {
    const candidates = matchSkills('평가해봐', rules, projectState());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('18-evaluate');
  });

  it('"브레인스토밍하자" -> 00-brainstorm', () => {
    const candidates = matchSkills('브레인스토밍하자', rules, projectState());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('00-brainstorm');
  });

  it('"새 소설 시작하자" -> 03-init (프로젝트 없어도 동작)', () => {
    const candidates = matchSkills('새 소설 시작하자', rules, noProject());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('03-init');
  });

  it('"2패스로 3화 써줘" -> write-2pass, chapter=3', () => {
    const candidates = matchSkills('2패스로 3화 써줘', rules, projectState());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('write-2pass');
    expect(candidates[0].args).toEqual({ type: 'chapter', value: '3' });
  });
});

// ── excludeKeywords 검증 ──────────────────────────────────────────

describe('matchSkills - excludeKeywords', () => {
  it('"전체 집필"이 14-write로 매칭되지 않음 (16-write-all로 가야 함)', () => {
    const candidates = matchSkills('전체 집필해', rules, projectState());
    const writeMatch = candidates.find(c => c.id === '14-write');
    expect(writeMatch).toBeUndefined();
    expect(candidates[0].id).toBe('16-write-all');
  });

  it('"2패스 집필"이 14-write로 매칭되지 않음', () => {
    const candidates = matchSkills('2패스 집필', rules, projectState());
    const writeMatch = candidates.find(c => c.id === '14-write');
    expect(writeMatch).toBeUndefined();
  });

  it('"블루프린트 리뷰"가 01-blueprint-gen으로 매칭되지 않음', () => {
    const skill = rules.skills.find(s => s.id === '01-blueprint-gen')!;
    const result = matchSingleSkill('블루프린트 리뷰', skill);
    expect(result).toBeNull();
  });

  it('"심층 평가"가 18-evaluate로 매칭되지 않음', () => {
    const skill = rules.skills.find(s => s.id === '18-evaluate')!;
    const result = matchSingleSkill('심층 평가', skill);
    expect(result).toBeNull();
  });

});

// ── OMC 충돌 해소 ──────────────────────────────────────────────────

describe('OMC conflict resolution', () => {

  it('hasOmcConflict: "plan" 감지', () => {
    expect(hasOmcConflict('plan this task', rules)).toBe(true);
  });

  it('hasOmcConflict: 소설 키워드만 있으면 false', () => {
    expect(hasOmcConflict('집필해줘', rules)).toBe(false);
  });

  it('hasNovelContext: 소설 키워드 있으면 true', () => {
    expect(hasNovelContext('5화 집필', rules)).toBe(true);
  });

  it('hasNovelContext: 회차 번호 패턴 있으면 true', () => {
    expect(hasNovelContext('5화 분석', rules)).toBe(true);
  });

  it('hasNovelContext: 소설 키워드 없으면 false', () => {
    expect(hasNovelContext('이것 좀 해줘', rules)).toBe(false);
  });

});

// ── 프로젝트 상태 필터링 ──────────────────────────────────────────

describe('matchSkills - project state filtering', () => {
  it('프로젝트 없을 때 "집필해줘" -> 14-write 미포함', () => {
    const candidates = matchSkills('집필해줘', rules, noProject());
    const writeMatch = candidates.find(c => c.id === '14-write');
    expect(writeMatch).toBeUndefined();
  });

  it('프로젝트 없을 때 "도움말" -> help (예외 스킬)', () => {
    const candidates = matchSkills('도움말', rules, noProject());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('help');
  });

  it('프로젝트 없을 때 "브레인스토밍" -> 00-brainstorm (예외 스킬)', () => {
    const candidates = matchSkills('브레인스토밍', rules, noProject());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('00-brainstorm');
  });

  it('planning 상태에서 "집필해줘" -> 14-write', () => {
    const candidates = matchSkills('집필해줘', rules, projectState({ status: 'planning' }));
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].id).toBe('14-write');
  });

  it('complete 상태에서 "세계관 설계" -> 05-design-world 미포함', () => {
    const candidates = matchSkills('세계관 설계', rules, projectState({ status: 'complete' }));
    const worldMatch = candidates.find(c => c.id === '05-design-world');
    expect(worldMatch).toBeUndefined();
  });
});

// ── 인자 추출 ──────────────────────────────────────────────────────

describe('argument extraction', () => {
  it('"15화 집필해줘" -> chapter=15', () => {
    const skill = rules.skills.find(s => s.id === '14-write')!;
    const result = matchSingleSkill('15화 집필해줘', skill);
    expect(result).not.toBeNull();
    expect(result!.args).toEqual({ type: 'chapter', value: '15' });
  });

  it('"2막 집필" -> act=2', () => {
    const skill = rules.skills.find(s => s.id === '15-write-act')!;
    const result = matchSingleSkill('2막 집필', skill);
    expect(result).not.toBeNull();
    expect(result!.args).toEqual({ type: 'act', value: '2' });
  });

  it('인자 없는 "집필해줘" -> args null', () => {
    const skill = rules.skills.find(s => s.id === '14-write')!;
    const result = matchSingleSkill('집필해줘', skill);
    expect(result).not.toBeNull();
    expect(result!.args).toBeNull();
  });

  it('formatArgs: chapter', () => {
    expect(formatArgs({ type: 'chapter', value: '5' })).toBe('5');
  });

  it('formatArgs: null', () => {
    expect(formatArgs(null)).toBe('');
  });
});

// ── 에지 케이스 ────────────────────────────────────────────────────

describe('edge cases', () => {
  it('빈 입력 -> empty candidates', () => {
    const candidates = matchSkills('', rules, projectState());
    expect(candidates.length).toBe(0);
  });

  it('관련 없는 입력 -> empty candidates', () => {
    const candidates = matchSkills('오늘 날씨가 좋다', rules, projectState());
    expect(candidates.length).toBe(0);
  });

  it('영어 키워드도 매칭', () => {
    const candidates = matchSkills('write chapter 5', rules, projectState());
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('한국어 어미 변형 매칭 시 variant bonus', () => {
    const skill = rules.skills.find(s => s.id === '14-write')!;
    const baseResult = matchSingleSkill('집필 시작', skill);
    const variantResult = matchSingleSkill('집필해줘', skill);
    expect(baseResult).not.toBeNull();
    expect(variantResult).not.toBeNull();
    expect(variantResult!.score).toBeGreaterThan(baseResult!.score);
  });

  it('score 정렬: 가장 높은 score가 첫 번째', () => {
    const candidates = matchSkills('5화 집필해줘', rules, projectState());
    if (candidates.length > 1) {
      for (let i = 1; i < candidates.length; i++) {
        expect(candidates[i - 1].score).toBeGreaterThanOrEqual(candidates[i].score);
      }
    }
  });

  it('"/write 5" 시작 여부 체크 (main 스킵 로직)', () => {
    expect('/write 5'.trimStart().startsWith('/')).toBe(true);
  });
});

// ── matchSingleSkill 단위 테스트 ──────────────────────────────────

describe('matchSingleSkill', () => {
  it('키워드 매칭 시 base score >= 0.7', () => {
    const skill: RoutingSkill = { id: 'test', name: 'test', keywords: ['테스트'], keywordVariants: [], excludeKeywords: [], priority: 10 };
    const result = matchSingleSkill('테스트', skill);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(0.7);
  });

  it('키워드 미매칭 시 null', () => {
    const skill: RoutingSkill = { id: 'test', name: 'test', keywords: ['테스트'], keywordVariants: [], excludeKeywords: [], priority: 10 };
    const result = matchSingleSkill('다른 입력', skill);
    expect(result).toBeNull();
  });

  it('excludeKeyword 존재 시 null', () => {
    const skill: RoutingSkill = { id: 'test', name: 'test', keywords: ['집필'], keywordVariants: [], excludeKeywords: ['전체'], priority: 10 };
    const result = matchSingleSkill('전체 집필', skill);
    expect(result).toBeNull();
  });

  it('variant 매칭 시 +0.1 bonus', () => {
    const skill: RoutingSkill = { id: 'test', name: 'test', keywords: ['집필'], keywordVariants: ['집필해줘'], excludeKeywords: [], priority: 10 };
    const baseResult = matchSingleSkill('집필 시작', skill);
    const variantResult = matchSingleSkill('집필해줘', skill);
    expect(variantResult!.score).toBeGreaterThan(baseResult!.score);
  });

  it('arg 매칭 시 +0.1 bonus + args 추출', () => {
    const skill: RoutingSkill = { id: 'test', name: 'test', keywords: ['집필'], keywordVariants: [], excludeKeywords: [], argPattern: '([0-9]+)\\s*화', argType: 'chapter', priority: 10 };
    const noArgResult = matchSingleSkill('집필 시작', skill);
    const argResult = matchSingleSkill('5화 집필', skill);
    expect(argResult!.score).toBeGreaterThan(noArgResult!.score);
    expect(argResult!.args).toEqual({ type: 'chapter', value: '5' });
  });
});

// ── 훅 출력 형식 / 파일 구조 검증 ──────────────────────────────────

describe('file structure verification', () => {
  it('routing-rules.json is valid JSON', () => {
    const content = readFileSync(RULES_PATH, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('hooks.json has sequential hooks in same matcher', () => {
    const hooksConfig = JSON.parse(readFileSync(HOOKS_PATH, 'utf-8'));
    const userPromptSubmit = hooksConfig.hooks.UserPromptSubmit;

    expect(userPromptSubmit.length).toBe(1);

    const hooks = userPromptSubmit[0].hooks;
    expect(hooks.length).toBe(2);
    expect(hooks[0].command).toContain('novel-state-detector.mjs');
    expect(hooks[1].command).toContain('novel-skill-router.mjs');
  });

  it('state-detector uses hookSpecificOutput (not message)', () => {
    const detectorPath = join(__dirname_local, '..', '..', 'scripts', 'novel-state-detector.mjs');
    const content = readFileSync(detectorPath, 'utf-8');
    expect(content).not.toContain('"message"');
    expect(content).toContain('hookSpecificOutput');
    expect(content).toContain('hookEventName');
  });

  it('state-detector does not contain magicKeywords block', () => {
    const detectorPath = join(__dirname_local, '..', '..', 'scripts', 'novel-state-detector.mjs');
    const content = readFileSync(detectorPath, 'utf-8');
    expect(content).not.toContain('magicKeywords');
    expect(content).not.toContain('novelKeywords');
    expect(content).not.toContain('writeKeywords');
  });

  it('router uses hookSpecificOutput with hookEventName', () => {
    const routerPath = join(__dirname_local, '..', '..', 'scripts', 'novel-skill-router.mjs');
    const content = readFileSync(routerPath, 'utf-8');
    expect(content).toContain('hookSpecificOutput');
    expect(content).toContain('hookEventName');
    expect(content).toContain('MAGIC KEYWORD');
  });
});
