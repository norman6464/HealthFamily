import { Router } from 'express';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, error } from '../../shared/response.js';
import { getUserId } from '../../shared/auth.js';
import { validate } from '../../shared/validation.js';
import { logger } from '../../shared/logger.js';
import { createRecordSchema } from '../../shared/schemas.js';

export const recordsRouter = Router();

// 服薬記録登録
recordsRouter.post('/', validate(createRecordSchema), async (req, res) => {
  try {
    const userId = getUserId(req);
    const fields = req.body;

    const item = {
      recordId: ulid(),
      userId,
      takenAt: new Date().toISOString(),
      ...fields,
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.MEDICATION_RECORDS,
      Item: item,
    }));
    return created(res, item);
  } catch (err) {
    logger.error('服薬記録登録に失敗', err);
    return error(res, '記録に失敗しました', 500);
  }
});

// 服薬記録一覧取得
recordsRouter.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.MEDICATION_RECORDS,
      IndexName: 'UserDailyRecords-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
      Limit: 50,
    }));
    return success(res, result.Items || []);
  } catch (err) {
    logger.error('服薬記録一覧取得に失敗', err);
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
  } catch (err) {
    logger.error('メンバー別服薬記録取得に失敗', err);
    return error(res, '取得に失敗しました', 500);
  }
});
