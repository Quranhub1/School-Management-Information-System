export type LibraryIntegration = {
  id: 'koha' | 'dspace';
  name: 'KOHA' | 'DSpace';
  description: string;
  baseUrl: string;
  enabled: boolean;
};

export type LibraryIntegrationConfig = {
  kohaOpacUrl: string;
  kohaApiUrl: string;
  dspaceUrl: string;
};

const STORAGE_KEY = 'smis.library.integrations';

const defaults: LibraryIntegrationConfig = {
  kohaOpacUrl: '',
  kohaApiUrl: '',
  dspaceUrl: '',
};

export const defaultLibraryIntegrations: LibraryIntegration[] = [
  {
    id: 'koha',
    name: 'KOHA',
    description: 'External KOHA library automation and OPAC installation.',
    baseUrl: '',
    enabled: false,
  },
  {
    id: 'dspace',
    name: 'DSpace',
    description: 'External DSpace institutional repository installation.',
    baseUrl: '',
    enabled: false,
  },
];

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

export async function listLibraryIntegrations(): Promise<LibraryIntegration[]> {
  const config = getLibraryIntegrationConfig();
  return defaultLibraryIntegrations.map((integration) => {
    const baseUrl = integration.id === 'koha' ? config.kohaOpacUrl : config.dspaceUrl;
    return { ...integration, baseUrl, enabled: Boolean(baseUrl.trim()) };
  });
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
