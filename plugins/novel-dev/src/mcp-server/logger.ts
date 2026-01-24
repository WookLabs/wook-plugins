/**
 * MCP Server Logger
 *
 * stderr로 로그 출력 (MCP 프로토콜은 stdout 사용)
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const VALID_LOG_LEVELS: readonly LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

function parseLogLevel(envValue: string | undefined): LogLevel {
  if (envValue && VALID_LOG_LEVELS.includes(envValue as LogLevel)) {
    return envValue as LogLevel;
  }
  return 'INFO';
}

const LOG_LEVEL: LogLevel = parseLogLevel(process.env.MCP_LOG_LEVEL);

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];
}

export function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  console.error(`[${timestamp}] [${level}] ${message}${dataStr}`);
}

export function logToolCall(
  tool: string,
  params: Record<string, unknown>,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  log('INFO', `MCP Tool: ${tool}`, { params, duration_ms: duration });
}

export function logError(tool: string, error: Error): void {
  log('ERROR', `MCP Tool Error: ${tool}`, {
    message: error.message,
    stack: error.stack?.split('\n').slice(0, 3).join(' ')
  });
}
