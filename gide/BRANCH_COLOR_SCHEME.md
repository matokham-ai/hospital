# Branch Management Color Scheme

## 🎨 Color Palette: Teal & Green

### Primary Colors
- **Teal**: `teal-50`, `teal-100`, `teal-400`, `teal-500`, `teal-600`
- **Emerald**: `emerald-50`, `emerald-100`, `emerald-500`, `emerald-600`, `emerald-700`
- **Green**: `green-50`, `green-500`, `green-600`

### Color Usage

#### Branch Cards (`/admin/branches`)
- **Card Border Hover**: `border-teal-400`
- **Icon Background**: `from-teal-500 to-emerald-600` (gradient)
- **Title Hover**: `text-teal-600`
- **Stats Background**: `from-teal-50 to-emerald-50` (gradient)
- **Staff Icon**: `text-teal-600`
- **Payments Icon**: `text-emerald-600`
- **Invoices Icon**: `text-green-600`
- **Primary Button**: `from-teal-500 to-emerald-600` (gradient)
- **Button Hover**: `from-teal-600 to-emerald-700` (gradient)

#### Branch Dashboard (`/admin/branches/{id}/dashboard`)
- **Background**: `from-teal-50 via-emerald-50 to-green-50` (gradient)
- **Header Icon**: `from-teal-500 to-emerald-600` (gradient)

**Financial Cards:**
- Green: Revenue (positive)
- Teal: Growth Rate
- Orange: Outstanding (warning)
- Emerald: Collection Rate

**Patient Statistics:**
- Teal: Total Patients
- Emerald: Active Patients
- Green: New This Month
- Teal: Growth Rate

**Operations:**
- Teal: Appointments
- Emerald: Bed Occupancy

**Staff:**
- Teal: Section header & doctors
- Emerald: Nurses
- Teal: Active badge

**Pharmacy:**
- Emerald: Section header

**Laboratory:**
- Teal: Section header
- Emerald: Completed badge

#### Branch Selector Dropdown
- **Trigger Hover**: `hover:border-teal-400`
- **All Branches Icon**: `text-teal-600`
- **Selected Branch Icon**: `text-emerald-600`
- **Active Indicator Dot**: `bg-emerald-500`

### Design Rationale

1. **Teal**: Primary brand color, used for main actions and headers
2. **Emerald**: Secondary color, used for positive states and success
3. **Green**: Accent color, used for growth and active states
4. **Gradients**: Create depth and modern feel
5. **Consistency**: Same color scheme across all branch-related pages

### Accessibility
- All colors meet WCAG AA contrast requirements
- Icons paired with text for clarity
- Color is not the only indicator of state (badges, text also used)
