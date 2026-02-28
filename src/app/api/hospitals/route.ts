import { prisma } from '@/lib/prisma';
import { createHospitalSchema } from '@/lib/schemas';
import { getAuthUserId, success, created, errorResponse, unauthorized } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const hospitals = await prisma.hospital.findMany({ where: { userId } });
    return success(hospitals);
  } catch {
    return errorResponse('一覧取得に失敗しました', 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

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
  } catch {
    return errorResponse('登録に失敗しました', 500);
  }
}
