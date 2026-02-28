import { prisma } from '@/lib/prisma';
import { updateHospitalSchema } from '@/lib/schemas';
import { getAuthUserId, success, errorResponse, notFound, unauthorized } from '@/lib/auth-helpers';

export async function PUT(request: Request, { params }: { params: Promise<{ hospitalId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { hospitalId } = await params;
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital || hospital.userId !== userId) return notFound('病院');

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
  } catch {
    return errorResponse('更新に失敗しました', 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ hospitalId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { hospitalId } = await params;
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital || hospital.userId !== userId) return notFound('病院');

    await prisma.hospital.delete({ where: { id: hospitalId } });
    return success({ message: '削除しました' });
  } catch {
    return errorResponse('削除に失敗しました', 500);
  }
}
