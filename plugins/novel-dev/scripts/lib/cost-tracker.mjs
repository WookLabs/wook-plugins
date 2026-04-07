#!/usr/bin/env node
/**
 * Cost Tracker — Provider 호출 비용 추적
 *
 * 각 provider 호출을 meta/cost-log.jsonl에 기록하고,
 * 누적 비용 요약을 제공합니다.
 *
 * Usage (모듈):
 *   import { logCall, getSummary } from './lib/cost-tracker.mjs';
 *   logCall({ provider: 'codex', model: 'gpt-5.4', task: 'design', projectPath });
 *   const summary = getSummary(projectPath);
 *
 * Usage (CLI):
 *   node scripts/lib/cost-tracker.mjs --project ./novels/my-novel
 *   node scripts/lib/cost-tracker.mjs --project ./novels/my-novel --since 2026-04-01
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// ─── Cost Weights (claude:opus = 1.0 기준) ──────────────────────────────────

const DEFAULT_COST_WEIGHTS = {
  'claude:opus': 1.0,
  'claude:sonnet': 0.2,
  'claude:haiku': 0.05,
  'codex:gpt-5.4': 0.15,
  'grok:grok-4.20-0309-reasoning': 0.3
};

// Estimated $/1K tokens by provider:model
const TOKEN_COSTS = {
  'claude:opus': 0.015,
  'claude:sonnet': 0.003,
  'claude:haiku': 0.00025,
  'codex:gpt-5.4': 0.002,
  'grok:grok-4.20-0309-reasoning': 0.005
};

// ─── Log Functions ───────────────────────────────────────────────────────────

function getLogPath(projectPath) {
  return path.join(projectPath, 'meta', 'cost-log.jsonl');
}

/**
 * Provider 호출 기록
 */
export function logCall({
  provider, model, task, chapter = null,
  tokensEst = 0, durationMs = 0, projectPath
}) {
  if (!projectPath) return;

  const entry = {
    timestamp: new Date().toISOString(),
    provider,
    model,
    task,
    chapter,
    tokens_est: tokensEst,
    cost_est_usd: estimateCost(provider, model, tokensEst),
    duration_ms: durationMs
  };

  const logPath = getLogPath(projectPath);
  const dir = path.dirname(logPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8');
}

function estimateCost(provider, model, tokens) {
  const key = `${provider}:${model}`;
  const costPer1K = TOKEN_COSTS[key] || 0.01;
  return Math.round((tokens / 1000) * costPer1K * 10000) / 10000;
}

// ─── Summary Functions ───────────────────────────────────────────────────────

/**
 * 비용 요약 조회
 */
export function getSummary(projectPath, since = null) {
  const logPath = getLogPath(projectPath);
  if (!fs.existsSync(logPath)) {
    return { entries: 0, providers: {}, totalCost: 0, totalTokens: 0 };
  }

  const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
  const entries = lines.map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);

  const filtered = since
    ? entries.filter(e => e.timestamp >= since)
    : entries;

  const providers = {};
  let totalCost = 0;
  let totalTokens = 0;

  for (const entry of filtered) {
    const key = `${entry.provider}:${entry.model}`;
    if (!providers[key]) {
      providers[key] = { calls: 0, tokens: 0, cost: 0 };
    }
    providers[key].calls++;
    providers[key].tokens += entry.tokens_est || 0;
    providers[key].cost += entry.cost_est_usd || 0;
    totalCost += entry.cost_est_usd || 0;
    totalTokens += entry.tokens_est || 0;
  }

  // Claude 전용 비용 추정 (비교용)
  const allClaudeCost = (totalTokens / 1000) * TOKEN_COSTS['claude:opus'];

  return {
    entries: filtered.length,
    providers,
    totalCost: Math.round(totalCost * 100) / 100,
    totalTokens,
    allClaudeEstimate: Math.round(allClaudeCost * 100) / 100,
    savings: Math.round((allClaudeCost - totalCost) * 100) / 100,
    savingsPercent: allClaudeCost > 0 ? Math.round((1 - totalCost / allClaudeCost) * 100) : 0
  };
}

/**
 * 포맷된 요약 문자열
 */
export function formatSummary(summary) {
  const lines = [`=== Provider Usage ===`];

  for (const [key, data] of Object.entries(summary.providers)) {
    lines.push(`  ${key}: ${data.calls} calls, ~${Math.round(data.tokens / 1000)}K tokens, ~$${data.cost.toFixed(2)}`);
  }

  lines.push(`---`);
  lines.push(`Total: ~$${summary.totalCost.toFixed(2)} | ${summary.entries} calls | ~${Math.round(summary.totalTokens / 1000)}K tokens`);

  if (summary.savings > 0) {
    lines.push(`Claude 전용 대비 절감: ~$${summary.savings.toFixed(2)} (${summary.savingsPercent}%)`);
  }

  return lines.join('\n');
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--project' && process.argv[i + 1]) args.project = process.argv[++i];
    else if (process.argv[i] === '--since' && process.argv[i + 1]) args.since = process.argv[++i];
  }

  if (!args.project) {
    console.error('Usage: node cost-tracker.mjs --project <PATH> [--since YYYY-MM-DD]');
    process.exit(1);
  }

  const summary = getSummary(path.resolve(args.project), args.since);
  console.log(formatSummary(summary));
  console.log('\n' + JSON.stringify(summary, null, 2));
}
