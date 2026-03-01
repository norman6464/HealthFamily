import { prisma } from '@/lib/prisma';
import { updateHospitalSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck } from '@/lib/api-helpers';

const findHospital = (id: string) => prisma.hospital.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ hospitalId: string }> }) {
  return withAuth(async (userId) => {
    const { hospitalId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: hospitalId,
      finder: findHospital,
      resourceName: '病院',
      handler: async () => {
        const body = await request.json();
        const parsed = updateHospitalSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const updated = await prisma.hospital.update({
          where: { id: hospitalId },
          data: {
            name: parsed.data.name,
            hospitalType: parsed.data.type,
            address: parsed.data.address,
            phoneNumber: parsed.data.phone,
            notes: parsed.data.notes,
          },
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ hospitalId: string }> }) {
  return withAuth(async (userId) => {
    const { hospitalId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: hospitalId,
      finder: findHospital,
      resourceName: '病院',
      handler: async () => {
        await prisma.hospital.delete({ where: { id: hospitalId } });
        return success({ message: '削除しました' });
      },
    });
  })();
}
