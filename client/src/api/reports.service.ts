import { apiClient, USE_MOCK_API } from './client';
import { delay, mockDb, searchFilter } from './mock/handlers';
import type { Report } from '@/types';

export interface ReportFilters {
  search?: string;
  siteId?: string | number;
  dateFrom?: string;
  dateTo?: string;
}

export async function listReports(filters: ReportFilters): Promise<Report[]> {
  if (USE_MOCK_API) {
    let items = [...mockDb.reports];
    items = searchFilter(items, filters.search, ['title', 'type']);
    return delay(items);
  }
  const { data } = await apiClient.get<Report[]>('/report_list', { params: filters });
  return data;
}

export async function testSsl(): Promise<{ ok: boolean; message: string }> {
  if (USE_MOCK_API) {
    return delay({ ok: true, message: 'SSL handshake succeeded (mock).' }, 300);
  }
  const { data } = await apiClient.get('/ssl_test');
  return data;
}
