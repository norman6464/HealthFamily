import { prisma } from '@/lib/prisma';
import { updateHospitalSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateHospital, DeleteHospital } from '@/domain/usecases/ManageHospitals';

const findHospital = (id: string) => prisma.hospital.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ hospitalId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`hospitals-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const { hospitalId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: hospitalId,
      finder: findHospital,
      resourceName: '病院',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
        const parsed = updateHospitalSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const container = createServerDIContainer(userId);
        const usecase = new UpdateHospital(container.hospitalRepository);
        const updated = await usecase.execute(hospitalId, {
          name: parsed.data.name,
          type: parsed.data.type,
          address: parsed.data.address,
          phone: parsed.data.phone,
          department: parsed.data.department,
          doctorName: parsed.data.doctorName,
          notes: parsed.data.notes,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ hospitalId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`hospitals-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { hospitalId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: hospitalId,
      finder: findHospital,
      resourceName: '病院',
      handler: async () => {
        const container = createServerDIContainer(userId);
        const usecase = new DeleteHospital(container.hospitalRepository);
        await usecase.execute(hospitalId);
        return success({ message: '削除しました' });
      },
    });
  })();
}
