#!/usr/bin/env node

/**
 * Novel Skill Router - 자연어 입력을 스킬로 자동 라우팅
 *
 * UserPromptSubmit 훅으로 실행.
 * routing-rules.json의 키워드+argPattern 하이브리드 모델로 매칭.
 * 2-tier 신뢰도: 0.8+ auto-execute (MAGIC KEYWORD), 0.6-0.8 suggest.
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findActiveProject } from './lib/project-finder.mjs';
import { findStateFile, readState } from './lib/state-utils.mjs';
import { readStdinSafe, extractPrompt, removeCodeBlocks } from './lib/hook-utils.mjs';
export { extractPrompt, removeCodeBlocks } from './lib/hook-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── routing rules ──────────────────────────────────────────────────

function loadRoutingRules() {
  const rulesPath = join(__dirname, 'routing-rules.json');
  if (!existsSync(rulesPath)) return null;
  try {
    return JSON.parse(readFileSync(rulesPath, 'utf-8'));
  } catch {
    return null;
  }
}

// ── project state ──────────────────────────────────────────────────

function detectProjectState(directory) {
  const project = findActiveProject(directory);
  if (!project) return { exists: false, status: null, ralphActive: false };

  // Read project.json for status
  let status = null;
  const projectJsonPath = join(project.path, 'meta', 'project.json');
  if (existsSync(projectJsonPath)) {
    try {
      const pj = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));
      status = pj.status || null;
    } catch { /* ignore */ }
  }

  // Check Ralph state
  const stateInfo = findStateFile(project.path);
  let ralphActive = false;
  if (stateInfo) {
    try {
      const state = readState(project.path);
      ralphActive = !!state?.ralph_active;
    } catch { /* ignore */ }
  }

  return { exists: true, status, ralphActive, projectPath: project.path };
}

// ── matching engine ────────────────────────────────────────────────

/**
 * Check if the prompt contains novel-related context indicators.
 */
function hasNovelContext(prompt, rules) {
  const lower = prompt.toLowerCase();
  // Check novel context indicators from rules
  if (rules.novelContextIndicators?.some(ind => lower.includes(ind))) return true;
  // Check for chapter/act number patterns
  if (/[0-9]+\s*(?:화|회|장|막)/.test(prompt)) return true;
  return false;
}

/**
 * Check if any OMC conflict keyword is present in the prompt.
 */
function hasOmcConflict(prompt, rules) {
  const lower = prompt.toLowerCase();
  return rules.omcConflictKeywords?.some(kw => lower.includes(kw)) || false;
}

/**
 * Match a single skill against the prompt.
 * Returns { score, matchedKeyword, args } or null.
 */
function matchSingleSkill(prompt, skill) {
  const lower = prompt.toLowerCase();

  // Check excludeKeywords first
  if (skill.excludeKeywords?.some(ek => lower.includes(ek.toLowerCase()))) {
    return null;
  }

  // Check keywords (base score 0.7)
  let baseScore = 0;
  let matchedKeyword = null;

  for (const kw of skill.keywords) {
    if (lower.includes(kw.toLowerCase())) {
      baseScore = 0.7;
      matchedKeyword = kw;
      break;
    }
  }

  if (baseScore === 0) return null;

  // Check keywordVariants (bonus +0.1)
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

  // Check argPattern (bonus +0.1)
  let argBonus = 0;
  let extractedArgs = null;
  if (skill.argPattern) {
    const argRegex = new RegExp(skill.argPattern, 'i');
    const argMatch = prompt.match(argRegex);
    if (argMatch) {
      argBonus = 0.1;
      extractedArgs = { type: skill.argType, value: argMatch[1] };
    }
  }

  // Calculate final score
  // priorityFactor = 0.8 + (priority / 50), capped at 1.0
  const priorityFactor = Math.min(1.0, 0.8 + (skill.priority / 50));
  const rawScore = baseScore + variantBonus + argBonus;
  const finalScore = rawScore * priorityFactor;

  return {
    score: finalScore,
    matchedKeyword,
    args: extractedArgs
  };
}

/**
 * Match prompt against all skills, return sorted candidates.
 */
