import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BedMatrix from '@/Components/Admin/BedMatrix'

// Mock the router
vi.mock('@inertiajs/react', () => ({
  router: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    reload: vi.fn(),
  }
}))

describe('BedMatrix', () => {
  const mockWards = [
    {
      id: 1,
      wardid: 'WARD001',
      name: 'ICU Ward A',
      code: 'ICU-A',
      ward_type: 'ICU' as const,
      total_beds: 10,
      floor_number: 2,
      description: 'Intensive Care Unit Ward A',
      status: 'active' as const,
      department: {
        id: 1,
        name: 'Critical Care'
      },
      beds: [
        {
          id: 1,
          bed_number: 'ICU-A-001',
          bed_type: 'ICU' as const,
          status: 'available' as const,
          last_occupied_at: '2024-01-01T08:00:00Z',
          maintenance_notes: ''
        },
        {
          id: 2,
          bed_number: 'ICU-A-002',
          bed_type: 'ICU' as const,
          status: 'occupied' as const,
          last_occupied_at: '2024-01-01T10:00:00Z',
          maintenance_notes: ''
        },
        {
          id: 3,
          bed_number: 'ICU-A-003',
          bed_type: 'ICU' as const,
          status: 'maintenance' as const,
          last_occupied_at: '2024-01-01T06:00:00Z',
          maintenance_notes: 'Cleaning in progress'
        }
      ],
      occupancy_rate: 33,
      available_beds: 7
    },
    {
      id: 2,
      wardid: 'WARD002',
      name: 'General Ward B',
      code: 'GEN-B',
      ward_type: 'GENERAL' as const,
      total_beds: 20,
      floor_number: 1,
      description: 'General medical ward',
      status: 'active' as const,
      department: {
        id: 2,
        name: 'Internal Medicine'
      },
      beds: [],
      occupancy_rate: 0,
      available_beds: 0
    }
  ]

  const mockProps = {
    wards: mockWards,
    onBedUpdate: vi.fn(),
    onWardUpdate: vi.fn(),
    onRefresh: vi.fn(),
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders bed matrix with correct title and description', () => {
    render(<BedMatrix {...mockProps} />)
    
    expect(screen.getByText('Bed Matrix Management')).toBeInTheDocument()
    expect(screen.getByText('Visual bed occupancy and ward management interface')).toBeInTheDocument()
  })

  it('displays overall statistics correctly', () => {
    render(<BedMatrix {...mockProps} />)
    
    expect(screen.getByText('3')).toBeInTheDocument() // Total beds
    expect(screen.getByText('1')).toBeInTheDocument() // Occupied beds  
    expect(screen.getByText('1')).toBeInTheDocument() // Available beds
    expect(screen.getByText('33%')).toBeInTheDocument() // Occupancy rate
  })

  it('renders ward cards with correct information', () => {
    render(<BedMatrix {...mockProps} />)
    
    expect(screen.getByText('ICU Ward A')).toBeInTheDocument()
    expect(screen.getByText('General Ward B')).toBeInTheDocument()
    expect(screen.getByText('Critical Care • Floor 2 • 3 beds')).toBeInTheDocument()
    expect(screen.getByText('Internal Medicine • Floor 1 • 0 beds')).toBeInTheDocument()
  })

  it('displays ward type badges correctly', () => {
    render(<BedMatrix {...mockProps} />)
    
    expect(screen.getByText('ICU')).toBeInTheDocument()
    expect(screen.getByText('GENERAL')).toBeInTheDocument()
  })

  it('shows occupancy progress bars for wards', () => {
    render(<BedMatrix {...mockProps} />)
    
    // Should show occupancy percentage
    expect(screen.getByText('Occupancy: 33%')).toBeInTheDocument()
    expect(screen.getByText('Occupancy: 0%')).toBeInTheDocument()
  })

  it('renders bed buttons with correct status colors', () => {
    render(<BedMatrix {...mockProps} />)
    
    const bedButtons = screen.getAllByRole('button', { name: /ICU-A-/ })
    expect(bedButtons).toHaveLength(3)
    
    expect(screen.getByText('ICU-A-001')).toBeInTheDocument()
    expect(screen.getByText('ICU-A-002')).toBeInTheDocument()
    expect(screen.getByText('ICU-A-003')).toBeInTheDocument()
  })

  it('opens bed edit dialog when bed is clicked', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const bedButton = screen.getByText('ICU-A-001')
    await user.click(bedButton)
    
    expect(screen.getByText('Edit Bed Details')).toBeInTheDocument()
    expect(screen.getByText(/Update bed information and status for ICU-A-001/)).toBeInTheDocument()
  })

  it('populates bed edit form with current bed data', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const bedButton = screen.getByText('ICU-A-001')
    await user.click(bedButton)
    
    expect(screen.getByDisplayValue('ICU-A-001')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ICU')).toBeInTheDocument()
    expect(screen.getByDisplayValue('available')).toBeInTheDocument()
  })

  it('handles bed update when form is submitted', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const bedButton = screen.getByText('ICU-A-001')
    await user.click(bedButton)
    
    // Change bed status
    const statusSelect = screen.getByDisplayValue('available')
    await user.selectOptions(statusSelect, 'occupied')
    
    // Submit form
    const updateButton = screen.getByText('Update Bed')
    await user.click(updateButton)
    
    expect(mockProps.onBedUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
      status: 'occupied'
    }))
  })

  it('opens ward edit dialog when ward edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const editButtons = screen.getAllByRole('button', { name: '' }) // Edit buttons with just icon
    await user.click(editButtons[0])
    
    expect(screen.getByText('Edit Ward Details')).toBeInTheDocument()
    expect(screen.getByText('Update ward information and configuration')).toBeInTheDocument()
  })

  it('populates ward edit form with current ward data', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const editButtons = screen.getAllByRole('button', { name: '' })
    await user.click(editButtons[0])
    
    expect(screen.getByDisplayValue('ICU Ward A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ICU-A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ICU')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('handles ward update when form is submitted', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const editButtons = screen.getAllByRole('button', { name: '' })
    await user.click(editButtons[0])
    
    // Change ward name
    const nameInput = screen.getByDisplayValue('ICU Ward A')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated ICU Ward A')
    
    // Submit form
    const updateButton = screen.getByText('Update Ward')
    await user.click(updateButton)
    
    expect(mockProps.onWardUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
      name: 'Updated ICU Ward A'
    }))
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    expect(mockProps.onRefresh).toHaveBeenCalled()
  })

  it('shows loading state when refreshing', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    expect(screen.getByText('Refreshing...')).toBeInTheDocument()
  })

  it('shows empty state for ward with no beds', () => {
    render(<BedMatrix {...mockProps} />)
    
    expect(screen.getByText('No beds configured for this ward')).toBeInTheDocument()
    expect(screen.getByText('Add Beds')).toBeInTheDocument()
  })

  it('displays bed tooltips on hover', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const bedButton = screen.getByText('ICU-A-001')
    await user.hover(bedButton)
    
    // Tooltip content should appear
    await waitFor(() => {
      expect(screen.getByText('Type: ICU')).toBeInTheDocument()
      expect(screen.getByText('Status: Available')).toBeInTheDocument()
    })
  })

  it('shows maintenance notes in bed tooltip when available', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const maintenanceBed = screen.getByText('ICU-A-003')
    await user.hover(maintenanceBed)
    
    await waitFor(() => {
      expect(screen.getByText('Note: Cleaning in progress')).toBeInTheDocument()
    })
  })

  it('calculates and displays correct occupancy statistics', () => {
    render(<BedMatrix {...mockProps} />)
    
    // Total beds: 3 (from ICU Ward A)
    // Occupied: 1 (ICU-A-002)
    // Available: 1 (ICU-A-001) 
    // Maintenance: 1 (ICU-A-003)
    
    expect(screen.getByText('3')).toBeInTheDocument() // Total beds
    expect(screen.getByText('1')).toBeInTheDocument() // Occupied beds
    expect(screen.getByText('1')).toBeInTheDocument() // Available beds
  })

  it('handles bed form validation', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const bedButton = screen.getByText('ICU-A-001')
    await user.click(bedButton)
    
    // Clear required field
    const bedNumberInput = screen.getByDisplayValue('ICU-A-001')
    await user.clear(bedNumberInput)
    
    const updateButton = screen.getByText('Update Bed')
    await user.click(updateButton)
    
    // Should not call onBedUpdate with empty bed number
    expect(mockProps.onBedUpdate).not.toHaveBeenCalled()
  })

  it('handles ward form validation', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    const editButtons = screen.getAllByRole('button', { name: '' })
    await user.click(editButtons[0])
    
    // Clear required field
    const wardNameInput = screen.getByDisplayValue('ICU Ward A')
    await user.clear(wardNameInput)
    
    const updateButton = screen.getByText('Update Ward')
    await user.click(updateButton)
    
    // Should not call onWardUpdate with empty ward name
    expect(mockProps.onWardUpdate).not.toHaveBeenCalled()
  })

  it('closes dialogs when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<BedMatrix {...mockProps} />)
    
    // Open bed dialog
    const bedButton = screen.getByText('ICU-A-001')
    await user.click(bedButton)
    
    // Cancel dialog
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(screen.queryByText('Edit Bed Details')).not.toBeInTheDocument()
  })

  it('shows disabled state when loading', () => {
    render(<BedMatrix {...{ ...mockProps, isLoading: true }} />)
    
    const refreshButton = screen.getByText('Refresh')
    expect(refreshButton).toBeDisabled()
  })

  it('handles different bed statuses with correct styling', () => {
    render(<BedMatrix {...mockProps} />)
    
    // Each bed status should have different visual indicators
    const availableBed = screen.getByText('ICU-A-001')
    const occupiedBed = screen.getByText('ICU-A-002')
    const maintenanceBed = screen.getByText('ICU-A-003')
    
    expect(availableBed).toBeInTheDocument()
    expect(occupiedBed).toBeInTheDocument()
    expect(maintenanceBed).toBeInTheDocument()
  })
})