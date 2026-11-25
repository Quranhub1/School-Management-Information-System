import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Input } from './input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible input component with label, error, and helper text support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'The type of input',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display below the input',
    },
    onChange: { action: 'changed' },
    onBlur: { action: 'blurred' },
  },
  args: { onChange: fn(), onBlur: fn() },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    type: 'email',
  },
}

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
    value: 'invalid-email',
    error: 'Please enter a valid email address',
  },
}

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    helperText: 'Must be at least 8 characters with one number',
  },
}

export const Required: Story = {
  args: {
    label: 'Username *',
    placeholder: 'Enter username',
    required: true,
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    value: 'Pre-filled value',
  },
}

export const ReadOnly: Story = {
  args: {
    label: 'Read Only',
    value: 'This cannot be changed',
    readOnly: true,
  },
}

export const NumberInput: Story = {
  args: {
    label: 'Age',
    type: 'number',
    placeholder: '25',
    min: 0,
    max: 120,
    step: 1,
  },
}

export const WithPrefix: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px 0 0 6px', border: '1px solid #e2e8f0', borderRight: 'none' }}>UGX</span>
      <Input
        style={{ flex: 1, borderRadius: '0 6px 6px 0' }}
        type="number"
        placeholder="0.00"
        inputMode="decimal"
      />
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <form style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <Input
        label="First Name"
        placeholder="John"
        required
      />
      <Input
        label="Last Name"
        placeholder="Doe"
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="john@example.com"
        required
      />
      <Input
        label="Phone"
        type="tel"
        placeholder="+256 700 000 000"
      />
      <button type="submit" style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Submit
      </button>
    </form>
  ),
}