import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createLogger } from '../../src/utils/logger.js';

describe('createLogger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('prefixes module name to warn messages', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger('loader');
    logger.warn('file not found');
    expect(spy).toHaveBeenCalledWith('[loader]', '⚠', 'file not found');
  });

  test('prefixes module name to error messages', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger('backup');
    logger.error('backup failed', { path: '/tmp' });
    expect(spy).toHaveBeenCalledWith('[backup]', '✗', 'backup failed', { path: '/tmp' });
  });

  test('debug uses console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const logger = createLogger('lock');
    logger.debug('lock released');
    expect(spy).toHaveBeenCalledWith('[lock]', 'lock released');
  });

  test('info uses console.error (stderr)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger('test');
    logger.info('loading context');
    expect(spy).toHaveBeenCalledWith('[test]', 'loading context');
  });
});
