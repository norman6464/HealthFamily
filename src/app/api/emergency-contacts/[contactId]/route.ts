import { prisma } from '@/lib/prisma';
import { updateEmergencyContactSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

const findContact = (id: string) => prisma.emergencyContact.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ contactId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`emergency-contacts-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const { contactId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: contactId,
      finder: findContact,
      resourceName: '緊急連絡先',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
        if ('error' in jsonResult) return jsonResult.error;
        const body = jsonResult.data;
        const parsed = updateEmergencyContactSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const updated = await prisma.emergencyContact.update({
          where: { id: contactId },
          data: {
            contactName: parsed.data.contactName,
            phoneNumber: parsed.data.phoneNumber,
            relationship: parsed.data.relationship,
            notes: parsed.data.notes,
          },
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ contactId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`emergency-contacts-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { contactId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: contactId,
      finder: findContact,
      resourceName: '緊急連絡先',
      handler: async () => {
        await prisma.emergencyContact.delete({ where: { id: contactId } });
        return success({ message: '削除しました' });
      },
    });
  })();
}
