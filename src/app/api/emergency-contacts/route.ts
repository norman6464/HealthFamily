import { prisma } from '@/lib/prisma';
import { createEmergencyContactSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetEmergencyContacts, CreateEmergencyContact } from '@/domain/usecases/ManageEmergencyContacts';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`emergency-contacts-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetEmergencyContacts(container.emergencyContactRepository);
  const contacts = await usecase.execute();
  return success(contacts);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`emergency-contacts-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createEmergencyContactSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const container = createServerDIContainer(userId);
    const usecase = new CreateEmergencyContact(container.emergencyContactRepository);
    const contact = await usecase.execute({
      memberId: parsed.data.memberId,
      contactName: parsed.data.contactName,
      phoneNumber: parsed.data.phoneNumber,
      relationship: parsed.data.relationship,
      notes: parsed.data.notes,
    });
    return created(contact);
  })();
}
