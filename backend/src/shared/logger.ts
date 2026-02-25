/**
 * シンプルなロガー
 * CloudWatch Logs等の外部サービスに将来置き換え可能
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

function createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const entry = createLogEntry('info', message, context);
    console.log(JSON.stringify(entry));
  },

  warn(message: string, context?: Record<string, unknown>) {
    const entry = createLogEntry('warn', message, context);
    console.warn(JSON.stringify(entry));
  },

  error(message: string, err?: unknown, context?: Record<string, unknown>) {
    const entry = createLogEntry('error', message, {
      ...context,
      error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
    });
    console.error(JSON.stringify(entry));
  },
};
