import { Router } from 'express';
import { PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, notFound, error } from '../../shared/response.js';
import { getUserId } from '../../shared/auth.js';
import { pickAllowedFields } from '../../shared/validation.js';
import { logger } from '../../shared/logger.js';

const ALLOWED_SCHEDULE_FIELDS = [
  'medicationId', 'memberId', 'scheduledTime', 'daysOfWeek',
  'isEnabled', 'reminderMinutesBefore',
];

export const schedulesRouter = Router();

// スケジュール一覧取得
schedulesRouter.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.SCHEDULES,
      IndexName: 'UserSchedules-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    return success(res, result.Items || []);
  } catch (err) {
    logger.error('スケジュール一覧取得に失敗', err);
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// スケジュール登録
schedulesRouter.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const fields = pickAllowedFields(req.body, ALLOWED_SCHEDULE_FIELDS);

    const item = {
      scheduleId: ulid(),
      userId,
      isEnabled: true,
      reminderMinutesBefore: 5,
      ...fields,
      createdAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.SCHEDULES,
      Item: item,
    }));
    return created(res, item);
  } catch (err) {
    logger.error('スケジュール登録に失敗', err);
    return error(res, '登録に失敗しました', 500);
  }
});

// スケジュール更新（所有権チェック付き）
schedulesRouter.put('/:scheduleId', async (req, res) => {
  try {
    const userId = getUserId(req);

    // 所有権チェック
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.SCHEDULES,
      Key: { scheduleId: req.params.scheduleId },
    }));
    if (!existing.Item || existing.Item.userId !== userId) {
      return notFound(res, 'スケジュール');
    }

    const { scheduledTime, daysOfWeek, isEnabled, reminderMinutesBefore } = req.body;
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.SCHEDULES,
      Key: { scheduleId: req.params.scheduleId },
      UpdateExpression: 'SET scheduledTime = :time, daysOfWeek = :days, isEnabled = :enabled, reminderMinutesBefore = :mins',
      ExpressionAttributeValues: {
        ':time': scheduledTime,
        ':days': daysOfWeek,
        ':enabled': isEnabled,
        ':mins': reminderMinutesBefore,
      },
      ReturnValues: 'ALL_NEW',
    }));
    return success(res, result.Attributes);
  } catch (err) {
    logger.error('スケジュール更新に失敗', err);
    return error(res, '更新に失敗しました', 500);
  }
});

// スケジュール削除（所有権チェック付き）
schedulesRouter.delete('/:scheduleId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.SCHEDULES,
      Key: { scheduleId: req.params.scheduleId },
    }));
    if (!existing.Item || existing.Item.userId !== userId) {
      return notFound(res, 'スケジュール');
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.SCHEDULES,
      Key: { scheduleId: req.params.scheduleId },
    }));
    return success(res, { message: '削除しました' });
  } catch (err) {
    logger.error('スケジュール削除に失敗', err);
    return error(res, '削除に失敗しました', 500);
  }
});
