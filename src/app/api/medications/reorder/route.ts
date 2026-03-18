import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { z } from 'zod';

const reorderSchema = z.object({
  medicationIds: z.array(z.string().min(1).max(50)).min(1).max(100),
});

export async function PUT(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medications-reorder:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const parsed = reorderSchema.safeParse(jsonResult.data);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { medicationIds } = parsed.data;

    const medications = await prisma.medication.findMany({
      where: { id: { in: medicationIds }, userId },
      select: { id: true },
    });

    const ownedIds = new Set(medications.map((m) => m.id));
    const allOwned = medicationIds.every((id) => ownedIds.has(id));
    if (!allOwned) return errorResponse('権限がありません', 403);

    await prisma.$transaction(
      medicationIds.map((id, index) =>
        prisma.medication.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    return success({ message: '並び順を更新しました' });
  })();
}
