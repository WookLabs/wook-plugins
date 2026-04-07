#!/usr/bin/env node
/**
 * Provider Resolver — 태스크별 최적 provider를 결정하는 유틸리티
 *
 * 해상도 순서:
 *   1. CLI 플래그 (--codex, --claude, --grok)
 *   2. 프로젝트 설정 (meta/project.json → provider_routing)
 *   3. 글로벌 설정 (config/provider-routing.json → defaults)
 *   4. 하드코드 폴백 (claude)
 *
 * Usage:
 *   import { resolveProvider } from './lib/provider-resolver.mjs';
 *   const { provider, model, reason } = resolveProvider('design', { cliArgs, projectPath });
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config Loading ──────────────────────────────────────────────────────────

const ROUTING_CONFIG_PATH = path.resolve(__dirname, '..', '..', 'config', 'provider-routing.json');

let _routingConfig = null;

function loadRoutingConfig() {
  if (_routingConfig) return _routingConfig;

  try {
    _routingConfig = JSON.parse(fs.readFileSync(ROUTING_CONFIG_PATH, 'utf-8'));
  } catch {
    _routingConfig = { defaults: {}, cli_overrides: {}, cost_weights: {} };
  }
  return _routingConfig;
}

function loadProjectRouting(projectPath) {
  if (!projectPath) return null;

  const projectJsonPath = path.join(projectPath, 'meta', 'project.json');
  try {
    const data = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    return data.provider_routing || null;
  } catch {
    return null;
  }
}

// ─── Codex CLI Check ─────────────────────────────────────────────────────────

let _codexAvailable = null;

function isCodexAvailable() {
  if (_codexAvailable !== null) return _codexAvailable;

  try {
    execFileSync('codex', ['--version'], {
      stdio: 'pipe',
      timeout: 5000,
      shell: true
    });
    _codexAvailable = true;
  } catch {
    _codexAvailable = false;
  }
  return _codexAvailable;
}

// ─── CLI Flag Parsing ────────────────────────────────────────────────────────

function parseCliProvider(cliArgs) {
  if (!cliArgs) return null;

  const args = Array.isArray(cliArgs) ? cliArgs : cliArgs.split(/\s+/);
  const config = loadRoutingConfig();
  const overrides = config.cli_overrides || {};

  for (const arg of args) {
    if (overrides[arg]) return overrides[arg];
  }
  return null;
}

// ─── Main Resolver ───────────────────────────────────────────────────────────

/**
 * 태스크별 최적 provider를 결정
 *
 * @param {string} taskType - 태스크 유형 (design, write, gen-plot, etc.)
 * @param {object} options
 * @param {string|string[]} [options.cliArgs] - CLI 인자 (--codex, --claude 등)
 * @param {string} [options.projectPath] - 소설 프로젝트 경로
 * @returns {{ provider: string, reason: string }}
 */
export function resolveProvider(taskType, { cliArgs, projectPath } = {}) {
  // 1. CLI 플래그
  const cliProvider = parseCliProvider(cliArgs);
  if (cliProvider) {
    // Codex 요청 시 설치 확인
    if (cliProvider === 'codex' && !isCodexAvailable()) {
      return {
        provider: 'claude',
        reason: `--codex 지정했지만 Codex CLI 미설치 → claude 폴백. npm install -g @openai/codex 실행 필요.`
      };
    }
    return { provider: cliProvider, reason: `CLI 플래그 override` };
  }

  // 2. 프로젝트 설정
  const projectRouting = loadProjectRouting(projectPath);
  if (projectRouting && projectRouting[taskType]) {
    const provider = projectRouting[taskType];
    if (provider === 'codex' && !isCodexAvailable()) {
      return { provider: 'claude', reason: `프로젝트 설정 codex이나 CLI 미설치 → claude 폴백` };
    }
    return { provider, reason: `프로젝트 설정 (meta/project.json)` };
  }

  // 3. 글로벌 설정
  const config = loadRoutingConfig();
  const globalDefault = config.defaults?.[taskType];
  if (globalDefault) {
    if (globalDefault === 'codex' && !isCodexAvailable()) {
      return { provider: 'claude', reason: `글로벌 기본 codex이나 CLI 미설치 → claude 폴백` };
    }
    return { provider: globalDefault, reason: `글로벌 기본값 (provider-routing.json)` };
  }

  // 4. 하드코드 폴백
  return { provider: 'claude', reason: `하드코드 폴백 (태스크 "${taskType}" 미등록)` };
}

/**
 * 비용 가중치 조회
 * @param {string} provider - provider 이름
 * @param {string} model - 모델 이름
 * @returns {number} 상대 비용 (claude:opus = 1.0 기준)
 */
export function getCostWeight(provider, model) {
  const config = loadRoutingConfig();
  const key = `${provider}:${model}`;
  return config.cost_weights?.[key] ?? 1.0;
}

/**
 * 사용 가능한 provider 목록
 * @returns {{ name: string, available: boolean }[]}
 */
export function listProviders() {
  return [
    { name: 'claude', available: true },
    { name: 'codex', available: isCodexAvailable() },
    { name: 'grok', available: true } // API key check는 별도
  ];
}

// ─── CLI 테스트 ──────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const taskType = process.argv[2] || 'design';
  const projectPath = process.argv[3] || null;
  const cliArgs = process.argv.slice(4);

  const result = resolveProvider(taskType, { cliArgs, projectPath });
  console.log(`Task: ${taskType}`);
  console.log(`Provider: ${result.provider}`);
  console.log(`Reason: ${result.reason}`);
  console.log(`\nAvailable providers:`, listProviders());
}
