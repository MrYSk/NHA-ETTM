import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';
export const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || '/api';

// The browser only ever talks to our same-origin Node proxy at /api — never
// directly to https://ettm.nha.gov.pk/hris_ci/. Real credentials and the
// production host live exclusively in server/.env.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('nha_session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function normalizeError(error: unknown): ApiError {
  if (axios.isCancel(error)) {
    return { message: 'Request was cancelled.' };
  }

  const err = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;

  if (err.code === 'ECONNABORTED') {
    return { message: 'The request timed out. Please try again.' };
  }

  if (!err.response) {
    return { message: 'Unable to reach the server. Check your connection and try again.' };
  }

  const status = err.response.status;
  const data = err.response.data;

  switch (status) {
    case 400:
      return { status, message: data?.message || 'The request was invalid.', fieldErrors: data?.errors };
    case 401:
      return { status, message: 'Your session has expired. Please sign in again.' };
    case 403:
      return { status, message: 'You do not have permission to perform this action.' };
    case 404:
      return { status, message: 'The requested resource could not be found.' };
    case 422:
      return { status, message: data?.message || 'Some fields need your attention.', fieldErrors: data?.errors };
    case 429:
      return { status, message: 'Too many requests. Please wait a moment and try again.' };
    case 500:
    default:
      return { status, message: data?.message || 'Something went wrong on our end. Please try again.' };
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('nha:unauthorized'));
    }
    return Promise.reject(normalizeError(error));
  },
);
