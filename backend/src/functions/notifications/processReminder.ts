import type { ScheduledEvent, Context } from 'aws-lambda';

export const handler = async (_event: ScheduledEvent, _context: Context) => {
  console.log('processReminder: 服薬リマインダー処理を実行');
  // TODO: DynamoDB からスケジュールを取得し、SNS で通知を送信
  return { statusCode: 200, body: 'OK' };
};
