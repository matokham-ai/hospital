# Requirements Document

## Introduction

The Admin & Reporting system provides a comprehensive administrative interface for managing master data in the healthcare management system. This system organizes administrative functions into three clear sections: Master Data, System Configuration, and Reporting & Analytics. The Master Data section focuses on "setup once, referenced everywhere" entities that form the foundation of the healthcare system, including departments, wards, test catalogs, and drug formulary management.

## Requirements

### Requirement 1

**User Story:** As a hospital administrator, I want to manage departments and specialties through an intuitive interface, so that I can efficiently organize hospital services and ensure proper categorization of medical services.

#### Acceptance Criteria

1. WHEN the administrator accesses the Master Data section THEN the system SHALL display departments and specialties in a grid of cards with icons
2. WHEN the administrator views a department card THEN the system SHALL show the department name, code, and status toggle
3. WHEN the administrator clicks on a department name or code THEN the system SHALL enable inline editing
4. WHEN the administrator toggles department status THEN the system SHALL immediately update the status and reflect changes across the system
5. IF a department has active references THEN the system SHALL prevent deletion and show a warning message
6. WHEN the administrator adds a new department THEN the system SHALL validate required fields (name, code) and ensure code uniqueness

### Requirement 2

**User Story:** As a hospital administrator, I want to manage wards and beds through a visual bed matrix interface, so that I can efficiently track bed occupancy and manage hospital capacity.

#### Acceptance Criteria

1. WHEN the administrator accesses the Wards/Beds section THEN the system SHALL display a bed matrix view similar to Excel grid layout
2. WHEN the administrator views the bed matrix THEN the system SHALL color-code beds by occupancy status (green = free, red = occupied, yellow = maintenance)
3. WHEN the administrator clicks on a bed cell THEN the system SHALL show bed details including ward name, bed type, and current occupancy
4. WHEN the administrator updates bed information THEN the system SHALL validate bed capacity against ward limits
5. WHEN the administrator views ward information THEN the system SHALL display ward name, type, and capacity bar showing current occupancy percentage
6. IF bed occupancy changes THEN the system SHALL update the visual indicators in real-time

### Requirement 3

**User Story:** As a laboratory manager, I want to manage test catalogs with pricing and turnaround times, so that I can maintain accurate test information and ensure proper billing and scheduling.

#### Acceptance Criteria

1. WHEN the laboratory manager accesses the Test Catalogs section THEN the system SHALL display tests in a searchable table format
2. WHEN the manager views test listings THEN the system SHALL show filter chips for categories like "Hematology", "Microbiology", "Biochemistry"
3. WHEN the manager clicks on test price or turnaround time THEN the system SHALL enable inline editing
4. WHEN the manager searches for tests THEN the system SHALL filter results by test name, category, or code
5. WHEN the manager updates test information THEN the system SHALL validate pricing format and turnaround time values
6. IF a test has pending orders THEN the system SHALL show a warning before allowing price changes

### Requirement 4

**User Story:** As a pharmacy manager, I want to manage the drug formulary with stock status and substitute indicators, so that I can maintain accurate medication information and support clinical decision-making.

#### Acceptance Criteria

1. WHEN the pharmacy manager accesses the Drug Formulary section THEN the system SHALL display drugs in a dynamic table with ATC codes
2. WHEN the manager views drug listings THEN the system SHALL show stock badge with color logic (green = in stock, yellow = low stock, red = out of stock)
3. WHEN the manager views a drug entry THEN the system SHALL indicate if substitute drugs are available
4. WHEN the manager updates drug information THEN the system SHALL validate ATC code format and stock quantity
5. WHEN stock levels change THEN the system SHALL automatically update badge colors based on predefined thresholds
6. IF a drug is marked as discontinued THEN the system SHALL suggest available substitutes

### Requirement 5

**User Story:** As a system administrator, I want the admin panel organized into clear navigation sections, so that I can efficiently access different administrative functions without confusion.

#### Acceptance Criteria

1. WHEN the administrator accesses the admin panel THEN the system SHALL display three clear tabs or sidebar sections: Master Data, System Configuration, and Reporting & Analytics
2. WHEN the administrator clicks on a navigation section THEN the system SHALL highlight the active section and load the appropriate content
3. WHEN the administrator is in the Master Data section THEN the system SHALL show subsections for Departments, Wards/Beds, Test Catalogs, and Drug Formulary
4. WHEN the administrator navigates between sections THEN the system SHALL maintain the current state and not lose unsaved changes
5. IF the administrator has unsaved changes THEN the system SHALL prompt for confirmation before navigation
6. WHEN the administrator accesses any section THEN the system SHALL load within 2 seconds for optimal user experience

### Requirement 6

**User Story:** As a hospital administrator, I want consistent UI patterns across all master data management interfaces, so that staff can efficiently learn and use the system with minimal training.

#### Acceptance Criteria

1. WHEN users interact with any master data interface THEN the system SHALL use consistent design patterns for similar actions (edit, delete, add)
2. WHEN users perform inline editing THEN the system SHALL use the same interaction pattern across all tables and grids
3. WHEN users see status indicators THEN the system SHALL use consistent color coding and iconography throughout the application
4. WHEN users encounter validation errors THEN the system SHALL display error messages in a consistent format and location
5. WHEN users perform bulk operations THEN the system SHALL provide consistent selection and action patterns
6. IF users need help THEN the system SHALL provide contextual tooltips and help text using consistent styling