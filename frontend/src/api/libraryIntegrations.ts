export type LibraryIntegration = {
  id: string;
  name: 'KOHA' | 'DSpace';
  enabled: boolean;
  baseUrl: string;
  description: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const defaultLibraryIntegrations: LibraryIntegration[] = [
  {
    id: 'koha',
    name: 'KOHA',
    enabled: false,
    baseUrl: '',
    description: 'Library automation and OPAC integration.',
  },
  {
    id: 'dspace',
    name: 'DSpace',
    enabled: false,
    baseUrl: '',
    description: 'Institutional repository and digital collections.',
  },
];

export async function listLibraryIntegrations(): Promise<LibraryIntegration[]> {
  const response = await fetch(`${API_BASE}/library/integrations`, {
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 404) return defaultLibraryIntegrations;
    throw new Error('Unable to load library integrations.');
  }
  return response.json();
}
