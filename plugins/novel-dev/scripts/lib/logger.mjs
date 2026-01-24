#!/usr/bin/env node

/**
 * Novel-Sisyphus Unified Logging System
 *
 * Features:
 * - Log levels: DEBUG, INFO, WARN, ERROR
 * - Structured JSON output for machine parsing
 * - Human-readable console output
 * - File rotation (daily)
 * - Contextual tagging (script name, chapter, phase)
 */

import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join, basename } from 'path';

// Log levels
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Default configuration
const DEFAULT_CONFIG = {
  level: LogLevel.INFO,
  console: true,
  file: true,
  maxFiles: 7,  // Keep 7 days of logs
  logDir: null  // Will be set based on project path
};

// Current logger state
let config = { ...DEFAULT_CONFIG };
let currentLogFile = null;
let currentLogDate = null;

/**
 * Initialize the logger with project path
 * @param {string} projectPath - Path to novel project or workspace
 * @param {object} options - Configuration overrides
 */
export function initLogger(projectPath, options = {}) {
  // Find .sisyphus directory (workspace level) or create in project
  let logDir;

  // Check workspace level first
  const workspaceLog = join(projectPath, '..', '..', '.sisyphus', 'logs');
  const projectLog = join(projectPath, '.sisyphus', 'logs');

  if (existsSync(join(projectPath, '..', '..', '.sisyphus'))) {
    logDir = workspaceLog;
  } else {
    logDir = projectLog;
  }

  config = {
    ...DEFAULT_CONFIG,
    ...options,
    logDir
  };

  // Ensure log directory exists
  if (config.file && !existsSync(config.logDir)) {
    mkdirSync(config.logDir, { recursive: true });
  }

  // Rotate old logs
  if (config.file) {
    rotateLogFiles();
  }

  return config;
}

/**
 * Get today's log file path
 */
function getLogFilePath() {
  const today = new Date().toISOString().split('T')[0];

  if (currentLogDate !== today) {
    currentLogDate = today;
    currentLogFile = join(config.logDir, `novel-sisyphus-${today}.log`);
  }

  return currentLogFile;
}

/**
 * Rotate old log files (keep only maxFiles)
 */
function rotateLogFiles() {
  if (!config.logDir || !existsSync(config.logDir)) return;

  try {
    const files = readdirSync(config.logDir)
      .filter(f => f.startsWith('novel-sisyphus-') && f.endsWith('.log'))
      .sort()
      .reverse();

    // Remove excess files
    for (let i = config.maxFiles; i < files.length; i++) {
      const filePath = join(config.logDir, files[i]);
      try {
        unlinkSync(filePath);
      } catch {
        // Ignore deletion errors
      }
    }
  } catch {
    // Ignore rotation errors
  }
}

/**
 * Format log entry for console
 */
function formatConsole(level, message, context) {
  const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const levelColors = ['\x1b[90m', '\x1b[36m', '\x1b[33m', '\x1b[31m'];
  const reset = '\x1b[0m';

  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const levelStr = levelNames[level].padEnd(5);
  const color = levelColors[level];

  let output = `${color}[${timestamp}] [${levelStr}]${reset}`;

  if (context?.script) {
    output += ` [${context.script}]`;
  }

  if (context?.chapter) {
    output += ` [Ch.${context.chapter}]`;
  }

  output += ` ${message}`;

  return output;
}

/**
 * Format log entry for file (JSON)
 */
function formatFile(level, message, context) {
  const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: levelNames[level],
    message,
    ...context
  });
}

/**
 * Internal log function
 */
function log(level, message, context = {}) {
  // Check level threshold
  if (level < config.level) return;

  // Console output
  if (config.console) {
    const consoleOutput = formatConsole(level, message, context);

    if (level >= LogLevel.ERROR) {
      console.error(consoleOutput);
    } else if (level >= LogLevel.WARN) {
      console.warn(consoleOutput);
    } else {
      console.log(consoleOutput);
    }
  }

  // File output
  if (config.file && config.logDir) {
    try {
      const filePath = getLogFilePath();
      const fileOutput = formatFile(level, message, context);
      appendFileSync(filePath, fileOutput + '\n');
    } catch {
      // Silently ignore file write errors
    }
  }
}

