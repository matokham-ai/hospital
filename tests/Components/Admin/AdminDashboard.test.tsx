import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { router } from '@inertiajs/react'
import AdminDashboard from '@/Pages/Admin/AdminDashboard'

// Mock the components that are imported
vi.mock('@/Components/Admin/ActivityFeed', () => ({
  default: ({ limit, showFilters, autoRefresh }: any) => (
    <div data-testid="activity-feed">
      Activity Feed - Limit: {limit}, Filters: {showFilters ? 'true' : 'false'}, AutoRefresh: {autoRefresh ? 'true' : 'false'}
    </div>
  )
}))

vi.mock('@/Components/Admin/AuditStats', () => ({
  default: ({ showCharts, showExport }: any) => (
    <div data-testid="audit-stats">
      Audit Stats - Charts: {showCharts ? 'true' : 'false'}, Export: {showExport ? 'true' : 'false'}
    </div>
  )
}))

vi.mock('@/Layouts/HMSLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="hms-layout">{children}</div>
}))

vi.mock('@/hooks/usePermissions', () => ({
  CanAccess: ({ children, permission }: { children: React.ReactNode; permission?: string }) => (
    <div data-testid={`can-access-${permission}`}>{children}</div>
  ),
  usePermissions: () => ({
    can: vi.fn((permission: string) => permission !== 'restricted-permission')
  })
}))

