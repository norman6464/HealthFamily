import { Router } from 'express';
import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, notFound, error } from '../../shared/response.js';
import { getUserId, getUserEmail } from '../../shared/auth.js';
import { validate } from '../../shared/validation.js';
import { logger } from '../../shared/logger.js';
import { createUserProfileSchema, updateUserProfileSchema } from '../../shared/schemas.js';

export const usersRouter = Router();

// 自分のプロフィール取得
usersRouter.get('/me', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { userId },
    }));
    if (!result.Item) return notFound(res, 'ユーザー');
    return success(res, result.Item);
  } catch (err) {
    logger.error('プロフィール取得に失敗', err);
    return error(res, '取得に失敗しました', 500);
  }
});

// プロフィール作成（初回ログイン時）
usersRouter.post('/me', validate(createUserProfileSchema), async (req, res) => {
  try {
    const userId = getUserId(req);
    const email = getUserEmail(req);

    // 既に存在する場合はそのまま返す
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { userId },
    }));
    if (existing.Item) {
      return success(res, existing.Item);
    }

    const now = new Date().toISOString();
    const item = {
      userId,
      email,
      displayName: req.body.displayName,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.USERS,
      Item: item,
    }));
    return created(res, item);
  } catch (err) {
    logger.error('プロフィール作成に失敗', err);
    return error(res, '作成に失敗しました', 500);
  }
});

// プロフィール更新
usersRouter.put('/me', validate(updateUserProfileSchema), async (req, res) => {
  try {
    const userId = getUserId(req);
    const fields = req.body;
    const now = new Date().toISOString();

    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionValues: Record<string, unknown> = { ':updatedAt': now };

    if (fields.displayName !== undefined) {
      updateExpressions.push('#displayName = :displayName');
      expressionNames['#displayName'] = 'displayName';
      expressionValues[':displayName'] = fields.displayName;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    }));

    return success(res, result.Attributes);
  } catch (err) {
    logger.error('プロフィール更新に失敗', err);
    return error(res, '更新に失敗しました', 500);
  }
});