/**
 * Create a logger instance with preset context
 * @param {string} scriptName - Name of the calling script
 * @returns {object} Logger instance with debug/info/warn/error methods
 */
export function createLogger(scriptName) {
  const script = scriptName || basename(process.argv[1] || 'unknown', '.mjs');

  return {
    debug: (msg, ctx = {}) => log(LogLevel.DEBUG, msg, { script, ...ctx }),
    info: (msg, ctx = {}) => log(LogLevel.INFO, msg, { script, ...ctx }),
    warn: (msg, ctx = {}) => log(LogLevel.WARN, msg, { script, ...ctx }),
    error: (msg, ctx = {}) => log(LogLevel.ERROR, msg, { script, ...ctx }),

    // Chainable context setters
    withChapter: (chapter) => {
      return {
        debug: (msg, ctx = {}) => log(LogLevel.DEBUG, msg, { script, chapter, ...ctx }),
        info: (msg, ctx = {}) => log(LogLevel.INFO, msg, { script, chapter, ...ctx }),
        warn: (msg, ctx = {}) => log(LogLevel.WARN, msg, { script, chapter, ...ctx }),
        error: (msg, ctx = {}) => log(LogLevel.ERROR, msg, { script, chapter, ...ctx })
      };
    },

    withPhase: (phase) => {
      return {
        debug: (msg, ctx = {}) => log(LogLevel.DEBUG, msg, { script, phase, ...ctx }),
        info: (msg, ctx = {}) => log(LogLevel.INFO, msg, { script, phase, ...ctx }),
        warn: (msg, ctx = {}) => log(LogLevel.WARN, msg, { script, phase, ...ctx }),
        error: (msg, ctx = {}) => log(LogLevel.ERROR, msg, { script, phase, ...ctx })
      };
    }
  };
}

/**
 * Quick logging functions (use default logger)
 */
export const debug = (msg, ctx = {}) => log(LogLevel.DEBUG, msg, ctx);
export const info = (msg, ctx = {}) => log(LogLevel.INFO, msg, ctx);
export const warn = (msg, ctx = {}) => log(LogLevel.WARN, msg, ctx);
export const error = (msg, ctx = {}) => log(LogLevel.ERROR, msg, ctx);

/**
 * Set log level dynamically
 */
export function setLogLevel(level) {
  if (typeof level === 'string') {
    config.level = LogLevel[level.toUpperCase()] ?? LogLevel.INFO;
  } else {
    config.level = level;
  }
}

/**
 * Get recent log entries from file
 * @param {number} count - Number of entries to retrieve
 * @returns {array} Recent log entries
 */
export function getRecentLogs(count = 50) {
  if (!config.logDir) return [];

  try {
    const logFile = getLogFilePath();
    if (!existsSync(logFile)) return [];

    const content = readFileSync(logFile, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    return lines.slice(-count).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });
  } catch {
    return [];
  }
}

/**
 * Get log statistics
 * @returns {object} Log statistics
 */
export function getLogStats() {
  if (!config.logDir || !existsSync(config.logDir)) {
    return { files: 0, totalSize: 0, errors: 0, warns: 0 };
  }

  try {
    const files = readdirSync(config.logDir)
      .filter(f => f.startsWith('novel-sisyphus-') && f.endsWith('.log'));

    let totalSize = 0;
    let errors = 0;
    let warns = 0;

    // Analyze today's log
    const todayLog = getLogFilePath();
    if (existsSync(todayLog)) {
      const content = readFileSync(todayLog, 'utf-8');
      const lines = content.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.level === 'ERROR') errors++;
          if (entry.level === 'WARN') warns++;
        } catch {}
      }
    }

    return {
      files: files.length,
      todayErrors: errors,
      todayWarns: warns,
      logDir: config.logDir
    };
  } catch {
    return { files: 0, todayErrors: 0, todayWarns: 0 };
  }
}

// Auto-initialize with workspace root if running directly
if (process.argv[1]?.endsWith('logger.mjs')) {
  initLogger(process.cwd());
  info('Logger initialized', { mode: 'standalone' });
}
