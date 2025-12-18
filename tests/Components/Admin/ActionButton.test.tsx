import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionButton, ActionButtonGroup } from '@/Components/Admin/ActionButton'
import { Edit } from 'lucide-react'

// Mock the CanAccess component
vi.mock('@/hooks/usePermissions', () => ({
  CanAccess: ({ children, permission, fallback }: { 
    children: React.ReactNode; 
    permission?: string; 
    fallback?: React.ReactNode 
  }) => {
    // Simulate permission check - deny 'restricted-permission'
    if (permission === 'restricted-permission') {
      return fallback || null
    }
    return <div data-testid={`can-access-${permission}`}>{children}</div>
  }
}))

describe('ActionButton', () => {
  it('renders button with children', () => {
    render(
      <ActionButton>
        Click me
      </ActionButton>
    )
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('renders button with icon', () => {
    render(
      <ActionButton icon={Edit}>
        Edit
      </ActionButton>
    )
    
    expect(screen.getByText('Edit')).toBeInTheDocument()
    // Icon should be rendered (would need to check for SVG element)
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(
      <ActionButton onClick={handleClick}>
        Click me
      </ActionButton>
    )
    
    await user.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders as link when href is provided', () => {
    render(
      <ActionButton href="/test-url">
        Link Button
      </ActionButton>
    )
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test-url')
    expect(link).toHaveTextContent('Link Button')
  })

  it('applies different variants correctly', () => {
    const { rerender } = render(
      <ActionButton variant="destructive">
        Destructive Button
      </ActionButton>
    )
    
    let button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    
    rerender(
      <ActionButton variant="outline">
        Outline Button
      </ActionButton>
    )
    
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(
      <ActionButton size="sm">
        Small Button
      </ActionButton>
    )
    
    let button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    
    rerender(
      <ActionButton size="lg">
        Large Button
      </ActionButton>
    )
    
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <ActionButton loading>
        Submit
      </ActionButton>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(
      <ActionButton disabled>
        Disabled Button
      </ActionButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('is disabled when loading', () => {
    render(
      <ActionButton loading>
        Loading Button
      </ActionButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('applies custom className', () => {
    render(
      <ActionButton className="custom-class">
        Custom Button
      </ActionButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('renders with permission check', () => {
    render(
      <ActionButton permission="edit-users">
        Edit Users
      </ActionButton>
    )
    
    expect(screen.getByTestId('can-access-edit-users')).toBeInTheDocument()
    expect(screen.getByText('Edit Users')).toBeInTheDocument()
  })

  it('renders with multiple permissions', () => {
    render(
      <ActionButton permissions={['edit-users', 'view-users']}>
        Manage Users
      </ActionButton>
    )
    
    expect(screen.getByText('Manage Users')).toBeInTheDocument()
  })

  it('shows fallback when permission is denied', () => {
    render(
      <ActionButton 
        permission="restricted-permission" 
        fallback={<div>Access Denied</div>}
      >
        Restricted Action
      </ActionButton>
    )
    
    expect(screen.queryByText('Restricted Action')).not.toBeInTheDocument()
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('renders without permission wrapper when no permission specified', () => {
    render(
      <ActionButton>
        No Permission Check
      </ActionButton>
    )
    
    expect(screen.getByText('No Permission Check')).toBeInTheDocument()
    expect(screen.queryByTestId(/can-access/)).not.toBeInTheDocument()
  })

  it('handles requireAll prop for multiple permissions', () => {
    render(
      <ActionButton 
        permissions={['edit-users', 'delete-users']} 
        requireAll={true}
      >
        Full Access
      </ActionButton>
    )
    
    expect(screen.getByText('Full Access')).toBeInTheDocument()
  })
})

describe('ActionButtonGroup', () => {
  it('renders children in a flex container', () => {
    render(
      <ActionButtonGroup>
        <ActionButton>Button 1</ActionButton>
        <ActionButton>Button 2</ActionButton>
      </ActionButtonGroup>
    )
    
    expect(screen.getByText('Button 1')).toBeInTheDocument()
    expect(screen.getByText('Button 2')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ActionButtonGroup className="custom-group-class">
        <ActionButton>Button</ActionButton>
      </ActionButtonGroup>
    )
    
    const group = screen.getByText('Button').parentElement
    expect(group).toHaveClass('custom-group-class')
  })

  it('renders multiple action buttons with proper spacing', () => {
    render(
      <ActionButtonGroup>
        <ActionButton icon={Edit}>Edit</ActionButton>
        <ActionButton variant="destructive">Delete</ActionButton>
        <ActionButton variant="outline">Cancel</ActionButton>
      </ActionButtonGroup>
    )
    
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })
})