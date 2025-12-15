# Admin Master Data System - User Guide

## Overview

The Admin Master Data System has been seeded with specialized users for different administrative functions. Each user has specific permissions tailored to their role in managing hospital master data.

## 🔐 Admin User Accounts

### Super Administrators

#### 1. System Admin
- **Email:** `admin@hospital.com`
- **Password:** `password@123`
- **Role:** Admin
- **Permissions:** Full system access including all admin functions
- **Description:** Complete system administrator with unrestricted access

#### 2. Demo Admin
- **Email:** `demo@hospital.com`
- **Password:** `Demo@123`
- **Role:** Admin
- **Permissions:** Full system access
- **Description:** Demo account for testing and demonstrations

### Specialized Admin Users

#### 3. Master Data Administrator
- **Email:** `masterdata@hospital.com`
- **Password:** `MasterData@2024`
- **Role:** Master Data Admin
- **Permissions:** Complete master data management
- **Description:** Primary administrator for all master data operations

#### 4. Department Manager
- **Email:** `dept.manager@hospital.com`
- **Password:** `DeptManager@2024`
- **Role:** Department Manager
- **Permissions:** Department, ward, and bed management
- **Description:** Manages organizational structure and bed allocation

#### 5. Pharmacy Manager
- **Email:** `pharmacy.manager@hospital.com`
- **Password:** `PharmacyMgr@2024`
- **Role:** Pharmacy Manager
- **Permissions:** Drug formulary and pharmacy data management
- **Description:** Manages medication catalog and pharmacy operations

#### 6. Laboratory Manager
- **Email:** `lab.manager@hospital.com`
- **Password:** `LabManager@2024`
- **Role:** Laboratory Manager
- **Permissions:** Test catalog and laboratory data management
- **Description:** Manages laboratory test catalog and pricing

#### 7. Read-Only Admin
- **Email:** `readonly.admin@hospital.com`
- **Password:** `ReadOnly@2024`
- **Role:** Read-Only Admin
- **Permissions:** View-only access to all admin functions
- **Description:** Audit and reporting access without modification rights

#### 8. Data Entry Specialist
- **Email:** `dataentry@hospital.com`
- **Password:** `DataEntry@2024`
- **Role:** Data Entry Specialist
- **Permissions:** Create and edit master data entries
- **Description:** Focused on data entry and basic maintenance tasks

#### 9. Test User
- **Email:** `test@hospital.com`
- **Password:** `Test@123`
- **Role:** Master Data Admin
- **Permissions:** Complete master data management
- **Description:** Testing account with full master data access

## 🌐 Access Points

### Admin Dashboard
- **URL:** `/admin/dashboard`
- **Description:** Main administrative interface with system overview

### Department Management
- **URL:** `/admin/departments`
- **Description:** Manage hospital departments and specialties

### Ward & Bed Management
- **URL:** `/admin/wards`
- **Description:** Manage wards and bed allocation matrix

### Test Catalog Management
- **URL:** `/admin/master-data/tests`
- **Description:** Manage laboratory test catalog and pricing

### Drug Formulary Management
- **URL:** `/admin/master-data/drugs`
- **Description:** Manage medication catalog and formulary

## 👥 Role-Based Permissions

### Admin
- Complete system access
- All master data operations
- User management
- System configuration

### Hospital Administrator
- Full master data management
- Department and ward operations
- Import/export capabilities
- Audit log access

### Master Data Admin
- Complete master data CRUD operations
- Bulk operations and imports
- Audit trail access
- Export capabilities

### Department Manager
- Department and ward management
- Bed allocation and status updates
- Limited export access
- Audit log viewing

### Pharmacy Manager
- Drug formulary management
- Medication pricing and stock
- Pharmacy-specific imports/exports
- Drug substitute management

### Laboratory Manager
- Test catalog management
- Test pricing and categories
- Lab-specific imports/exports
- Test configuration

### Read-Only Admin
- View all master data
- Access audit logs
- Generate reports
- No modification rights

### Data Entry Specialist
- Create and edit entries
- Basic master data operations
- Import capabilities
- Limited delete permissions

## 🛠️ Management Commands

### Create New Admin User
```bash
php artisan admin:create-user
```

### List All Admin Users
```bash
php artisan admin:list-users
```

### Filter Users by Role
```bash
php artisan admin:list-users --role="Master Data Admin"
```

### Seed Admin Users
```bash
php artisan db:seed --class=QuickUserSeeder
```

## 🔒 Security Notes

### Password Policy
- Minimum 8 characters
- Must contain uppercase, lowercase, numbers, and symbols
- Default passwords should be changed immediately after first login

### Account Security
- All accounts are email verified by default
- Two-factor authentication recommended for production
- Regular password rotation advised

### Permission Auditing
- All admin actions are logged in the audit trail
- User activity is tracked and monitored
- Permission changes are recorded

## 🚀 Getting Started

1. **Login to Admin Panel**
   - Navigate to `/admin/dashboard`
   - Use any of the provided admin credentials
   - Change default password on first login

2. **Explore Master Data**
   - Start with Department Management
   - Set up Wards and Beds
   - Configure Test Catalogs
   - Manage Drug Formulary

3. **Import Sample Data**
   - Use CSV import features
   - Bulk update operations
   - Test with sample datasets

4. **Monitor System**
   - Check audit logs regularly
   - Review user activity
   - Monitor system performance

## 📊 Performance Testing

Access the performance testing tool at:
- **URL:** `/admin-performance-test.html`
- **Description:** Test admin component performance with various dataset sizes

## ⚠️ Important Reminders

1. **Change Default Passwords** - All default passwords should be updated immediately
2. **Backup Before Changes** - Always backup data before bulk operations
3. **Test in Development** - Test all changes in development environment first
4. **Monitor Audit Logs** - Regularly review audit trails for security
5. **Update Permissions** - Review and update user permissions as needed

## 📞 Support

For technical support or questions about the admin system:
- Check the audit logs for error details
- Review permission settings for access issues
- Use the performance testing tool to identify bottlenecks
- Consult the API documentation for integration details