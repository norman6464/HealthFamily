import { Router } from 'express';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, error } from '../../shared/response.js';

export const recordsRouter = Router();

// 服薬記録登録
recordsRouter.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const item = {
      recordId: ulid(),
      userId,
      takenAt: new Date().toISOString(),
      ...req.body,
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.MEDICATION_RECORDS,
      Item: item,
    }));
    return created(res, item);
  } catch {
    return error(res, '記録に失敗しました', 500);
  }
});

// 服薬記録一覧取得
recordsRouter.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.MEDICATION_RECORDS,
      IndexName: 'UserDailyRecords-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
      Limit: 50,
    }));
    return success(res, result.Items || []);
  } catch {
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// メンバー別服薬記録
recordsRouter.get('/member/:memberId', async (req, res) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.MEDICATION_RECORDS,
      IndexName: 'MemberRecords-index',
      KeyConditionExpression: 'memberId = :memberId',
      ExpressionAttributeValues: { ':memberId': req.params.memberId },
      ScanIndexForward: false,
      Limit: 50,
    }));
    return success(res, result.Items || []);
  } catch {
    return error(res, '取得に失敗しました', 500);
  }
});
