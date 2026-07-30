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

/*
 * The upstream's own connectivity check (GET /ssl_test). Used by the Settings
 * page to prove the proxy can reach the NHA API.
 */
export async function testSsl(): Promise<{ ok: boolean; message: string }> {
  const { data } = await apiClient.get<{ status: boolean; message: string }>('/ssl_test');
  return { ok: data.status === true, message: data.message };
}
