export type LibraryIntegrationConfig = {
  kohaOpacUrl: string;
  kohaApiUrl: string;
  dspaceUrl: string;
};

const STORAGE_KEY = 'smis.library.integrations';

const defaults: LibraryIntegrationConfig = {
  kohaOpacUrl: '',
  kohaApiUrl: '',
  dspaceUrl: ''
};

export function getLibraryIntegrationConfig(): LibraryIntegrationConfig {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return defaults;
  }
}

export function saveLibraryIntegrationConfig(config: LibraryIntegrationConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function openExternalLibraryEndpoint(url: string): void {
  if (url.trim()) window.open(url, '_blank', 'noopener,noreferrer');
}

export async function checkExternalEndpoint(url: string): Promise<{ ok: boolean; message: string }> {
  if (!url.trim()) return { ok: false, message: 'Endpoint is not configured.' };
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return { ok: true, message: 'Endpoint is reachable from the browser.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Endpoint could not be reached.' };
  }
}
