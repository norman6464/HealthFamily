import { Router } from 'express';
import { PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, notFound, error } from '../../shared/response.js';

export const medicationsRouter = Router();

// メンバーのお薬一覧取得
medicationsRouter.get('/member/:memberId', async (req, res) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      IndexName: 'MemberMedications-index',
      KeyConditionExpression: 'memberId = :memberId',
      ExpressionAttributeValues: { ':memberId': req.params.memberId },
    }));
    return success(res, result.Items || []);
  } catch {
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// お薬登録
medicationsRouter.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const now = new Date().toISOString();
    const item = {
      medicationId: ulid(),
      userId,
      isActive: true,
      ...req.body,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      Item: item,
    }));
    return created(res, item);
  } catch {
    return error(res, '登録に失敗しました', 500);
  }
});

// お薬詳細取得
medicationsRouter.get('/:medicationId', async (req, res) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      Key: { medicationId: req.params.medicationId },
    }));
    if (!result.Item) return notFound(res, 'お薬');
    return success(res, result.Item);
  } catch {
    return error(res, '取得に失敗しました', 500);
  }
});

// 残数更新
medicationsRouter.put('/:medicationId/stock', async (req, res) => {
  try {
    const { stockQuantity } = req.body;
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      Key: { medicationId: req.params.medicationId },
      UpdateExpression: 'SET stockQuantity = :qty, updatedAt = :now',
      ExpressionAttributeValues: {
        ':qty': stockQuantity,
        ':now': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }));
    return success(res, result.Attributes);
  } catch {
    return error(res, '更新に失敗しました', 500);
  }
});

// お薬削除
medicationsRouter.delete('/:medicationId', async (req, res) => {
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      Key: { medicationId: req.params.medicationId },
    }));
    return success(res, { message: '削除しました' });
  } catch {
    return error(res, '削除に失敗しました', 500);
  }
});
