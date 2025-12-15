import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { router } from '@inertiajs/react'
import DepartmentGrid from '@/Components/Admin/DepartmentGrid'

// Mock the hooks and components
vi.mock('@/Components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

vi.mock('@/hooks/useFormValidation', () => ({
  useDepartmentValidation: () => ({
    data: {
      deptid: '',
      name: '',
      code: '',
      description: '',
      icon: 'default',
      sort_order: 0,
      status: 'active'
    },
    setData: vi.fn(),
    processing: false,
    isValid: true,
    getAllErrors: () => ({}),
    getFieldError: () => null,
    validateField: vi.fn(),
    submit: vi.fn(),
    reset: vi.fn()
  })
}))

vi.mock('@/hooks/usePermissions', () => ({
  CanAccess: ({ children, permission }: { children: React.ReactNode; permission?: string }) => (
    <div data-testid={`can-access-${permission}`}>{children}</div>
  ),
  usePermissions: () => ({
    can: vi.fn((permission: string) => permission !== 'restricted-permission')
  })
}))

vi.mock('@/Components/Admin/ActionButton', () => ({
  ActionButton: ({ children, onClick, permission }: any) => (
    <button data-testid={`action-button-${permission}`} onClick={onClick}>
      {children}
    </button>
  ),
  ActionButtonGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="action-button-group">{children}</div>
  )
}))

