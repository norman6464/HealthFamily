import { Router } from 'express';
import { PutCommand, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, notFound, error } from '../../shared/response.js';

export const membersRouter = Router();

// メンバー一覧取得
membersRouter.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.MEMBERS,
      IndexName: 'UserMembers-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    return success(res, result.Items || []);
  } catch (e) {
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// メンバー登録
membersRouter.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const now = new Date().toISOString();
    const item = {
      memberId: ulid(),
      userId,
      ...req.body,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.MEMBERS,
      Item: item,
    }));
    return created(res, item);
  } catch (e) {
    return error(res, '登録に失敗しました', 500);
  }
});

// メンバー詳細取得
membersRouter.get('/:memberId', async (req, res) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.MEMBERS,
      Key: { memberId: req.params.memberId },
    }));
    if (!result.Item) return notFound(res, 'メンバー');
    return success(res, result.Item);
  } catch (e) {
    return error(res, '取得に失敗しました', 500);
  }
});

// メンバー削除
membersRouter.delete('/:memberId', async (req, res) => {
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.MEMBERS,
      Key: { memberId: req.params.memberId },
    }));
    return success(res, { message: '削除しました' });
  } catch (e) {
    return error(res, '削除に失敗しました', 500);
  }
});
