# Implementation Plan

- [x] 1. Set up database schema and models for master data entities










  - Create migration files for departments, wards, beds, test_catalogs, drug_formulary, and master_data_audits tables
  - Implement Eloquent models with relationships, validation rules, and scopes
  - Set up foreign key constraints and indexes for optimal performance
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 2. Implement core service layer for master data operations





  - [x] 2.1 Create MasterDataService for cross-entity operations and audit logging


    - Write service class with methods for validation, audit trail, and cache management
    - Implement entity reference checking to prevent deletion of referenced records
    - _Requirements: 1.5, 2.4, 3.4, 4.4_

  - [x] 2.2 Create DepartmentService for department management operations


    - Implement department CRUD operations with code uniqueness validation
    - Add status management and reference checking before deactivation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.3 Create WardService for ward and bed management operations


    - Implement ward and bed CRUD operations with capacity validation
    - Add occupancy calculation and bed status management methods
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.4 Create TestCatalogService for laboratory test management


    - Implement test catalog CRUD with pricing and TAT validation
    - Add search functionality with category filtering
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.5 Create DrugFormularyService for drug management operations


    - Implement drug formulary CRUD with ATC code validation
    - Add stock management and substitute drug functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Build backend API controllers and routes





  - [x] 3.1 Create AdminController for dashboard and navigation


    - Implement dashboard method returning master data statistics
    - Add recent activity feed and navigation state management
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.2 Create MasterDataController for unified CRUD operations


    - Implement generic CRUD endpoints for all master data entities
    - Add bulk operations and data export functionality
    - _Requirements: 1.6, 2.6, 3.5, 4.5_

  - [x] 3.3 Create specialized controllers for each entity type


    - Implement DepartmentController, WardController, TestCatalogController, DrugFormularyController
    - Add entity-specific endpoints like bed matrix data and occupancy updates
    - _Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.5, 4.1-4.5_

  - [x] 3.4 Set up API routes with proper middleware and permissions


    - Define RESTful routes for all master data endpoints
    - Apply authentication and role-based permission middleware
    - _Requirements: 5.4, 5.5, 6.6_

- [x] 4. Create React components for the admin interface









  - [x] 4.1 Build AdminDashboard layout component


    - Create main dashboard layout with three-section navigation
    - Implement tab-based interface with persistent state management
    - Add breadcrumb navigation and activity feed display
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 4.2 Create DepartmentGrid component for department management




    - Build card grid layout with department icons and inline editing
    - Implement status toggles and drag-and-drop reordering functionality
    - Add department creation modal and deletion confirmation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 4.3 Create BedMatrix component for ward and bed visualization





    - Build Excel-like matrix view with color-coded bed status indicators
    - Implement ward capacity bars and real-time occupancy updates
    - Add bed detail editing and ward management functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.4 Create TestCatalogTable component for test management





    - Build searchable table with category filter chips
    - Implement inline editing for pricing and turnaround time
    - Add bulk operations and test creation functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.5 Create DrugFormularyTable component for drug management


    - Build dynamic table with stock badge color indicators
    - Implement substitute drug display and ATC code validation
    - Add stock level management and reorder alerts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Implement shared UI components and utilities





  - [x] 5.1 Create reusable form components for consistent editing patterns


    - Build InlineEditField, StatusToggle, and BulkActionToolbar components
    - Implement form validation with real-time feedback
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.2 Create data table utilities and search components


    - Build SearchInput with debouncing and FilterChips components
    - Implement DataTable with sorting, pagination, and bulk selection
    - _Requirements: 3.2, 4.2, 6.5, 6.6_

  - [x] 5.3 Create notification and error handling components


    - Build Toast notification system for success/error feedback
    - Implement ErrorBoundary and loading state components
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 6. Add form validation and error handling





  - [x] 6.1 Implement Laravel form request classes for validation


    - Create request classes for each entity with comprehensive validation rules
    - Add custom validation rules for business logic (ATC codes, capacity limits)
    - _Requirements: 1.6, 2.4, 3.4, 4.4_

  - [x] 6.2 Add frontend form validation with real-time feedback


    - Implement client-side validation matching backend rules
    - Add field-level error display and form submission handling
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.3 Create error handling middleware and exception classes


    - Implement custom exceptions for business rule violations
    - Add global error handling with user-friendly error messages
    - _Requirements: 1.5, 2.5, 3.5, 4.5_

- [x] 7. Implement caching and performance optimization





  - [x] 7.1 Add Redis caching for frequently accessed master data


    - Implement cache layers for departments, test catalogs, and drug formulary
    - Add cache invalidation on data updates
    - _Requirements: 3.2, 4.2, 5.6_

  - [x] 7.2 Optimize database queries and add proper indexing


    - Add database indexes for search and filtering operations
    - Implement eager loading for related data to prevent N+1 queries
    - _Requirements: 2.6, 3.5, 4.5_

- [x] 8. Add audit logging and activity tracking





  - [x] 8.1 Implement comprehensive audit trail system


    - Create audit logging for all master data changes
    - Add user attribution and timestamp tracking for all modifications
    - _Requirements: 5.5, 6.6_

  - [x] 8.2 Create activity feed and change history display


    - Build recent activity component for dashboard
    - Implement change history view for individual entities
    - _Requirements: 5.3, 5.5_

- [x] 9. Integrate with existing authentication and permissions





  - [x] 9.1 Set up role-based access control for admin functions


    - Configure Spatie Laravel Permission for admin panel access
    - Add granular permissions for each master data entity
    - _Requirements: 5.4, 5.5, 6.6_

  - [x] 9.2 Add permission checks to frontend components


    - Implement conditional rendering based on user permissions
    - Add permission-based button and action visibility
    - _Requirements: 5.4, 6.6_

- [x] 10. Create data import/export functionality





  - [x] 10.1 Implement CSV/Excel import for bulk data loading


    - Create import functionality for departments, tests, and drugs
    - Add data validation and error reporting for import operations
    - _Requirements: 1.6, 3.5, 4.5_

  - [x] 10.2 Add data export functionality for reporting


    - Implement export to CSV/Excel for all master data entities
    - Add filtered export based on current search/filter criteria
    - _Requirements: 5.6, 6.6_

- [x] 11. Write comprehensive tests for the admin system






  - [x] 11.1 Create unit tests for service layer business logic









    - Write tests for all service methods including validation and business rules
    - Test error scenarios and edge cases for each service
    - _Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.5, 4.1-4.5_

  - [x] 11.2 Create feature tests for API endpoints






    - Write HTTP tests for all controller endpoints with various scenarios
    - Test authentication, authorization, and validation for each endpoint
    - _Requirements: 5.1-5.6, 6.1-6.6_

  - [x] 11.3 Create React component tests






    - Write tests for all React components using React Testing Library
    - Test user interactions, form submissions, and error handling
    - _Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.5, 4.1-4.5, 5.1-5.6, 6.1-6.6_

- [x] 12. Final integration and polish





  - [x] 12.1 Integrate admin system with existing application navigation


    - Add admin panel links to main application navigation
    - Ensure consistent styling and user experience across the application
    - _Requirements: 5.1, 5.2, 6.6_

  - [x] 12.2 Add responsive design and mobile optimization


    - Ensure all admin interfaces work properly on tablet and mobile devices
    - Optimize touch interactions for mobile users
    - _Requirements: 6.6_

  - [x] 12.3 Performance testing and optimization


    - Test system performance with large datasets
    - Optimize loading times and implement progressive loading where needed
    - _Requirements: 5.6, 6.6_