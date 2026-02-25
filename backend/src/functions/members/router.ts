import { Router } from 'express';
import { PutCommand, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, notFound, error } from '../../shared/response.js';
import { getUserId } from '../../shared/auth.js';
import { pickAllowedFields, isNonEmptyString } from '../../shared/validation.js';
import { logger } from '../../shared/logger.js';

const ALLOWED_MEMBER_FIELDS = ['name', 'memberType', 'petType', 'birthDate', 'notes'];

export const membersRouter = Router();

// メンバー一覧取得
membersRouter.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.MEMBERS,
      IndexName: 'UserMembers-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    return success(res, result.Items || []);
  } catch (err) {
    logger.error('メンバー一覧取得に失敗', err);
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// メンバー登録
membersRouter.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const fields = pickAllowedFields(req.body, ALLOWED_MEMBER_FIELDS);

    if (!isNonEmptyString(fields.name)) {
      return error(res, '名前は必須です', 400);
    }

    const now = new Date().toISOString();
    const item = {
      memberId: ulid(),
      userId,
      ...fields,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.MEMBERS,
      Item: item,
    }));
    return created(res, item);
  } catch (err) {
    logger.error('メンバー登録に失敗', err);
    return error(res, '登録に失敗しました', 500);
  }
});

// メンバー詳細取得（所有権チェック付き）
membersRouter.get('/:memberId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.MEMBERS,
      Key: { memberId: req.params.memberId },
    }));
    if (!result.Item) return notFound(res, 'メンバー');
    if (result.Item.userId !== userId) return notFound(res, 'メンバー');
    return success(res, result.Item);
  } catch (err) {
    logger.error('メンバー詳細取得に失敗', err);
    return error(res, '取得に失敗しました', 500);
  }
});

// メンバー削除（所有権チェック付き）
membersRouter.delete('/:memberId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.MEMBERS,
      Key: { memberId: req.params.memberId },
    }));
    if (!result.Item || result.Item.userId !== userId) {
      return notFound(res, 'メンバー');
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.MEMBERS,
      Key: { memberId: req.params.memberId },
    }));
    return success(res, { message: '削除しました' });
  } catch (err) {
    logger.error('メンバー削除に失敗', err);
    return error(res, '削除に失敗しました', 500);
  }
});
