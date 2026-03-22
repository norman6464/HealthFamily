import { createHospitalSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetHospitals, CreateHospital } from '@/domain/usecases/ManageHospitals';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`hospitals-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetHospitals(container.hospitalRepository);
  const hospitals = await usecase.execute();
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

    const container = createServerDIContainer(userId);
    const usecase = new CreateHospital(container.hospitalRepository);
    const hospital = await usecase.execute({
      name: parsed.data.name,
      type: parsed.data.type,
      address: parsed.data.address,
      phone: parsed.data.phone,
      department: parsed.data.department,
      doctorName: parsed.data.doctorName,
      notes: parsed.data.notes,
    });
    return created(hospital);
  })();
}
