type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
}

export function createLogger(module: string): Logger {
  const prefix = `[${module}]`;

  return {
    debug: (msg, ...args) => console.debug(prefix, msg, ...args),
    info: (msg, ...args) => console.error(prefix, msg, ...args),
    warn: (msg, ...args) => console.error(prefix, '⚠', msg, ...args),
    error: (msg, ...args) => console.error(prefix, '✗', msg, ...args),
  };
}
