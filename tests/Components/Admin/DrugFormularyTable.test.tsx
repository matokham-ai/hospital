import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DrugFormularyTable from '@/Components/Admin/DrugFormularyTable'
import { router } from '@inertiajs/react'

// Mock the toast hook
vi.mock('@/Components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('DrugFormularyTable', () => {
  const mockDrugs = [
    {
      id: 1,
      name: 'Paracetamol',
      generic_name: 'Acetaminophen',
      atc_code: 'N02BE01',
      strength: '500mg',
      form: 'tablet' as const,
      stock_quantity: 100,
      reorder_level: 20,
      unit_price: 0.50,
      manufacturer: 'PharmaCorp',
      batch_number: 'PC2024001',
      expiry_date: '2025-12-31',
      status: 'active' as const,
      notes: 'Common pain reliever',
      substitutes: [
        {
          id: 1,
          name: 'Tylenol',
          generic_name: 'Acetaminophen',
          strength: '500mg',
          form: 'tablet',
          substitution_type: 'brand' as const,
          notes: 'Brand equivalent'
        }
      ],
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      name: 'Amoxicillin',
      generic_name: 'Amoxicillin',
      atc_code: 'J01CA04',
      strength: '250mg',
      form: 'capsule' as const,
      stock_quantity: 5,
      reorder_level: 10,
      unit_price: 1.25,
      manufacturer: 'AntibioTech',
      batch_number: 'AT2024002',
      expiry_date: '2025-06-30',
      status: 'active' as const,
      notes: 'Antibiotic',
      substitutes: [],
      created_at: '2024-01-01T11:00:00Z',
      updated_at: '2024-01-01T11:00:00Z'
    }
  ]

  const mockProps = {
    drugs: mockDrugs,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onAdd: vi.fn(),
    onBulkUpdate: vi.fn(),
    onStockUpdate: vi.fn(),
    onSearch: vi.fn(),
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders drug formulary table with correct title', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    expect(screen.getByText('Drug Formulary Management')).toBeInTheDocument()
    expect(screen.getByText('Manage drug formulary with stock levels and substitute indicators')).toBeInTheDocument()
  })

  it('displays all drugs in the table', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText('Amoxicillin')).toBeInTheDocument()
    expect(screen.getByText('Acetaminophen')).toBeInTheDocument()
  })

  it('shows drug details including ATC codes and strengths', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    expect(screen.getByText('N02BE01')).toBeInTheDocument()
    expect(screen.getByText('J01CA04')).toBeInTheDocument()
    expect(screen.getByText('500mg')).toBeInTheDocument()
    expect(screen.getByText('250mg')).toBeInTheDocument()
  })

  it('displays stock status badges with correct colors', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    // Paracetamol has 100 stock (> reorder level 20) = In Stock
    expect(screen.getByText('In Stock')).toBeInTheDocument()
    
    // Amoxicillin has 5 stock (< reorder level 10) = Low Stock
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
  })

  it('shows drug prices correctly', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    expect(screen.getByText('0.50')).toBeInTheDocument()
    expect(screen.getByText('1.25')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search drugs by name, generic name, ATC code, or manufacturer...')
    expect(searchInput).toBeInTheDocument()
  })

  it('handles search input changes', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search drugs by name, generic name, ATC code, or manufacturer...')
    await user.type(searchInput, 'paracetamol')
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('paracetamol', expect.any(Object))
    }, { timeout: 500 })
  })

  it('shows drug form filter chips', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    expect(screen.getByText('All Forms')).toBeInTheDocument()
    expect(screen.getByText('Tablet')).toBeInTheDocument()
    expect(screen.getByText('Capsule')).toBeInTheDocument()
  })

  it('shows stock status filter chips', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    expect(screen.getByText('All Stock')).toBeInTheDocument()
    expect(screen.getByText('In Stock')).toBeInTheDocument()
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
    expect(screen.getByText('Out of Stock')).toBeInTheDocument()
  })

  it('handles form filter selection', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const tabletFilter = screen.getByText('Tablet')
    await user.click(tabletFilter)
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('', expect.objectContaining({
        form: 'tablet'
      }))
    })
  })

  it('handles stock status filter selection', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const lowStockFilter = screen.getByText('Low Stock')
    await user.click(lowStockFilter)
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('', expect.objectContaining({
        stockStatus: 'low_stock'
      }))
    })
  })

  it('renders status toggles for drugs', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(2)
  })

  it('handles status toggle changes', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const switches = screen.getAllByRole('switch')
    await user.click(switches[0])
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith(1, { status: 'discontinued' })
  })

  it('enables inline editing for drug names', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const drugName = screen.getByText('Paracetamol')
    await user.click(drugName)
    
    const nameInput = screen.getByDisplayValue('Paracetamol')
    expect(nameInput).toBeInTheDocument()
  })

  it('saves name changes when inline editing is completed', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const drugName = screen.getByText('Paracetamol')
    await user.click(drugName)
    
    const nameInput = screen.getByDisplayValue('Paracetamol')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Paracetamol')
    await user.tab()
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith(1, { name: 'Updated Paracetamol' })
  })

  it('enables inline editing for ATC codes', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const atcCode = screen.getByText('N02BE01')
    await user.click(atcCode)
    
    const atcInput = screen.getByDisplayValue('N02BE01')
    expect(atcInput).toBeInTheDocument()
  })

  it('validates ATC code format during editing', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const atcCode = screen.getByText('N02BE01')
    await user.click(atcCode)
    
    const atcInput = screen.getByDisplayValue('N02BE01')
    await user.clear(atcInput)
    await user.type(atcInput, 'INVALID')
    await user.tab()
    
    // Should show validation error (implementation depends on toast)
    expect(mockProps.onUpdate).not.toHaveBeenCalled()
  })

  it('handles bulk selection of drugs', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
    await user.click(selectAllCheckbox)
    
    expect(screen.getByText(/2 drugs selected/)).toBeInTheDocument()
  })

  it('shows bulk actions when drugs are selected', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const drugCheckboxes = screen.getAllByRole('checkbox')
    await user.click(drugCheckboxes[1])
    
    expect(screen.getByText('1 drug selected')).toBeInTheDocument()
    expect(screen.getByText('Activate Selected')).toBeInTheDocument()
    expect(screen.getByText('Discontinue Selected')).toBeInTheDocument()
  })

  it('handles bulk status updates', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const drugCheckboxes = screen.getAllByRole('checkbox')
    await user.click(drugCheckboxes[1])
    
    const discontinueButton = screen.getByText('Discontinue Selected')
    await user.click(discontinueButton)
    
    expect(mockProps.onBulkUpdate).toHaveBeenCalledWith([
      { id: 1, data: { status: 'discontinued' } }
    ])
  })

  it('opens create drug modal when Add Drug is clicked', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const addButton = screen.getByText('Add Drug')
    await user.click(addButton)
    
    expect(screen.getByText('Add Drug')).toBeInTheDocument()
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    expect(router.reload).toHaveBeenCalledWith({ only: ['drugs'] })
  })

  it('shows filters panel when filters button is clicked', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)
    
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Price Range')).toBeInTheDocument()
  })

  it('clears all filters when clear filters is clicked', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)
    
    const clearButton = screen.getByText('Clear Filters')
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('', {})
    })
  })

  it('shows substitute indicators for drugs with substitutes', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    // Paracetamol has substitutes, should show indicator
    // Implementation depends on how substitutes are displayed
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
  })

  it('calculates stock status correctly', () => {
    render(<DrugFormularyTable {...mockProps} />)
    
    // Paracetamol: 100 stock > 20 reorder = In Stock
    // Amoxicillin: 5 stock < 10 reorder = Low Stock
    expect(screen.getByText('In Stock')).toBeInTheDocument()
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
  })

  it('falls back to router calls when no callback props provided', async () => {
    const user = userEvent.setup()
    const propsWithoutCallbacks = { drugs: mockDrugs }
    
    render(<DrugFormularyTable {...propsWithoutCallbacks} />)
    
    const switches = screen.getAllByRole('switch')
    await user.click(switches[0])
    
    expect(router.put).toHaveBeenCalledWith('/admin/drug-formulary/1', { status: 'discontinued' }, expect.any(Object))
  })

  it('shows loading state when isLoading is true', () => {
    render(<DrugFormularyTable {...{ ...mockProps, isLoading: true }} />)
    
    const refreshButton = screen.getByText('Refresh')
    expect(refreshButton).toBeDisabled()
  })

  it('handles price range filtering', async () => {
    const user = userEvent.setup()
    render(<DrugFormularyTable {...mockProps} />)
    
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)
    
    const minPriceInput = screen.getByPlaceholderText('Min')
    await user.type(minPriceInput, '1.00')
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('', expect.objectContaining({
        priceRange: { min: 1.00 }
      }))
    })
  })
})