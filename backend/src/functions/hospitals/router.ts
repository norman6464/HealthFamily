import { Router } from 'express';
import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, error } from '../../shared/response.js';

export const hospitalsRouter = Router();

// 病院一覧取得
hospitalsRouter.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      IndexName: 'UserHospitals-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    return success(res, result.Items || []);
  } catch {
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// 病院登録
hospitalsRouter.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const item = {
      hospitalId: ulid(),
      userId,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      Item: item,
    }));
    return created(res, item);
  } catch {
    return error(res, '登録に失敗しました', 500);
  }
});

// 病院更新
hospitalsRouter.put('/:hospitalId', async (req, res) => {
  try {
    const updateExpressions: string[] = [];
    const expressionValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(req.body)) {
      updateExpressions.push(`${key} = :${key}`);
      expressionValues[`:${key}`] = value;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      Key: { hospitalId: req.params.hospitalId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    }));
    return success(res, result.Attributes);
  } catch {
    return error(res, '更新に失敗しました', 500);
  }
});

// 病院削除
hospitalsRouter.delete('/:hospitalId', async (req, res) => {
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      Key: { hospitalId: req.params.hospitalId },
    }));
    return success(res, { message: '削除しました' });
  } catch {
    return error(res, '削除に失敗しました', 500);
  }
});
