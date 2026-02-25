import { Router } from 'express';
import { PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, notFound, error } from '../../shared/response.js';
import { getUserId } from '../../shared/auth.js';
import { validate } from '../../shared/validation.js';
import { logger } from '../../shared/logger.js';
import { createAppointmentSchema, updateAppointmentSchema } from '../../shared/schemas.js';

export const appointmentsRouter = Router();

// 予約一覧取得
appointmentsRouter.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.APPOINTMENTS,
      IndexName: 'UserAppointments-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: true,
    }));
    return success(res, result.Items || []);
  } catch (err) {
    logger.error('予約一覧取得に失敗', err);
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// 予約登録
appointmentsRouter.post('/', validate(createAppointmentSchema), async (req, res) => {
  try {
    const userId = getUserId(req);
    const fields = req.body;

    const item = {
      appointmentId: ulid(),
      userId,
      reminderEnabled: true,
      reminderDaysBefore: 1,
      ...fields,
      createdAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.APPOINTMENTS,
      Item: item,
    }));
    return created(res, item);
  } catch (err) {
    logger.error('予約登録に失敗', err);
    return error(res, '登録に失敗しました', 500);
  }
});

// 予約更新（所有権チェック + フィールド制限）
appointmentsRouter.put('/:appointmentId', validate(updateAppointmentSchema), async (req, res) => {
  try {
    const userId = getUserId(req);

    // 所有権チェック
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.APPOINTMENTS,
      Key: { appointmentId: req.params.appointmentId },
    }));
    if (!existing.Item || existing.Item.userId !== userId) {
      return notFound(res, '予約');
    }

    const fields = req.body;
    const updateExpressions: string[] = [];
    const expressionValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(fields)) {
      updateExpressions.push(`#${key} = :${key}`);
      expressionValues[`:${key}`] = value;
    }

    const expressionNames: Record<string, string> = {};
    for (const key of Object.keys(fields)) {
      expressionNames[`#${key}`] = key;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.APPOINTMENTS,
      Key: { appointmentId: req.params.appointmentId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    }));
    return success(res, result.Attributes);
  } catch (err) {
    logger.error('予約更新に失敗', err);
    return error(res, '更新に失敗しました', 500);
  }
});

// 予約削除（所有権チェック付き）
appointmentsRouter.delete('/:appointmentId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.APPOINTMENTS,
      Key: { appointmentId: req.params.appointmentId },
    }));
    if (!existing.Item || existing.Item.userId !== userId) {
      return notFound(res, '予約');
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.APPOINTMENTS,
      Key: { appointmentId: req.params.appointmentId },
    }));
    return success(res, { message: '削除しました' });
  } catch (err) {
    logger.error('予約削除に失敗', err);
    return error(res, '削除に失敗しました', 500);
  }
});
