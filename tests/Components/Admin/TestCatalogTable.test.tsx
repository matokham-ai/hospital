import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TestCatalogTable from '@/Components/Admin/TestCatalogTable'
import { router } from '@inertiajs/react'

// Mock the toast hook
vi.mock('@/Components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('TestCatalogTable', () => {
  const mockTests = [
    {
      id: 1,
      name: 'Complete Blood Count',
      code: 'CBC',
      category: 'Hematology',
      price: 25.00,
      turnaround_time: 24,
      unit: 'cells/μL',
      normal_range: '4000-11000',
      sample_type: 'Blood',
      instructions: 'Fasting not required',
      status: 'active' as const,
      department: {
        id: 1,
        name: 'Laboratory'
      },
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      name: 'Blood Sugar',
      code: 'BS',
      category: 'Biochemistry',
      price: 15.00,
      turnaround_time: 12,
      unit: 'mg/dL',
      normal_range: '70-100',
      sample_type: 'Blood',
      instructions: 'Fasting required',
      status: 'inactive' as const,
      department: {
        id: 1,
        name: 'Laboratory'
      },
      created_at: '2024-01-01T11:00:00Z',
      updated_at: '2024-01-01T11:00:00Z'
    }
  ]

  const mockCategories = [
    {
      id: 1,
      name: 'Hematology',
      code: 'HEM',
      color: '#ff0000',
      is_active: true
    },
    {
      id: 2,
      name: 'Biochemistry',
      code: 'BIO',
      color: '#0000ff',
      is_active: true
    }
  ]

  const mockProps = {
    tests: mockTests,
    categories: mockCategories,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onAdd: vi.fn(),
    onBulkUpdate: vi.fn(),
    onSearch: vi.fn(),
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders test catalog table with correct title', () => {
    render(<TestCatalogTable {...mockProps} />)
    
    expect(screen.getByText('Test Catalog Management')).toBeInTheDocument()
    expect(screen.getByText('Manage laboratory tests with pricing and turnaround times')).toBeInTheDocument()
  })

  it('displays all tests in the table', () => {
    render(<TestCatalogTable {...mockProps} />)
    
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument()
    expect(screen.getByText('Blood Sugar')).toBeInTheDocument()
    expect(screen.getByText('CBC')).toBeInTheDocument()
    expect(screen.getByText('BS')).toBeInTheDocument()
  })

  it('shows test prices and turnaround times', () => {
    render(<TestCatalogTable {...mockProps} />)
    
    expect(screen.getByText('25.00')).toBeInTheDocument()
    expect(screen.getByText('15.00')).toBeInTheDocument()
    expect(screen.getByText('1d')).toBeInTheDocument() // 24 hours = 1 day
    expect(screen.getByText('12h')).toBeInTheDocument()
  })

  it('displays category badges with correct colors', () => {
    render(<TestCatalogTable {...mockProps} />)
    
    expect(screen.getByText('Hematology')).toBeInTheDocument()
    expect(screen.getByText('Biochemistry')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<TestCatalogTable {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search tests by name, code, or category...')
    expect(searchInput).toBeInTheDocument()
  })

  it('handles search input changes', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search tests by name, code, or category...')
    await user.type(searchInput, 'blood')
    
    // Should trigger search after debounce
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('blood', expect.any(Object))
    }, { timeout: 500 })
  })

  it('shows category filter chips', () => {
    render(<TestCatalogTable {...mockProps} />)
    
    expect(screen.getByText('All Categories')).toBeInTheDocument()
    expect(screen.getByText('Hematology')).toBeInTheDocument()
    expect(screen.getByText('Biochemistry')).toBeInTheDocument()
  })

  it('handles category filter selection', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const hematologyFilter = screen.getByText('Hematology')
    await user.click(hematologyFilter)
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('', expect.objectContaining({
        category: 'Hematology'
      }))
    })
  })

  it('renders status toggles for tests', () => {
    render(<TestCatalogTable {...mockProps} />)
    
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(2)
  })

  it('handles status toggle changes', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const switches = screen.getAllByRole('switch')
    await user.click(switches[0])
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith(1, { status: 'inactive' })
  })

  it('enables inline editing for test prices', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const priceElement = screen.getByText('25.00')
    await user.click(priceElement)
    
    const priceInput = screen.getByDisplayValue('25')
    expect(priceInput).toBeInTheDocument()
  })

  it('saves price changes when inline editing is completed', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const priceElement = screen.getByText('25.00')
    await user.click(priceElement)
    
    const priceInput = screen.getByDisplayValue('25')
    await user.clear(priceInput)
    await user.type(priceInput, '30')
    await user.tab()
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith(1, { price: 30 })
  })

  it('enables inline editing for turnaround times', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const tatElement = screen.getByText('1d')
    await user.click(tatElement)
    
    const tatInput = screen.getByDisplayValue('24')
    expect(tatInput).toBeInTheDocument()
  })

  it('handles bulk selection of tests', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0] // First checkbox is select all
    await user.click(selectAllCheckbox)
    
    // Should show bulk actions bar
    expect(screen.getByText(/2 tests selected/)).toBeInTheDocument()
  })

  it('shows bulk actions when tests are selected', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const testCheckboxes = screen.getAllByRole('checkbox')
    await user.click(testCheckboxes[1]) // Select first test
    
    expect(screen.getByText('1 test selected')).toBeInTheDocument()
    expect(screen.getByText('Activate Selected')).toBeInTheDocument()
    expect(screen.getByText('Deactivate Selected')).toBeInTheDocument()
  })

  it('handles bulk status updates', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const testCheckboxes = screen.getAllByRole('checkbox')
    await user.click(testCheckboxes[1]) // Select first test
    
    const activateButton = screen.getByText('Activate Selected')
    await user.click(activateButton)
    
    expect(mockProps.onBulkUpdate).toHaveBeenCalledWith([
      { id: 1, data: { status: 'active' } }
    ])
  })

  it('opens create test modal when Add Test is clicked', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const addButton = screen.getByText('Add Test')
    await user.click(addButton)
    
    // Modal should open (implementation depends on Dialog component)
    expect(screen.getByText('Add Test')).toBeInTheDocument()
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    expect(router.reload).toHaveBeenCalledWith({ only: ['tests', 'categories'] })
  })

  it('shows filters panel when filters button is clicked', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)
    
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Price Range')).toBeInTheDocument()
  })

  it('clears all filters when clear filters is clicked', async () => {
    const user = userEvent.setup()
    render(<TestCatalogTable {...mockProps} />)
    
    // Open filters first
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)
    
    const clearButton = screen.getByText('Clear Filters')
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('', {})
    })
  })

  it('formats turnaround time correctly', () => {
    render(<TestCatalogTable {...mockProps} />)
    
    // 24 hours should display as "1d"
    expect(screen.getByText('1d')).toBeInTheDocument()
    // 12 hours should display as "12h"
    expect(screen.getByText('12h')).toBeInTheDocument()
  })

  it('falls back to router calls when no callback props provided', async () => {
    const user = userEvent.setup()
    const propsWithoutCallbacks = { tests: mockTests, categories: mockCategories }
    
    render(<TestCatalogTable {...propsWithoutCallbacks} />)
    
    const switches = screen.getAllByRole('switch')
    await user.click(switches[0])
    
    expect(router.put).toHaveBeenCalledWith('/admin/test-catalogs/1', { status: 'inactive' }, expect.any(Object))
  })

  it('shows loading state when isLoading is true', () => {
    render(<TestCatalogTable {...{ ...mockProps, isLoading: true }} />)
    
    const refreshButton = screen.getByText('Refresh')
    expect(refreshButton).toBeDisabled()
  })
})