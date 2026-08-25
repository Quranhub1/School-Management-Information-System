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
const defaults: LibraryIntegrationConfig = { kohaOpacUrl: '', kohaApiUrl: '', dspaceUrl: '' };

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch { return false; }
};

export const defaultLibraryIntegrations: LibraryIntegration[] = [
  { id:'koha', name:'KOHA', description:'External KOHA library automation and OPAC installation.', baseUrl:'', enabled:false },
  { id:'dspace', name:'DSpace', description:'External DSpace institutional repository installation.', baseUrl:'', enabled:false },
];

export function getLibraryIntegrationConfig(): LibraryIntegrationConfig {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<LibraryIntegrationConfig>;
    return { ...defaults, ...parsed };
  } catch { return { ...defaults }; }
}

export function saveLibraryIntegrationConfig(config: LibraryIntegrationConfig): void {
  for (const value of [config.kohaOpacUrl, config.kohaApiUrl, config.dspaceUrl]) {
    if (value.trim() && !isHttpUrl(value.trim())) throw new Error('Library integration endpoints must use HTTP or HTTPS.');
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    kohaOpacUrl: config.kohaOpacUrl.trim(), kohaApiUrl: config.kohaApiUrl.trim(), dspaceUrl: config.dspaceUrl.trim(),
  }));
}

export async function listLibraryIntegrations(): Promise<LibraryIntegration[]> {
  const config = getLibraryIntegrationConfig();
  return defaultLibraryIntegrations.map(integration => {
    const baseUrl = integration.id === 'koha' ? config.kohaOpacUrl : config.dspaceUrl;
    return { ...integration, baseUrl, enabled: Boolean(baseUrl.trim()) };
  });
}

export function openExternalLibraryEndpoint(url: string): void {
  if (isHttpUrl(url.trim())) window.open(url.trim(), '_blank', 'noopener,noreferrer');
}

export async function checkExternalEndpoint(url: string): Promise<{ ok:boolean; message:string }> {
  if (!url.trim()) return { ok:false, message:'Endpoint is not configured.' };
  if (!isHttpUrl(url.trim())) return { ok:false, message:'Endpoint must use HTTP or HTTPS.' };
  try {
    await fetch(url.trim(), { method:'HEAD', mode:'no-cors' });
    return { ok:true, message:'Endpoint is reachable from the browser.' };
  } catch (error) {
    return { ok:false, message:error instanceof Error ? error.message : 'Endpoint could not be reached.' };
  }
}
