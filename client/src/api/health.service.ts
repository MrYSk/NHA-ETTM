import { apiClient } from './client';

export interface HealthResult {
  status: 'ok' | 'error';
  timestamp?: string;
}

export async function checkHealth(): Promise<HealthResult> {
  try {
    const { data } = await apiClient.get<HealthResult>('/health');
    return data;
  } catch {
    return { status: 'error' };
  }
}
