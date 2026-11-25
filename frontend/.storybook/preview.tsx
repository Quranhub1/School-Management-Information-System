import type { Preview } from '@storybook/react'
import React from 'react'
import { QueryCacheProvider } from '../src/lib/QueryCacheProvider'
import { InstitutionSettingsProvider } from '../src/components/InstitutionSettingsContext'
import './preview.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
        { name: 'gray', value: '#f1f5f9' },
      ],
    },
    darkMode: {
      darkClass: 'dark',
      lightClass: 'light',
      stylePreview: true,
    },
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <QueryCacheProvider>
        <InstitutionSettingsProvider>
          <div className="storybook-wrapper">
            <Story />
          </div>
        </InstitutionSettingsProvider>
      </QueryCacheProvider>
    ),
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
}

export default preview