import type { ScheduledEvent, Context } from 'aws-lambda';

export const handler = async (_event: ScheduledEvent, _context: Context) => {
  console.log('appointmentReminder: 通院リマインダー処理を実行');
  // TODO: 予約情報を確認し、前日・当日の場合に SNS で通知
  return { statusCode: 200, body: 'OK' };
};