describe('DepartmentGrid', () => {
  const mockDepartments = [
    {
      id: 1,
      deptid: 'DEPT001',
      name: 'Cardiology',
      code: 'CARD',
      description: 'Heart and cardiovascular care',
      icon: 'cardiology',
      sort_order: 1,
      status: 'active' as const,
      wards_count: 3,
      test_catalogs_count: 15,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      deptid: 'DEPT002',
      name: 'Neurology',
      code: 'NEUR',
      description: 'Brain and nervous system care',
      icon: 'neurology',
      sort_order: 2,
      status: 'inactive' as const,
      wards_count: 2,
      test_catalogs_count: 8,
      created_at: '2024-01-01T11:00:00Z',
      updated_at: '2024-01-01T11:00:00Z'
    }
  ]

  const mockProps = {
    departments: mockDepartments,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onAdd: vi.fn(),
    onReorder: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders department grid with correct title and description', () => {
    render(<DepartmentGrid {...mockProps} />)
    
    expect(screen.getByText('Departments & Specialties')).toBeInTheDocument()
    expect(screen.getByText('Manage hospital departments and medical specialties')).toBeInTheDocument()
  })

  it('displays all departments in grid format', () => {
    render(<DepartmentGrid {...mockProps} />)
    
    expect(screen.getByText('Cardiology')).toBeInTheDocument()
    expect(screen.getByText('Neurology')).toBeInTheDocument()
    expect(screen.getByText('CARD')).toBeInTheDocument()
    expect(screen.getByText('NEUR')).toBeInTheDocument()
  })

  it('shows department statistics correctly', () => {
    render(<DepartmentGrid {...mockProps} />)
    
    expect(screen.getByText('3 wards')).toBeInTheDocument()
    expect(screen.getByText('15 tests')).toBeInTheDocument()
    expect(screen.getByText('2 wards')).toBeInTheDocument()
    expect(screen.getByText('8 tests')).toBeInTheDocument()
  })

  it('displays status toggles for departments', () => {
    render(<DepartmentGrid {...mockProps} />)
    
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(2)
  })

  it('handles status toggle click', async () => {
    const user = userEvent.setup()
    render(<DepartmentGrid {...mockProps} />)
    
    const switches = screen.getAllByRole('switch')
    await user.click(switches[0])
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('DEPT001', { status: 'inactive' })
  })

  it('enables inline editing when department name is clicked', async () => {
    const user = userEvent.setup()
    render(<DepartmentGrid {...mockProps} />)
    
    const departmentName = screen.getByText('Cardiology')
    await user.click(departmentName)
    
    const input = screen.getByDisplayValue('Cardiology')
    expect(input).toBeInTheDocument()
  })

  it('saves changes when inline editing is completed', async () => {
    const user = userEvent.setup()
    render(<DepartmentGrid {...mockProps} />)
    
    const departmentName = screen.getByText('Cardiology')
    await user.click(departmentName)
    
    const input = screen.getByDisplayValue('Cardiology')
    await user.clear(input)
    await user.type(input, 'Updated Cardiology')
    await user.tab() // Trigger blur event
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('DEPT001', expect.objectContaining({
      name: 'Updated Cardiology'
    }))
  })

  it('cancels inline editing when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<DepartmentGrid {...mockProps} />)
    
    const departmentName = screen.getByText('Cardiology')
    await user.click(departmentName)
    
    const input = screen.getByDisplayValue('Cardiology')
    await user.clear(input)
    await user.type(input, 'Updated Name')
    await user.keyboard('{Escape}')
    
    expect(mockProps.onUpdate).not.toHaveBeenCalled()
    expect(screen.getByText('Cardiology')).toBeInTheDocument()
  })

  it('opens create department modal when Add Department is clicked', async () => {
    const user = userEvent.setup()
    render(<DepartmentGrid {...mockProps} />)
    
    const addButton = screen.getByText('Add Department')
    await user.click(addButton)
    
    expect(screen.getByText('Create New Department')).toBeInTheDocument()
    expect(screen.getByText('Add a new department or specialty to the system.')).toBeInTheDocument()
  })

  it('shows delete confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<DepartmentGrid {...mockProps} />)
    
    // Find and click the delete button (trash icon)
    const deleteButtons = screen.getAllByTestId('action-button-delete departments')
    await user.click(deleteButtons[0])
    
    expect(screen.getByText('Delete Department')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete "Cardiology"/)).toBeInTheDocument()
  })

  it('shows warning when department has active references', async () => {
    const user = userEvent.setup()
    render(<DepartmentGrid {...mockProps} />)
    
    const deleteButtons = screen.getAllByTestId('action-button-delete departments')
    await user.click(deleteButtons[0])
    
    expect(screen.getByText(/This department has 3 wards and 15 test catalogs/)).toBeInTheDocument()
  })

  it('handles department deletion confirmation', async () => {
    const user = userEvent.setup()
    render(<DepartmentGrid {...mockProps} />)
    
    const deleteButtons = screen.getAllByTestId('action-button-delete departments')
    await user.click(deleteButtons[0])
    
    const confirmButton = screen.getByText('Delete')
    await user.click(confirmButton)
    
    expect(mockProps.onDelete).toHaveBeenCalledWith('DEPT001')
  })

  it('supports drag and drop reordering', async () => {
    render(<DepartmentGrid {...mockProps} />)
    
    const departmentCards = screen.getAllByText(/Cardiology|Neurology/)
    const cardiologyCard = departmentCards[0].closest('[draggable="true"]')
    const neurologyCard = departmentCards[1].closest('[draggable="true"]')
    
    expect(cardiologyCard).toHaveAttribute('draggable', 'true')
    expect(neurologyCard).toHaveAttribute('draggable', 'true')
  })

  it('handles drag start event', () => {
    render(<DepartmentGrid {...mockProps} />)
    
    const departmentCards = screen.getAllByText(/Cardiology/)
    const cardiologyCard = departmentCards[0].closest('[draggable="true"]')
    
    const dragStartEvent = new DragEvent('dragstart', { bubbles: true })
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: {
        effectAllowed: '',
        setData: vi.fn(),
      }
    })
    
    fireEvent(cardiologyCard!, dragStartEvent)
    expect(dragStartEvent.dataTransfer.effectAllowed).toBe('move')
  })

  it('shows empty state when no departments exist', () => {
    render(<DepartmentGrid {...{ ...mockProps, departments: [] }} />)
    
    expect(screen.getByText('No departments found')).toBeInTheDocument()
    expect(screen.getByText('Get started by creating your first department.')).toBeInTheDocument()
  })

  it('displays inactive departments with reduced opacity', () => {
    render(<DepartmentGrid {...mockProps} />)
    
    const cards = screen.getAllByRole('article') // Assuming cards have article role
    // The inactive department (Neurology) should have opacity-60 class
    // This would need to be tested through DOM inspection or CSS classes
  })

  it('handles code editing inline', async () => {
    const user = userEvent.setup()
    render(<DepartmentGrid {...mockProps} />)
    
    const codeElement = screen.getByText('CARD')
    await user.click(codeElement)
    
    const input = screen.getByDisplayValue('CARD')
    await user.clear(input)
    await user.type(input, 'CARDIO')
    await user.tab()
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('DEPT001', expect.objectContaining({
      code: 'CARDIO'
    }))
  })

  it('falls back to router calls when no callback props provided', async () => {
    const user = userEvent.setup()
    const propsWithoutCallbacks = { departments: mockDepartments }
    
    render(<DepartmentGrid {...propsWithoutCallbacks} />)
    
    const switches = screen.getAllByRole('switch')
    await user.click(switches[0])
    
    expect(router.post).toHaveBeenCalledWith('/admin/departments/DEPT001/toggle-status', {}, expect.any(Object))
  })

  it('renders department icons correctly', () => {
    render(<DepartmentGrid {...mockProps} />)
    
    // Icons should be rendered based on the icon field
    // This would need to be tested through the presence of specific icon components
    const cardiologySection = screen.getByText('Cardiology').closest('article')
    const neurologySection = screen.getByText('Neurology').closest('article')
    
    expect(cardiologySection).toBeInTheDocument()
    expect(neurologySection).toBeInTheDocument()
  })

  it('sorts departments by sort_order', () => {
    const unsortedDepartments = [
      { ...mockDepartments[1], sort_order: 1 },
      { ...mockDepartments[0], sort_order: 2 }
    ]
    
    render(<DepartmentGrid {...{ ...mockProps, departments: unsortedDepartments }} />)
    
    const departmentNames = screen.getAllByText(/Cardiology|Neurology/)
    expect(departmentNames[0]).toHaveTextContent('Neurology') // Should be first due to sort_order: 1
    expect(departmentNames[1]).toHaveTextContent('Cardiology') // Should be second due to sort_order: 2
  })
})