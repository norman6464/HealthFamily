import type { ScheduledEvent, Context } from 'aws-lambda';

export const handler = async (_event: ScheduledEvent, _context: Context) => {
  console.log('checkMissed: 飲み忘れチェック処理を実行');
  // TODO: 服薬記録を確認し、未服薬の場合に SNS で再通知
  return { statusCode: 200, body: 'OK' };
};
