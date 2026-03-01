import { prisma } from '@/lib/prisma';
import { createHospitalSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const hospitals = await prisma.hospital.findMany({ where: { userId } });
  return success(hospitals);
});

export async function POST(request: Request) {
  return withAuth(async (userId) => {
    const body = await request.json();
    const parsed = createHospitalSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const hospital = await prisma.hospital.create({
      data: {
        userId,
        name: parsed.data.name,
        hospitalType: parsed.data.type,
        address: parsed.data.address,
        phoneNumber: parsed.data.phone,
        notes: parsed.data.notes,
      },
    });
    return created(hospital);
  })();
}
