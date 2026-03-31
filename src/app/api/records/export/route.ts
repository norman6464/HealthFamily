import { errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetMedicationHistory } from '@/domain/usecases/ManageMedicationRecords';
import { CsvExportEntity } from '@/domain/entities/CsvExport';

export async function GET(request: Request) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`records-export:${userId}`, { maxAttempts: 5, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const url = new URL(request.url);
    const memberId = url.searchParams.get('memberId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const container = createServerDIContainer(userId);
    const usecase = new GetMedicationHistory(container.medicationRecordRepository);
    const groups = await usecase.execute();
    let records = groups.flatMap((g) => g.records);

    if (memberId) {
      records = records.filter((r) => r.memberId === memberId);
    }
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        records = records.filter((r) => r.takenAt >= fromDate);
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        records = records.filter((r) => r.takenAt <= toDate);
      }
    }

    const csv = CsvExportEntity.toCsvString(records);
    const filename = CsvExportEntity.getFilename();

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="medication_history.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
      },
    });
  })();
}
