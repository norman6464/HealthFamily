import { Router } from 'express';
import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, TABLE_NAMES } from '../../shared/dynamodb.js';
import { success, created, error } from '../../shared/response.js';

export const schedulesRouter = Router();

// スケジュール一覧取得
schedulesRouter.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAMES.SCHEDULES,
      IndexName: 'UserSchedules-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    return success(res, result.Items || []);
  } catch (e) {
    return error(res, '一覧取得に失敗しました', 500);
  }
});

// スケジュール登録
schedulesRouter.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const item = {
      scheduleId: ulid(),
      userId,
      isEnabled: true,
      reminderMinutesBefore: 5,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.SCHEDULES,
      Item: item,
    }));
    return created(res, item);
  } catch (e) {
    return error(res, '登録に失敗しました', 500);
  }
});

// スケジュール更新
schedulesRouter.put('/:scheduleId', async (req, res) => {
  try {
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
  } catch (e) {
    return error(res, '更新に失敗しました', 500);
  }
});

// スケジュール削除
schedulesRouter.delete('/:scheduleId', async (req, res) => {
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.SCHEDULES,
      Key: { scheduleId: req.params.scheduleId },
    }));
    return success(res, { message: '削除しました' });
  } catch (e) {
    return error(res, '削除に失敗しました', 500);
  }
});
