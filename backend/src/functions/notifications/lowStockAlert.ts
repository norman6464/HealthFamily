import type { ScheduledEvent, Context } from 'aws-lambda';

export const handler = async (_event: ScheduledEvent, _context: Context) => {
  console.log('lowStockAlert: 在庫不足アラート処理を実行');
  // TODO: お薬の残数を確認し、閾値以下の場合に SNS で通知
  return { statusCode: 200, body: 'OK' };
};
