import { Schedule } from '../../domain/entities/Schedule';
import { TodayScheduleItem } from '../../domain/repositories/ScheduleRepository';
import { apiClient } from './apiClient';
import { BackendSchedule, BackendMember, BackendMedication, BackendRecord } from './types';
import { toSchedule } from './mappers';

export const scheduleApi = {
  async getTodaySchedules(_userId: string, _date: Date): Promise<TodayScheduleItem[]> {
    const [schedules, members, records] = await Promise.all([
      apiClient.get<BackendSchedule[]>('/schedules'),
      apiClient.get<BackendMember[]>('/members'),
      apiClient.get<BackendRecord[]>('/records'),
    ]);

    const memberMap = new Map(members.map((m) => [m.id, m]));
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRecords = records.filter((r) => r.takenAt.slice(0, 10) === todayStr);
    const todayRecordScheduleIds = new Set(
      todayRecords.map((r) => r.scheduleId).filter(Boolean)
    );
    const todayRecordMedicationIds = new Set(
      todayRecords.map((r) => r.medicationId).filter(Boolean)
    );

    const medicationIds = [...new Set(schedules.map((s) => s.medicationId))];
    const medications = await Promise.all(
      medicationIds.map((id) =>
        apiClient.get<BackendMedication>(`/medications/${id}`).catch(() => null)
      )
    );
    const medMap = new Map(
      medications.filter(Boolean).map((m) => [m!.id, m!])
    );

    return schedules
      .filter((s) => s.isEnabled !== false && medMap.has(s.medicationId))
      .map((s) => {
        const member = memberMap.get(s.memberId);
        const med = medMap.get(s.medicationId)!;
        return {
          schedule: toSchedule(s),
          medicationName: med.name,
          memberName: member?.name || '',
          memberType: (member?.memberType as 'human' | 'pet') || 'human',
          isCompleted: todayRecordScheduleIds.has(s.id) || todayRecordMedicationIds.has(s.medicationId),
        };
      });
  },

  async createSchedule(
    schedule: Omit<Schedule, 'id' | 'createdAt'>
  ): Promise<Schedule> {
    const data = await apiClient.post<BackendSchedule>('/schedules', {
      medicationId: schedule.medicationId,
      memberId: schedule.memberId,
      scheduledTime: schedule.scheduledTime,
      daysOfWeek: [...schedule.daysOfWeek],
      isEnabled: schedule.isEnabled,
      reminderMinutesBefore: schedule.reminderMinutesBefore,
    });
    return toSchedule(data);
  },

  async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<Schedule> {
    const body: Record<string, unknown> = {};
    if (schedule.scheduledTime !== undefined) body.scheduledTime = schedule.scheduledTime;
    if (schedule.daysOfWeek !== undefined) body.daysOfWeek = [...schedule.daysOfWeek];
    if (schedule.isEnabled !== undefined) body.isEnabled = schedule.isEnabled;
    if (schedule.reminderMinutesBefore !== undefined) body.reminderMinutesBefore = schedule.reminderMinutesBefore;

    const data = await apiClient.put<BackendSchedule>(`/schedules/${id}`, body);
    return toSchedule(data);
  },

  async deleteSchedule(id: string): Promise<void> {
    await apiClient.del(`/schedules/${id}`);
  },

  async markAsCompleted(scheduleId: string, _completedAt: Date): Promise<void> {
    const scheduleData = await apiClient.get<BackendSchedule>(`/schedules/${scheduleId}`).catch(() => null);
    if (!scheduleData) return;

    await apiClient.post('/records', {
      memberId: scheduleData.memberId,
      medicationId: scheduleData.medicationId,
      scheduleId,
    });
  },
};
