import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sendEmail, emailTemplates } from '@/lib/email';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';

const sendNotificationSchema = z.object({
  type: z.enum(['medication_reminder', 'missed_medication', 'appointment_reminder', 'low_stock']),
  memberId: z.string().trim().min(1).max(50),
  medicationId: z.string().trim().min(1).max(50).optional(),
  appointmentId: z.string().trim().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const rateLimit = checkRateLimit(`notification:${userId}`, { maxAttempts: 10, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return errorResponse('通知の送信回数が上限に達しました。しばらくしてから再試行してください。', 429);
    }

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = sendNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('リクエストの形式が不正です');
    }

    const { type, memberId, medicationId, appointmentId } = parsed.data;

    const container = createServerDIContainer(userId);

    const userProfile = await container.userProfileRepository.getProfile();

    const member = await container.memberRepository.getMemberById(memberId);
    if (!member) {
      return errorResponse('メンバーが見つかりません', 404);
    }

    switch (type) {
      case 'medication_reminder':
      case 'missed_medication': {
        if (!medicationId) {
          return errorResponse('薬IDは必須です');
        }
        const medication = await container.medicationRepository.getMedicationById(medicationId);
        if (!medication) {
          return errorResponse('薬が見つかりません', 404);
        }
        const template = type === 'medication_reminder'
          ? emailTemplates.medicationReminder({
              memberName: member.name,
              medicationName: medication.name,
              scheduledTime: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            })
          : emailTemplates.missedMedication({
              memberName: member.name,
              medicationName: medication.name,
              scheduledTime: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            });
        await sendEmail({ to: userProfile.email, ...template });
        break;
      }

      case 'appointment_reminder': {
        if (!appointmentId) {
          return errorResponse('予約IDは必須です');
        }
        const appointment = await container.appointmentRepository.getAppointmentById(appointmentId);
        if (!appointment) {
          return errorResponse('予約が見つかりません', 404);
        }
        const template = emailTemplates.appointmentReminder({
          memberName: member.name,
          hospitalName: appointment.hospitalName ?? '未設定',
          appointmentDate: appointment.appointmentDate.toLocaleDateString('ja-JP'),
          description: appointment.description,
        });
        await sendEmail({ to: userProfile.email, ...template });
        break;
      }

      case 'low_stock': {
        if (!medicationId) {
          return errorResponse('薬IDは必須です');
        }
        const medication = await container.medicationRepository.getMedicationById(medicationId);
        if (!medication) {
          return errorResponse('薬が見つかりません', 404);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alertDate = medication.stockAlertDate
          ? new Date(medication.stockAlertDate).toLocaleDateString('ja-JP')
          : '未設定';
        const daysUntilAlert = medication.stockAlertDate
          ? Math.ceil((new Date(medication.stockAlertDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        const template = emailTemplates.lowStockAlert({
          memberName: member.name,
          medicationName: medication.name,
          currentStock: medication.stockQuantity ?? 0,
          alertDate,
          daysUntilAlert,
        });
        await sendEmail({ to: userProfile.email, ...template });
        break;
      }
    }

    return success({ message: '通知を送信しました' });
  })();
}