function matchSkills(prompt, rules, projectState) {
  const candidates = [];

  for (const skill of rules.skills) {
    // OMC conflict check
    if (skill.requireNovelContext && hasOmcConflict(prompt, rules)) {
      if (!hasNovelContext(prompt, rules)) {
        continue; // Let OMC handle it
      }
    }

    // Project requirement check
    if (!projectState.exists) {
      const exceptions = rules.config.projectRequiredExceptions || [];
      if (!exceptions.includes(skill.id)) {
        continue; // Project required but not found
      }
    }

    // State requirement check
    if (skill.requiredState && projectState.exists && projectState.status) {
      if (!skill.requiredState.includes(projectState.status)) {
        continue; // Current state doesn't match required state
      }
    }

    const result = matchSingleSkill(prompt, skill);
    if (result) {
      candidates.push({
        id: skill.id,
        name: skill.name,
        score: result.score,
        matchedKeyword: result.matchedKeyword,
        args: result.args
      });
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  return candidates;
}

// ── arg formatting ─────────────────────────────────────────────────

function formatArgs(args) {
  if (!args) return '';
  if (args.type === 'chapter') return args.value;
  if (args.type === 'act') return args.value;
  return args.value || '';
}

// ── output builders ────────────────────────────────────────────────

function passthrough() {
  return { decision: "approve" };
}

function buildAutoExecute(skill, userPrompt) {
  const argsStr = formatArgs(skill.args);
  const argsLine = argsStr ? `\nExtracted arguments: ${argsStr}` : '';

  return {
    decision: "approve",
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `[MAGIC KEYWORD: novel-dev:${skill.id}]

Skill: novel-dev:${skill.id}
User request: ${userPrompt}${argsLine}

IMPORTANT: Invoke the skill IMMEDIATELY with the user's request.`
    }
  };
}

function buildSuggest(candidates, maxCandidates) {
  const top = candidates.slice(0, maxCandidates);
  const lines = top.map((c, i) =>
    `${i + 1}. /novel-dev:${c.id} (${c.name}) - 매칭 신뢰도: ${(c.score * 100).toFixed(0)}%`
  ).join('\n');

  return {
    decision: "approve",
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `<novel-skill-suggestion>

사용자 요청에 맞는 스킬 후보:
${lines}

적절한 스킬을 선택하여 실행하거나, 사용자에게 확인하세요.

</novel-skill-suggestion>`
    }
  };
}

// ── main ───────────────────────────────────────────────────────────

async function main() {
  try {
    const input = await readStdinSafe();
    if (!input.trim()) {
      console.log(JSON.stringify(passthrough()));
      return;
    }

    let data = {};
    try { data = JSON.parse(input); } catch { /* ignore */ }
    const directory = data.directory || data.cwd || process.cwd();

    const prompt = extractPrompt(input);
    if (!prompt) {
      console.log(JSON.stringify(passthrough()));
      return;
    }

    // Skip: explicit command
    if (prompt.trimStart().startsWith('/')) {
      console.log(JSON.stringify(passthrough()));
      return;
    }

    const cleanPrompt = removeCodeBlocks(prompt);

    // Skip: Ralph Loop active
    const projectState = detectProjectState(directory);
    if (projectState.ralphActive) {
      console.log(JSON.stringify(passthrough()));
      return;
    }

    // Load routing rules
    const rules = loadRoutingRules();
    if (!rules) {
      console.error('[novel-skill-router] Failed to load routing-rules.json');
      console.log(JSON.stringify(passthrough()));
      return;
    }

    // Match skills
    const candidates = matchSkills(cleanPrompt, rules, projectState);

    if (candidates.length === 0) {
      console.log(JSON.stringify(passthrough()));
      return;
    }

    const best = candidates[0];
    const { autoThreshold, suggestThreshold, maxCandidates } = rules.config;

    // Epsilon tolerance for floating-point comparison
    const EPSILON = 1e-10;

    if (best.score >= autoThreshold - EPSILON) {
      // Auto-execute
      console.log(JSON.stringify(buildAutoExecute(best, prompt)));
    } else if (best.score >= suggestThreshold - EPSILON) {
      // Suggest candidates
      console.log(JSON.stringify(buildSuggest(candidates, maxCandidates)));
    } else {
      // Below threshold
      console.log(JSON.stringify(passthrough()));
    }
  } catch (error) {
    // Log to stderr for debugging (stdout reserved for hook output)
    console.error(`[novel-skill-router] ${error.message}`);
    // Graceful fallback: never break the hook chain
    console.log(JSON.stringify({ decision: "approve" }));
  }
}

// Export for testing
export { matchSingleSkill, matchSkills, hasNovelContext, hasOmcConflict, formatArgs, loadRoutingRules };

main();
