import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('infoログをJSON形式で出力する', () => {
    logger.info('テストメッセージ', { key: 'value' });

    expect(console.log).toHaveBeenCalledOnce();
    const output = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.level).toBe('info');
    expect(output.message).toBe('テストメッセージ');
    expect(output.context.key).toBe('value');
    expect(output.timestamp).toBeDefined();
  });

  it('warnログをJSON形式で出力する', () => {
    logger.warn('警告メッセージ');

    expect(console.warn).toHaveBeenCalledOnce();
    const output = JSON.parse((console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.level).toBe('warn');
    expect(output.message).toBe('警告メッセージ');
  });

  it('errorログにErrorオブジェクトの情報を含める', () => {
    const err = new Error('テストエラー');
    logger.error('エラー発生', err, { userId: 'user-1' });

    expect(console.error).toHaveBeenCalledOnce();
    const output = JSON.parse((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.level).toBe('error');
    expect(output.message).toBe('エラー発生');
    expect(output.context.error.message).toBe('テストエラー');
    expect(output.context.error.stack).toBeDefined();
    expect(output.context.userId).toBe('user-1');
  });

  it('errorログに文字列エラーを含める', () => {
    logger.error('エラー発生', 'string error');

    const output = JSON.parse((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.context.error).toBe('string error');
  });
});
