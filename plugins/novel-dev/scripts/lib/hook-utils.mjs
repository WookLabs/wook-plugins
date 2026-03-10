#!/usr/bin/env node

/**
 * Hook Utilities - novel-dev 공유 hook 유틸리티
 * 모든 hook 스크립트에서 공통으로 사용하는 함수들
 */

/**
 * 안전한 stdin 읽기 (타임아웃 포함)
 * @param {number} timeoutMs - 타임아웃 밀리초 (기본 3000)
 * @returns {Promise<string>}
 */
export async function readStdinSafe(timeoutMs = 3000) {
  return new Promise((resolve) => {
    const chunks = [];
    const timer = setTimeout(() => {
      process.stdin.destroy();
      resolve(Buffer.concat(chunks).toString('utf-8'));
    }, timeoutMs);

    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve('');
    });
  });
}

/**
 * Hook 입력 파싱 (JSON + directory/cwd fallback)
 * @param {string} raw - stdin에서 읽은 raw 문자열
 * @returns {{ data: object, directory: string }}
 */
export function parseHookInput(raw) {
  let data = {};
  try { data = JSON.parse(raw); } catch {}
  const directory = data.directory || data.cwd || process.cwd();
  return { data, directory };
}

/**
 * 승인 출력
 */
export function outputApprove(extra = {}) {
  return { decision: "approve", ...extra };
}

/**
 * 차단 출력
 */
export function outputBlock(reason, extra = {}) {
  return { decision: "block", reason, ...extra };
}

/**
 * 컨텍스트 주입 출력
 */
export function outputContext(hookEventName, additionalContext) {
  return {
    decision: "approve",
    hookSpecificOutput: { hookEventName, additionalContext }
  };
}

/**
 * 서브에이전트 세션 감지
 */
export function isSubagentSession(data) {
  if (data.session_type === 'subagent') return true;
  if (process.env.CLAUDE_AGENT_SESSION) return true;
  if (data.metadata?.isSubagent) return true;
  return false;
}

/**
 * 프롬프트 추출 (prompt/content/text)
 */
export function extractPrompt(input) {
  try {
    const data = typeof input === 'string' ? JSON.parse(input) : input;
    if (data.prompt) return data.prompt;
    if (data.message?.content) return data.message.content;
    if (Array.isArray(data.parts)) {
      return data.parts.filter(p => p.type === 'text').map(p => p.text).join(' ');
    }
    return '';
  } catch {
    const raw = typeof input === 'string' ? input : '';
    const match = raw.match(/"(?:prompt|content|text)"\s*:\s*"([^"]+)"/);
    return match ? match[1] : '';
  }
}

/**
 * 코드 블록 제거
 */
export function removeCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
}
