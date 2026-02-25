import { Router } from 'express';
import { PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, notFound, error } from '../../shared/response.js';
import { getUserId } from '../../shared/auth.js';
import { validate } from '../../shared/validation.js';
import { logger } from '../../shared/logger.js';
import { createMedicationSchema, updateStockSchema } from '../../shared/schemas.js';

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
  } catch (err) {
    logger.error('お薬一覧取得に失敗', err);
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// お薬登録
medicationsRouter.post('/', validate(createMedicationSchema), async (req, res) => {
  try {
    const userId = getUserId(req);
    const fields = req.body;

    const now = new Date().toISOString();
    const item = {
      medicationId: ulid(),
      userId,
      isActive: true,
      ...fields,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      Item: item,
    }));
    return created(res, item);
  } catch (err) {
    logger.error('お薬登録に失敗', err);
    return error(res, '登録に失敗しました', 500);
  }
});

// お薬詳細取得（所有権チェック付き）
medicationsRouter.get('/:medicationId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      Key: { medicationId: req.params.medicationId },
    }));
    if (!result.Item) return notFound(res, 'お薬');
    if (result.Item.userId !== userId) return notFound(res, 'お薬');
    return success(res, result.Item);
  } catch (err) {
    logger.error('お薬詳細取得に失敗', err);
    return error(res, '取得に失敗しました', 500);
  }
});

// 残数更新（所有権チェック付き）
medicationsRouter.put('/:medicationId/stock', validate(updateStockSchema), async (req, res) => {
  try {
    const userId = getUserId(req);
    const { stockQuantity } = req.body;

    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      Key: { medicationId: req.params.medicationId },
    }));
    if (!existing.Item || existing.Item.userId !== userId) {
      return notFound(res, 'お薬');
    }

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
  } catch (err) {
    logger.error('お薬在庫更新に失敗', err);
    return error(res, '更新に失敗しました', 500);
  }
});

// お薬削除（所有権チェック付き）
medicationsRouter.delete('/:medicationId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      Key: { medicationId: req.params.medicationId },
    }));
    if (!existing.Item || existing.Item.userId !== userId) {
      return notFound(res, 'お薬');
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.MEDICATIONS,
      Key: { medicationId: req.params.medicationId },
    }));
    return success(res, { message: '削除しました' });
  } catch (err) {
    logger.error('お薬削除に失敗', err);
    return error(res, '削除に失敗しました', 500);
  }
});
