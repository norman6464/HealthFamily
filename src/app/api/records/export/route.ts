import { errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetMedicationHistory } from '@/domain/usecases/ManageMedicationRecords';
import { CsvExportEntity } from '@/domain/entities/CsvExport';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`records-export:${userId}`, { maxAttempts: 5, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const container = createServerDIContainer(userId);
  const usecase = new GetMedicationHistory(container.medicationRecordRepository);
  const groups = await usecase.execute();
  const records = groups.flatMap((g) => g.records);

  const csv = CsvExportEntity.toCsvString(records);
  const filename = CsvExportEntity.getFilename();

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
});
