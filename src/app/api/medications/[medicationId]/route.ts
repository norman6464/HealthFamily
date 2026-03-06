import { prisma } from '@/lib/prisma';
import { updateMedicationSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

const findMedication = (id: string) => prisma.medication.findUnique({ where: { id } });

export async function GET(_request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  return withAuth(async (userId) => {
    const { medicationId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: medicationId,
      finder: findMedication,
      resourceName: 'お薬',
      handler: async (medication) => success(medication),
    });
  })();
}

export async function PUT(request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medications-put:${userId}`, { maxRequests: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { medicationId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: medicationId,
      finder: findMedication,
      resourceName: 'お薬',
      handler: async () => {
        const body = await request.json();
        const parsed = updateMedicationSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const data: Record<string, unknown> = {};
        if (parsed.data.name !== undefined) data.name = parsed.data.name;
        if (parsed.data.category !== undefined) data.category = parsed.data.category;
        if (parsed.data.dosageAmount !== undefined) data.dosageAmount = parsed.data.dosageAmount;
        if (parsed.data.frequency !== undefined) data.frequency = parsed.data.frequency;
        if (parsed.data.stockQuantity !== undefined) data.stockQuantity = parsed.data.stockQuantity;
        if (parsed.data.stockAlertDate !== undefined) {
          data.stockAlertDate = parsed.data.stockAlertDate ? new Date(parsed.data.stockAlertDate) : null;
        }
        if (parsed.data.instructions !== undefined) data.instructions = parsed.data.instructions;
        if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

        const updated = await prisma.medication.update({
          where: { id: medicationId },
          data,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medications-delete:${userId}`, { maxRequests: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { medicationId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: medicationId,
      finder: findMedication,
      resourceName: 'お薬',
      handler: async () => {
        await prisma.medication.delete({ where: { id: medicationId } });
        return success({ message: '削除しました' });
      },
    });
  })();
}
