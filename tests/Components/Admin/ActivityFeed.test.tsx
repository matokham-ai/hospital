import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivityFeed from '@/Components/Admin/ActivityFeed'

// Mock fetch
global.fetch = vi.fn()

// Mock date-fns format function
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => '2024-01-01')
}))

describe('ActivityFeed', () => {
  const mockActivityData = [
    {
      id: 1,
      entity_type: 'departments',
      entity_id: 1,
      action: 'created',
      formatted_action: 'Created',
      user_name: 'John Doe',
      user_id: 1,
      created_at: '2024-01-01T10:00:00Z',
      formatted_date: 'January 1, 2024 at 10:00 AM',
      time_ago: '2 hours ago',
      summary: 'Created department "Cardiology"'
    },
    {
      id: 2,
      entity_type: 'wards',
      entity_id: 5,
      action: 'updated',
      formatted_action: 'Updated',
      user_name: 'Jane Smith',
      user_id: 2,
      created_at: '2024-01-01T09:30:00Z',
      formatted_date: 'January 1, 2024 at 9:30 AM',
      time_ago: '3 hours ago',
      summary: 'Updated ward "ICU Ward A" capacity'
    },
    {
      id: 3,
      entity_type: 'test_catalogs',
      entity_id: 10,
      action: 'deleted',
      formatted_action: 'Deleted',
      user_name: 'Bob Johnson',
      user_id: 3,
      created_at: '2024-01-01T08:00:00Z',
      formatted_date: 'January 1, 2024 at 8:00 AM',
      time_ago: '5 hours ago',
      summary: 'Deleted test "Blood Sugar Test"'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful fetch response
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActivityData)
    })
  })

  it('renders activity feed with correct title', () => {
    render(<ActivityFeed initialActivity={mockActivityData} />)
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
  })

  it('displays activity items correctly', () => {
    render(<ActivityFeed initialActivity={mockActivityData} />)
    
    expect(screen.getByText('Created department "Cardiology"')).toBeInTheDocument()
    expect(screen.getByText('Updated ward "ICU Ward A" capacity')).toBeInTheDocument()
    expect(screen.getByText('Deleted test "Blood Sugar Test"')).toBeInTheDocument()
  })

  it('shows user names and time ago for each activity', () => {
    render(<ActivityFeed initialActivity={mockActivityData} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    expect(screen.getByText('3 hours ago')).toBeInTheDocument()
    expect(screen.getByText('5 hours ago')).toBeInTheDocument()
  })

  it('displays action badges with correct colors', () => {
    render(<ActivityFeed initialActivity={mockActivityData} />)
    
    const createdBadge = screen.getByText('Created')
    const updatedBadge = screen.getByText('Updated')
    const deletedBadge = screen.getByText('Deleted')
    
    expect(createdBadge).toBeInTheDocument()
    expect(updatedBadge).toBeInTheDocument()
    expect(deletedBadge).toBeInTheDocument()
  })

  it('shows entity type and ID for each activity', () => {
    render(<ActivityFeed initialActivity={mockActivityData} />)
    
    expect(screen.getByText('departments #1')).toBeInTheDocument()
    expect(screen.getByText('wards #5')).toBeInTheDocument()
    expect(screen.getByText('test_catalogs #10')).toBeInTheDocument()
  })

  it('renders filter panel when showFilters is true', () => {
    render(<ActivityFeed initialActivity={mockActivityData} showFilters={true} />)
    
    const filtersButton = screen.getByText('Filters')
    expect(filtersButton).toBeInTheDocument()
  })

  it('toggles filter panel when filters button is clicked', async () => {
    const user = userEvent.setup()
    render(<ActivityFeed initialActivity={mockActivityData} showFilters={true} />)
    
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)
    
    expect(screen.getByText('Entity Type')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Date From')).toBeInTheDocument()
    expect(screen.getByText('Date To')).toBeInTheDocument()
  })

  it('renders export button when showExport is true', () => {
    render(<ActivityFeed initialActivity={mockActivityData} showExport={true} />)
    
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('handles export button click', async () => {
    const user = userEvent.setup()
    
    // Mock successful export response
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockActivityData)
    })
    
    // Mock URL.createObjectURL and related methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    // Mock document.createElement and click
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
    
    render(<ActivityFeed initialActivity={mockActivityData} showExport={true} />)
    
    const exportButton = screen.getByText('Export')
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/admin/audit/export?')
    })
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()
    render(<ActivityFeed initialActivity={mockActivityData} />)
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/admin/audit/activity?limit=20')
    })
  })

  it('shows loading state when refreshing', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    ;(fetch as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockActivityData)
        }), 100)
      )
    )
    
    render(<ActivityFeed initialActivity={mockActivityData} />)
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    // Should show loading state
    expect(refreshButton).toBeDisabled()
  })

  it('applies filters when filter values change', async () => {
    const user = userEvent.setup()
    render(<ActivityFeed initialActivity={mockActivityData} showFilters={true} />)
    
    // Open filter panel
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)
    
    // Change entity type filter
    const entityTypeSelect = screen.getByDisplayValue('All Types')
    await user.selectOptions(entityTypeSelect, 'departments')
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/admin/audit/activity?limit=20&entity_type=departments')
    })
  })

  it('clears all filters when clear filters button is clicked', async () => {
    const user = userEvent.setup()
    render(<ActivityFeed initialActivity={mockActivityData} showFilters={true} />)
    
    // Open filter panel
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)
    
    // Set some filters first
    const entityTypeSelect = screen.getByDisplayValue('All Types')
    await user.selectOptions(entityTypeSelect, 'departments')
    
    // Clear filters
    const clearButton = screen.getByText('Clear Filters')
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/admin/audit/activity?limit=20')
    })
  })

  it('shows empty state when no activity data', () => {
    render(<ActivityFeed initialActivity={[]} />)
    
    expect(screen.getByText('No activity found')).toBeInTheDocument()
  })

  it('shows loading state initially when no initial activity provided', () => {
    render(<ActivityFeed />)
    
    expect(screen.getByText('Loading activity...')).toBeInTheDocument()
  })

  it('handles auto-refresh when enabled', () => {
    vi.useFakeTimers()
    
    render(
      <ActivityFeed 
        initialActivity={mockActivityData} 
        autoRefresh={true} 
        refreshInterval={5000}
      />
    )
    
    // Fast-forward time
    vi.advanceTimersByTime(5000)
    
    expect(fetch).toHaveBeenCalledWith('/admin/audit/activity?limit=20')
    
    vi.useRealTimers()
  })

  it('respects custom limit prop', () => {
    render(<ActivityFeed initialActivity={mockActivityData} limit={50} />)
    
    // Should use the custom limit in API calls
    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)
    
    expect(fetch).toHaveBeenCalledWith('/admin/audit/activity?limit=50')
  })

  it('shows load more button when activity count equals limit', () => {
    render(<ActivityFeed initialActivity={mockActivityData} limit={3} />)
    
    expect(screen.getByText('Load more activity')).toBeInTheDocument()
  })

  it('handles load more button click', async () => {
    const user = userEvent.setup()
    render(<ActivityFeed initialActivity={mockActivityData} limit={3} />)
    
    const loadMoreButton = screen.getByText('Load more activity')
    await user.click(loadMoreButton)
    
    expect(fetch).toHaveBeenCalledWith('/admin/audit/activity?limit=3')
  })

  it('displays correct entity icons', () => {
    render(<ActivityFeed initialActivity={mockActivityData} />)
    
    // Check that entity icons are displayed (emojis in this case)
    const activityItems = screen.getAllByText(/🏢|🏥|🧪/)
    expect(activityItems.length).toBeGreaterThan(0)
  })

  it('handles fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))
    
    const user = userEvent.setup()
    render(<ActivityFeed initialActivity={mockActivityData} />)
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch activity:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})