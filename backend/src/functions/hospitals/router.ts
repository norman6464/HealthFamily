import { Router } from 'express';
import { PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, notFound, error } from '../../shared/response.js';
import { getUserId } from '../../shared/auth.js';
import { pickAllowedFields, isNonEmptyString } from '../../shared/validation.js';
import { logger } from '../../shared/logger.js';

const ALLOWED_HOSPITAL_FIELDS = ['name', 'address', 'phone', 'type', 'notes', 'memberId'];
const ALLOWED_HOSPITAL_UPDATE_FIELDS = ['name', 'address', 'phone', 'type', 'notes'];

export const hospitalsRouter = Router();

// 病院一覧取得
hospitalsRouter.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      IndexName: 'UserHospitals-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    return success(res, result.Items || []);
  } catch (err) {
    logger.error('病院一覧取得に失敗', err);
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// 病院登録
hospitalsRouter.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const fields = pickAllowedFields(req.body, ALLOWED_HOSPITAL_FIELDS);

    if (!isNonEmptyString(fields.name)) {
      return error(res, '病院名は必須です', 400);
    }

    const item = {
      hospitalId: ulid(),
      userId,
      ...fields,
      createdAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      Item: item,
    }));
    return created(res, item);
  } catch (err) {
    logger.error('病院登録に失敗', err);
    return error(res, '登録に失敗しました', 500);
  }
});

// 病院更新（所有権チェック + フィールド制限）
hospitalsRouter.put('/:hospitalId', async (req, res) => {
  try {
    const userId = getUserId(req);

    // 所有権チェック
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      Key: { hospitalId: req.params.hospitalId },
    }));
    if (!existing.Item || existing.Item.userId !== userId) {
      return notFound(res, '病院');
    }

    // 許可フィールドのみ抽出
    const fields = pickAllowedFields(req.body, ALLOWED_HOSPITAL_UPDATE_FIELDS);
    const updateExpressions: string[] = [];
    const expressionValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(fields)) {
      updateExpressions.push(`#${key} = :${key}`);
      expressionValues[`:${key}`] = value;
    }

    if (updateExpressions.length === 0) {
      return error(res, '更新するフィールドがありません', 400);
    }

    const expressionNames: Record<string, string> = {};
    for (const key of Object.keys(fields)) {
      expressionNames[`#${key}`] = key;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      Key: { hospitalId: req.params.hospitalId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    }));
    return success(res, result.Attributes);
  } catch (err) {
    logger.error('病院更新に失敗', err);
    return error(res, '更新に失敗しました', 500);
  }
});

// 病院削除（所有権チェック付き）
hospitalsRouter.delete('/:hospitalId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      Key: { hospitalId: req.params.hospitalId },
    }));
    if (!existing.Item || existing.Item.userId !== userId) {
      return notFound(res, '病院');
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.HOSPITALS,
      Key: { hospitalId: req.params.hospitalId },
    }));
    return success(res, { message: '削除しました' });
  } catch (err) {
    logger.error('病院削除に失敗', err);
    return error(res, '削除に失敗しました', 500);
  }
});
