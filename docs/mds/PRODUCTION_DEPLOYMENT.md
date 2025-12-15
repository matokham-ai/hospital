# Production Deployment Guide

## Database Issues Fixed

### ✅ Department Model Status Column Issue
**Problem**: The Department model was looking for a `status` column but the database had `is_active`.

**Fixed**:
- Updated `app/Models/Department.php` to use `is_active` (boolean) instead of `status` (string)
- Fixed the `scopeActive()` method to use `where('is_active', true)`
- Updated validation rules and fillable fields

## Production Setup Steps

### 1. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Configure database settings
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_production_db
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

# Set application environment
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Generate application key
php artisan key:generate
```

### 2. Database Setup

```bash
# Run migrations
php artisan migrate

# Seed production roles and permissions (NO demo users)
php artisan db:seed --class=ProductionRolePermissionSeeder
```

### 3. Create Admin Users

```bash
# Create your first admin user
php artisan admin:create-user

# Or create with parameters
php artisan admin:create-user \
  --name="System Administrator" \
  --email="admin@yourhospital.com" \
  --password="SecurePassword123!" \
  --role="Admin"
```

### 4. Security Configuration

```bash
# Clear and cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set proper file permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 5. Web Server Configuration

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/project/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## Production Features

### ✅ Removed Demo Content
- **No demo accounts** in production seeder
- **No demo login buttons** on login page
- **Clean login interface** for production use
- **Professional messaging** instead of demo instructions

### ✅ Enhanced Security
- **Role-based authentication** with proper validation
- **Secure password requirements** (minimum 8 characters)
- **Email verification** for new accounts
- **Rate limiting** on login attempts
- **CSRF protection** enabled

### ✅ User Management
- **Command-line user creation** for secure admin setup
- **Role assignment** during user creation
- **Email verification** timestamps
- **Proper password hashing**

## Available Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Admin** | System Administrator | Full system access |
| **Hospital Administrator** | Hospital Operations | Master data management |
| **Doctor** | Medical Professional | Prescriptions, lab orders |
| **Nurse** | Nursing Staff | Patient care, vitals |
| **Pharmacist** | Pharmacy Staff | Drug dispensing, inventory |
| **Lab Technician** | Laboratory Staff | Test results, lab management |
| **Radiologist** | Imaging Specialist | Medical imaging, reports |
| **Cashier** | Billing Staff | Payments, billing |
| **Receptionist** | Front Desk | Appointments, registration |

## User Creation Examples

### Create System Administrator
```bash
php artisan admin:create-user \
  --name="John Smith" \
  --email="admin@hospital.com" \
  --role="Admin"
```

### Create Hospital Administrator
```bash
php artisan admin:create-user \
  --name="Jane Doe" \
  --email="hospital.admin@hospital.com" \
  --role="Hospital Administrator"
```

### Create Doctor
```bash
php artisan admin:create-user \
  --name="Dr. Michael Johnson" \
  --email="dr.johnson@hospital.com" \
  --role="Doctor"
```

## Login System Features

### ✅ Professional UI
- **Modern design** with medical color scheme
- **Responsive layout** for all devices
- **Smooth animations** and transitions
- **Accessibility compliant**

### ✅ Dynamic Role Management
- **Database-driven roles** (no hardcoded lists)
- **Automatic role fetching** from permissions system
- **Visual role selection** with descriptions
- **Role-based redirects** after login

### ✅ Enhanced UX
- **Auto-focus** on email field
- **Password visibility toggle**
- **Remember me** functionality
- **Loading states** with visual feedback
- **Clear error messages**

## Security Checklist

- [ ] Environment set to production (`APP_ENV=production`)
- [ ] Debug mode disabled (`APP_DEBUG=false`)
- [ ] Secure database credentials configured
- [ ] Application key generated
- [ ] File permissions set correctly
- [ ] HTTPS configured (recommended)
- [ ] Firewall rules configured
- [ ] Regular backups scheduled
- [ ] Admin users created with strong passwords
- [ ] Demo content removed

## Maintenance Commands

```bash
# List all users and their roles
php artisan admin:list-users

# Clear application cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimize for production
php artisan optimize
```

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();
```

### Permission Issues
```bash
# Fix storage permissions
sudo chown -R www-data:www-data storage
sudo chmod -R 755 storage
```

### Role/Permission Issues
```bash
# Re-seed roles and permissions
php artisan db:seed --class=ProductionRolePermissionSeeder
```

## Support

For technical support or issues:
1. Check application logs: `storage/logs/laravel.log`
2. Verify database connectivity
3. Ensure proper file permissions
4. Contact your system administrator

---

**Note**: This system is now production-ready with all demo content removed and proper security measures in place.