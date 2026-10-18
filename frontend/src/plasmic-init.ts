import { initPlasmicLoader } from '@plasmicapp/loader-react';

// Public Plasmic project configuration.
// Set VITE_PLASMIC_PUBLIC_TOKEN in frontend/.env.local; never commit the token.
export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: 'pA2ho8UUx8FisCxBfRLDhM',
      token: import.meta.env.VITE_PLASMIC_PUBLIC_TOKEN ?? '',
    },
  ],
  // Preview mode lets Studio render unpublished revisions during development.
  // Disable preview for production builds.
  preview: import.meta.env.DEV,
});