describe('AdminDashboard', () => {
  const mockProps = {
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    },
    permissions: ['view departments', 'view wards', 'view beds', 'view test catalogs', 'view drug formulary', 'view audit logs'],
    masterDataStats: {
      departments: 5,
      wards: 12,
      beds: 150,
      tests: 200,
      drugs: 500
    },
    recentActivity: [
      {
        id: 1,
        entity_type: 'departments',
        entity_id: 1,
        action: 'created' as const,
        user_name: 'Admin User',
        changes: {},
        created_at: '2024-01-01T10:00:00Z'
      }
    ],
    systemStats: {
      totalUsers: 25,
      activeUsers: 15,
      todayAppointments: 45,
      pendingBills: 12,
      systemHealth: 'good' as const
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location.hash
    window.location.hash = ''
  })

  it('renders the admin dashboard with correct title and description', () => {
    render(<AdminDashboard {...mockProps} />)
    
    expect(screen.getByText('Administration Panel')).toBeInTheDocument()
    expect(screen.getByText('Manage system configuration, master data, and generate reports')).toBeInTheDocument()
  })

  it('displays system statistics correctly', () => {
    render(<AdminDashboard {...mockProps} />)
    
    expect(screen.getByText('25')).toBeInTheDocument() // Total Users
    expect(screen.getByText('15')).toBeInTheDocument() // Active Users
    expect(screen.getByText('45')).toBeInTheDocument() // Today Appointments
    expect(screen.getByText('GOOD')).toBeInTheDocument() // System Health
  })

  it('displays master data statistics in cards', () => {
    render(<AdminDashboard {...mockProps} />)
    
    expect(screen.getByText('5')).toBeInTheDocument() // Departments count
    expect(screen.getByText('12')).toBeInTheDocument() // Wards count
    expect(screen.getByText('150 beds')).toBeInTheDocument() // Beds count
    expect(screen.getByText('200')).toBeInTheDocument() // Tests count
    expect(screen.getByText('500')).toBeInTheDocument() // Drugs count
  })

  it('renders navigation tabs correctly', () => {
    render(<AdminDashboard {...mockProps} />)
    
    expect(screen.getByText('Master Data')).toBeInTheDocument()
    expect(screen.getByText('System Config')).toBeInTheDocument()
    expect(screen.getByText('Reporting & Analytics')).toBeInTheDocument()
  })

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard {...mockProps} />)
    
    const systemConfigTab = screen.getByText('System Config')
    await user.click(systemConfigTab)
    
    expect(screen.getByText('System Configuration')).toBeInTheDocument()
    expect(screen.getByText('Configure system settings, user management, and security options')).toBeInTheDocument()
  })

  it('updates URL hash when tab changes', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard {...mockProps} />)
    
    const reportingTab = screen.getByText('Reporting & Analytics')
    await user.click(reportingTab)
    
    expect(window.location.hash).toBe('#reporting')
  })

  it('initializes with correct tab from URL hash', () => {
    window.location.hash = '#system-config'
    render(<AdminDashboard {...mockProps} />)
    
    expect(screen.getByText('System Configuration')).toBeInTheDocument()
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard {...mockProps} />)
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    expect(router.reload).toHaveBeenCalledWith({ 
      only: ['masterDataStats', 'recentActivity', 'systemStats'] 
    })
  })

  it('shows loading state when refreshing', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard {...mockProps} />)
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    expect(screen.getByText('Refreshing...')).toBeInTheDocument()
  })

  it('renders master data management cards with correct links', () => {
    render(<AdminDashboard {...mockProps} />)
    
    expect(screen.getByText('Manage Departments →')).toBeInTheDocument()
    expect(screen.getByText('Manage Wards & Beds →')).toBeInTheDocument()
    expect(screen.getByText('Manage Test Catalogs →')).toBeInTheDocument()
    expect(screen.getByText('Manage Drug Formulary →')).toBeInTheDocument()
  })

  it('renders activity feed in master data tab', () => {
    render(<AdminDashboard {...mockProps} />)
    
    const activityFeed = screen.getByTestId('activity-feed')
    expect(activityFeed).toBeInTheDocument()
    expect(activityFeed).toHaveTextContent('Limit: 10, Filters: false, AutoRefresh: true')
  })

  it('renders audit stats in reporting tab', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard {...mockProps} />)
    
    const reportingTab = screen.getByText('Reporting & Analytics')
    await user.click(reportingTab)
    
    const auditStats = screen.getByTestId('audit-stats')
    expect(auditStats).toBeInTheDocument()
    expect(auditStats).toHaveTextContent('Charts: true, Export: true')
  })

  it('renders full activity feed in reporting tab', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard {...mockProps} />)
    
    const reportingTab = screen.getByText('Reporting & Analytics')
    await user.click(reportingTab)
    
    const activityFeeds = screen.getAllByTestId('activity-feed')
    expect(activityFeeds).toHaveLength(2) // One in master data, one in reporting
    
    // Check the reporting tab activity feed has different props
    const reportingActivityFeed = activityFeeds[1]
    expect(reportingActivityFeed).toHaveTextContent('Limit: 50, Filters: true, AutoRefresh: false')
  })

  it('handles browser back/forward navigation', () => {
    render(<AdminDashboard {...mockProps} />)
    
    // Simulate hash change event
    window.location.hash = '#system-config'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    
    expect(screen.getByText('System Configuration')).toBeInTheDocument()
  })

  it('renders breadcrumb navigation', () => {
    render(<AdminDashboard {...mockProps} />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Administration')).toBeInTheDocument()
  })

  it('displays last updated time', () => {
    render(<AdminDashboard {...mockProps} />)
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
  })

  it('renders system config placeholder content', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard {...mockProps} />)
    
    const systemConfigTab = screen.getByText('System Config')
    await user.click(systemConfigTab)
    
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('System Settings')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
  })

  it('renders reporting placeholder content', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard {...mockProps} />)
    
    const reportingTab = screen.getByText('Reporting & Analytics')
    await user.click(reportingTab)
    
    expect(screen.getByText('Master Data Reports')).toBeInTheDocument()
    expect(screen.getByText('System Analytics')).toBeInTheDocument()
    expect(screen.getByText('User Activity Reports')).toBeInTheDocument()
  })

  it('renders without system stats when not provided', () => {
    const propsWithoutSystemStats = { ...mockProps }
    delete propsWithoutSystemStats.systemStats
    
    render(<AdminDashboard {...propsWithoutSystemStats} />)
    
    expect(screen.queryByText('Total Users')).not.toBeInTheDocument()
  })

  it('handles invalid hash gracefully', () => {
    window.location.hash = '#invalid-tab'
    render(<AdminDashboard {...mockProps} />)
    
    // Should default to master-data tab
    expect(screen.getByText('Master Data Management')).toBeInTheDocument()
  })
})