import { apiClient } from './client';
import type { ApiError, User } from '@/types';

/*
 * The login form field is named "username" so the LoginPage and useAuth hook
 * work unchanged. The real HRIS API also calls this field `username`, even
 * though users type their office email address into it.
 */
export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResult {
  user: User;
  token: string;
}

/*
 * Real response of POST /login (verified against the live API):
 * user_id, fname, lname, full_name, designation, site, role (ids as strings),
 * employees[], sites[], *_permission flags, access_token, success: "true".
 */
interface BackendLoginResponse {
  user_id?: string;
  fname?: string;
  lname?: string;
  full_name?: string;
  designation?: string;
  site?: string;
  role?: string;
  employees?: string[];
  sites?: string[];
  /*
   * The modules this user's role unlocks, e.g.
   * {"1":"schedules","2":"leaves","3":"attendance","4":"summary","5":"employees"}.
   * A user without "roles" or "reporting" here must not see those sections.
   */
  tabNameToIndex?: Record<string, string>;
  indexToTabName?: Record<string, number>;
  read_permission?: string;
  write_permission?: string;
  edit_permission?: string;
  approval_permission?: string;
  delete_permission?: string;
  access_token?: string;
  success?: string;
  message?: string;
}

interface JwtPayload {
  user_id?: string;
  site?: string;
  full_name?: string;
  email?: string;
  contact?: string;
  designation?: string;
  status?: string;
}

/*
 * Read the non-secret claims stored inside the JWT the API returned. This
 * does not verify the token — verification is the backend's responsibility.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const normalizedPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    );

    const decodedPayload = window.atob(paddedPayload);
    const jsonPayload = decodeURIComponent(
      Array.from(decodedPayload)
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.warn('Unable to decode login token:', error);
    return null;
  }
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const username = payload.username.trim();

  let data: BackendLoginResponse;
  try {
    const response = await apiClient.post<BackendLoginResponse>('/login', {
      username,
      password: payload.password,
    });
    data = response.data;
  } catch (error) {
    /*
     * Quirk of the real API (verified): wrong username/password makes the
     * login route answer 403 "Invalid API key". Translate that one case to
     * what it actually means; every other error passes through untouched.
     */
    const apiError = error as ApiError;
    if (apiError.status === 403) {
      throw { ...apiError, message: 'Invalid username or password.' };
    }
    throw error;
  }

  const token = data?.access_token;

  if (!token || data?.success !== 'true') {
    throw {
      message: data?.message || 'The login server did not return an authentication token.',
    };
  }

  const jwt = decodeJwtPayload(token);

  // Module names the role unlocks. Both shapes carry the same list, so take
  // whichever the API returned.
  const modules = Object.keys(data.indexToTabName ?? {}).length
    ? Object.keys(data.indexToTabName ?? {})
    : Object.values(data.tabNameToIndex ?? {});

  const user: User = {
    id: data.user_id ?? jwt?.user_id ?? 0,
    name: data.full_name ?? jwt?.full_name ?? username,
    username,
    email: jwt?.email ?? username,
    designation: data.designation ?? jwt?.designation,
    role: data.role,
    siteId: data.site ?? jwt?.site,
    employeeIds: data.employees,
    siteIds: data.sites,
    modules: modules.map((m) => String(m).toLowerCase()),
    permissions: {
      read: data.read_permission === '1',
      write: data.write_permission === '1',
      edit: data.edit_permission === '1',
      approve: data.approval_permission === '1',
      delete: data.delete_permission === '1',
    },
  };

  return { token, user };
}

/*
 * The stored session user, for services that need login-scoped context
 * (e.g. monthly_summary requires the caller's employees array).
 */
export function getSessionUser(): User | null {
  try {
    const raw = sessionStorage.getItem('nha_session_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  sessionStorage.removeItem('nha_session_token');
  sessionStorage.removeItem('nha_session_user');
}
