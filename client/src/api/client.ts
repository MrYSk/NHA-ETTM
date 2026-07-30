import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/types';

/*
 * The browser calls the local Node proxy through /api.
 * The Node server then calls the official NHA HRIS API and attaches the
 * server-side X-API-KEY. No mock/demo data exists anywhere in this app.
 */
export const API_BASE_URL =
  import.meta.env.VITE_APP_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,

  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/*
 * Add the authentication token to protected API requests.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem('nha_session_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

/*
 * The upstream HRIS list endpoints ignore pagination and always return the
 * complete dataset (verified against the live API). Each service therefore
 * fetches its list once, caches it briefly, and paginates/filters on the
 * client. This helper deduplicates in-flight requests and avoids re-downloading
 * large payloads on every filter change.
 */
const LIST_CACHE_TTL_MS = 60_000;

export function createListCache<T>(fetcher: () => Promise<T>) {
  let cached: { at: number; promise: Promise<T> } | null = null;

  return {
    get(): Promise<T> {
      if (cached && Date.now() - cached.at < LIST_CACHE_TTL_MS) {
        return cached.promise;
      }
      const promise = fetcher();
      cached = { at: Date.now(), promise };
      promise.catch(() => {
        // Never cache failures — the next call should retry the network.
        cached = null;
      });
      return promise;
    },
    clear() {
      cached = null;
    },
  };
}

export function paginateList<T>(items: T[], page = 1, pageSize = 10) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export function matchesSearch(haystack: (string | undefined)[], search?: string): boolean {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  return haystack.some((value) => value?.toLowerCase().includes(q));
}

interface ErrorResponseData {
  message?: string;
  error?: string;
  // Some CodeIgniter controllers report the human-readable reason as `msg`
  // (e.g. AddSchedule's duplicate-schedule 409), with extra lines in `details`.
  msg?: string;
  details?: string[];
  errors?: Record<string, string[]>;
}

export function normalizeError(
  error: unknown,
): ApiError {
  if (axios.isCancel(error)) {
    return {
      message: 'Request was cancelled.',
    };
  }

  const err =
    error as AxiosError<ErrorResponseData>;

  if (err.code === 'ECONNABORTED') {
    return {
      message:
        'The request timed out. Please try again.',
    };
  }

  if (!err.response) {
    return {
      message:
        'Unable to reach the server. Check your internet connection and make sure the backend server is running.',
    };
  }

  const status = err.response.status;
  const data = err.response.data;

  const backendMessage =
    data?.message ||
    data?.error ||
    // `msg` + optional `details` lines (e.g. AddSchedule duplicate 409).
    [data?.msg, ...(data?.details ?? [])].filter(Boolean).join(' ') ||
    undefined;

  switch (status) {
    case 400:
      return {
        status,
        message:
          backendMessage ||
          'The submitted information was invalid.',
        fieldErrors: data?.errors,
      };

    case 401:
      return {
        status,
        message:
          backendMessage ||
          'Invalid email or password.',
      };

    case 403:
      return {
        status,
        message:
          backendMessage ||
          'You do not have permission to perform this action.',
      };

    case 404:
      return {
        status,
        message:
          backendMessage ||
          'The requested API endpoint could not be found.',
      };

    case 422:
      return {
        status,
        message:
          backendMessage ||
          'Some fields need your attention.',
        fieldErrors: data?.errors,
      };

    case 429:
      return {
        status,
        message:
          backendMessage ||
          'Too many requests. Please wait and try again.',
      };

    case 500:
    default:
      return {
        status,
        message:
          backendMessage ||
          'The server encountered an error. Please try again.',
      };
  }
}

/*
 * Convert Axios errors into the error structure used by the app.
 */
apiClient.interceptors.response.use(
  (response) => response,

  (error: AxiosError<ErrorResponseData>) => {
    /*
     * Do not automatically log the user out when the login
     * endpoint itself returns 401.
     */
    const requestUrl = error.config?.url || '';

    if (
      error.response?.status === 401 &&
      !requestUrl.endsWith('/login')
    ) {
      window.dispatchEvent(
        new CustomEvent('nha:unauthorized'),
      );
    }

    return Promise.reject(normalizeError(error));
  },
);