import { prisma } from '@/lib/prisma';
import { createHospitalSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize , safeParseJson } from '@/lib/api-helpers';
import { QUERY_LIMITS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/security';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`hospitals-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const hospitals = await prisma.hospital.findMany({ where: { userId }, take: QUERY_LIMITS.DEFAULT });
  return success(hospitals);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`hospitals-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
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
