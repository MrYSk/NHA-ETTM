import { apiClient, USE_MOCK_API } from './client';
import { delay } from './mock/handlers';
import type { User } from '@/types';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResult {
  user: User;
  token: string;
}

const DEMO_USER: User = {
  id: 1,
  name: 'System Administrator',
  username: 'admin',
  email: 'admin@nha.gov.pk',
  role: 'HR Administrator',
  designation: 'HR Administrator',
  siteName: 'Head Office — Islamabad',
};

export async function login(payload: LoginPayload): Promise<LoginResult> {
  if (USE_MOCK_API) {
    if (payload.username === 'admin' && payload.password === 'admin123') {
      return delay({ user: DEMO_USER, token: 'mock-session-token' }, 500);
    }
    // Simulate the shape of a real 401 without hitting the network.
    return Promise.reject({ status: 401, message: 'Invalid username or password.' });
  }

  // TODO: Confirm HTTP method, headers, and exact request/response payload
  // for `login` with the backend team. Assumed POST with { username, password }.
  const { data } = await apiClient.post<LoginResult>('/login', payload);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  if (USE_MOCK_API) {
    return delay(DEMO_USER, 150);
  }
  const { data } = await apiClient.get<User>('/user_list/me');
  return data;
}

export function logout() {
  sessionStorage.removeItem('nha_session_token');
  sessionStorage.removeItem('nha_session_user');
}
