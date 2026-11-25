/** Current API version used by the frontend. Update when backend version changes. */
export const API_VERSION = 'v1';

/** Prepend API version to a path. */
export function versionedPath(path: string): string {
  if (!path.startsWith('/')) return path;
  return `/api/${API_VERSION}${path}`;
}

/** Create a versioned API base URL. */
export function getVersionedApiBase(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  return `${base}/api/${API_VERSION}`;
}