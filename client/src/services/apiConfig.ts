const DEFAULT_API_BASE_URL = '/api';

export function resolveApiBaseUrl(apiBaseUrl?: string): string {
  const trimmedApiBaseUrl = apiBaseUrl?.trim();

  return trimmedApiBaseUrl ? trimmedApiBaseUrl : DEFAULT_API_BASE_URL;
}

export const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
