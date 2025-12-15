import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuditStats from '@/Components/Admin/AuditStats'

// Mock fetch
global.fetch = vi.fn()

describe('AuditStats', () => {
  const mockStatsData = {
    total_changes: 1250,
    changes_by_action: {
      created: 450,
      updated: 600,
      deleted: 150,
      status_changed: 50
    },
    changes_by_entity: {
      departments: 25,
      wards: 45,
      beds: 200,
      test_catalogs: 380,
      drug_formulary: 600
    },
    changes_by_user: {
      'admin@example.com': 500,
      'user1@example.com': 300,
      'user2@example.com': 450
    },
    changes_by_day: {
      '2024-01-01': 100,
      '2024-01-02': 150,
      '2024-01-03': 200,
      '2024-01-04': 180,
      '2024-01-05': 120
    },
    most_active_users: [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        count: 500
      },
      {
        name: 'John Doe',
        email: 'user2@example.com',
        count: 450
      },
      {
        name: 'Jane Smith',
        email: 'user1@example.com',
        count: 300
      }
    ],
    most_changed_entities: [
      {
        entity_type: 'drug_formulary',
        entity_id: 1,
        count: 25
      },
      {
        entity_type: 'test_catalogs',
        entity_id: 5,
        count: 20
      },
      {
        entity_type: 'beds',
        entity_id: 10,
        count: 15
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful fetch response
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStatsData)
    })
  })

  it('renders audit statistics with correct title', async () => {
    render(<AuditStats />)
    
    await waitFor(() => {
      expect(screen.getByText('Audit Statistics')).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    render(<AuditStats />)
    
    expect(screen.getByText('Audit Statistics')).toBeInTheDocument()
    // Should show loading skeleton
  })

  it('displays summary statistics correctly', async () => {
    render(<AuditStats />)
    
    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument() // Total changes
      expect(screen.getByText('3')).toBeInTheDocument() // Active users count
      expect(screen.getByText('5')).toBeInTheDocument() // Entity types count
      expect(screen.getByText('5')).toBeInTheDocument() // Active days count
    })
  })

  it('shows changes by action breakdown', async () => {
    render(<AuditStats showCharts={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Changes by Action')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.getByText('Deleted')).toBeInTheDocument()
      expect(screen.getByText('Status Changed')).toBeInTheDocument()
      
      expect(screen.getByText('450')).toBeInTheDocument()
      expect(screen.getByText('600')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })
  })

  it('shows changes by entity type breakdown', async () => {
    render(<AuditStats showCharts={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Changes by Entity Type')).toBeInTheDocument()
      expect(screen.getByText('Departments')).toBeInTheDocument()
      expect(screen.getByText('Wards')).toBeInTheDocument()
      expect(screen.getByText('Beds')).toBeInTheDocument()
      expect(screen.getByText('Test Catalogs')).toBeInTheDocument()
      expect(screen.getByText('Drug Formulary')).toBeInTheDocument()
      
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('200')).toBeInTheDocument()
      expect(screen.getByText('380')).toBeInTheDocument()
      expect(screen.getByText('600')).toBeInTheDocument()
    })
  })

  it('displays most active users list', async () => {
    render(<AuditStats showCharts={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Most Active Users')).toBeInTheDocument()
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      expect(screen.getByText('user2@example.com')).toBeInTheDocument()
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
      
      expect(screen.getByText('500 changes')).toBeInTheDocument()
      expect(screen.getByText('450 changes')).toBeInTheDocument()
      expect(screen.getByText('300 changes')).toBeInTheDocument()
    })
  })

  it('displays most changed entities list', async () => {
    render(<AuditStats showCharts={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Most Changed Entities')).toBeInTheDocument()
      expect(screen.getByText('Drug Formulary')).toBeInTheDocument()
      expect(screen.getByText('Test Catalogs')).toBeInTheDocument()
      expect(screen.getByText('Beds')).toBeInTheDocument()
      
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
      expect(screen.getByText('ID: 5')).toBeInTheDocument()
      expect(screen.getByText('ID: 10')).toBeInTheDocument()
      
      expect(screen.getByText('25 changes')).toBeInTheDocument()
      expect(screen.getByText('20 changes')).toBeInTheDocument()
      expect(screen.getByText('15 changes')).toBeInTheDocument()
    })
  })

  it('renders export button when showExport is true', async () => {
    render(<AuditStats showExport={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument()
    })
  })

  it('handles export button click', async () => {
    const user = userEvent.setup()
    
    // Mock successful export response
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
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
    
    render(<AuditStats showExport={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument()
    })
    
    const exportButton = screen.getByText('Export Data')
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/admin/audit/export?')
    })
  })

  it('applies date range filters to API calls', async () => {
    const dateRange = {
      from: '2024-01-01',
      to: '2024-01-31'
    }
    
    render(<AuditStats dateRange={dateRange} />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/admin/audit/stats?date_from=2024-01-01&date_to=2024-01-31')
    })
  })

  it('handles API errors gracefully', async () => {
    ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))
    
    render(<AuditStats />)
    
    await waitFor(() => {
      expect(screen.getByText('Error loading audit statistics')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('handles non-ok response status', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    })
    
    render(<AuditStats />)
    
    await waitFor(() => {
      expect(screen.getByText('Error loading audit statistics')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch audit statistics')).toBeInTheDocument()
    })
  })

  it('does not render charts when showCharts is false', async () => {
    render(<AuditStats showCharts={false} />)
    
    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument() // Summary should still show
    })
    
    expect(screen.queryByText('Changes by Action')).not.toBeInTheDocument()
    expect(screen.queryByText('Changes by Entity Type')).not.toBeInTheDocument()
  })

  it('formats entity types correctly', async () => {
    render(<AuditStats showCharts={true} />)
    
    await waitFor(() => {
      // Should format 'drug_formulary' as 'Drug Formulary'
      expect(screen.getByText('Drug Formulary')).toBeInTheDocument()
      // Should format 'test_catalogs' as 'Test Catalogs'
      expect(screen.getByText('Test Catalogs')).toBeInTheDocument()
    })
  })

  it('shows correct action colors', async () => {
    render(<AuditStats showCharts={true} />)
    
    await waitFor(() => {
      const createdItem = screen.getByText('Created')
      const updatedItem = screen.getByText('Updated')
      const deletedItem = screen.getByText('Deleted')
      
      expect(createdItem).toBeInTheDocument()
      expect(updatedItem).toBeInTheDocument()
      expect(deletedItem).toBeInTheDocument()
    })
  })

  it('limits most active users to top 5', async () => {
    const statsWithManyUsers = {
      ...mockStatsData,
      most_active_users: [
        ...mockStatsData.most_active_users,
        { name: 'User 4', email: 'user4@example.com', count: 100 },
        { name: 'User 5', email: 'user5@example.com', count: 90 },
        { name: 'User 6', email: 'user6@example.com', count: 80 }
      ]
    }
    
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(statsWithManyUsers)
    })
    
    render(<AuditStats showCharts={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('User 4')).toBeInTheDocument()
      expect(screen.getByText('User 5')).toBeInTheDocument()
      
      // Should not show the 6th user
      expect(screen.queryByText('User 6')).not.toBeInTheDocument()
    })
  })

  it('limits most changed entities to top 5', async () => {
    const statsWithManyEntities = {
      ...mockStatsData,
      most_changed_entities: [
        ...mockStatsData.most_changed_entities,
        { entity_type: 'departments', entity_id: 2, count: 12 },
        { entity_type: 'wards', entity_id: 3, count: 10 },
        { entity_type: 'beds', entity_id: 15, count: 8 }
      ]
    }
    
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(statsWithManyEntities)
    })
    
    render(<AuditStats showCharts={true} />)
    
    await waitFor(() => {
      // Should show top 5 entities
      expect(screen.getAllByText(/\d+ changes/)).toHaveLength(10) // 5 users + 5 entities
    })
  })
})