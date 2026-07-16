import { apiClient, USE_MOCK_API } from './client';
import { delay } from './mock/handlers';

export interface HealthResult {
  status: 'ok' | 'error';
  timestamp?: string;
}

export async function checkHealth(): Promise<HealthResult> {
  if (USE_MOCK_API) {
    return delay({ status: 'ok', timestamp: new Date().toISOString() }, 200);
  }
  try {
    const { data } = await apiClient.get<HealthResult>('/health');
    return data;
  } catch {
    return { status: 'error' };
  }
}
