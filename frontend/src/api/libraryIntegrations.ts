const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('smis.accessToken');
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const payload = await response.json() as { message?: string; title?: string }; message = payload.message ?? payload.title ?? message; } catch { /* status fallback */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export type LibraryPluginSettings = {
  kohaOpacUrl: string; kohaApiUrl: string; kohaUsername: string; hasKohaPassword: boolean; kohaEnabled: boolean;
  dSpaceBaseUrl: string; dSpaceRestApiUrl: string; dSpaceOaiPmhUrl: string; dSpaceUsername: string;
  hasDSpacePassword: boolean; dSpaceEnabled: boolean; updatedAt?: string | null;
};
export type LibraryPluginUpdate = LibraryPluginSettings & { kohaPassword: string; dSpacePassword: string };
export type PluginConnectionTest = { ok: boolean; message: string };

export const emptyLibraryPluginSettings: LibraryPluginSettings = {
  kohaOpacUrl: '', kohaApiUrl: '', kohaUsername: '', hasKohaPassword: false, kohaEnabled: false,
  dSpaceBaseUrl: '', dSpaceRestApiUrl: '', dSpaceOaiPmhUrl: '', dSpaceUsername: '', hasDSpacePassword: false, dSpaceEnabled: false,
};
export const getLibraryPluginSettings = () => request<LibraryPluginSettings>(versionedPath('/api/administration/library-plugins'));
export const saveLibraryPluginSettings = (settings: LibraryPluginUpdate) =>
  request<LibraryPluginSettings>(versionedPath('/api/administration/library-plugins'), { method: 'PUT', body: JSON.stringify(settings) });
export const testLibraryPluginConnection = (service: 'koha' | 'dspace') =>
  request<PluginConnectionTest>(versionedPath(`/api/administration/library-plugins/test/${service}`), { method: 'POST' });
