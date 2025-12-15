# Production Deployment Checklist - app.delightssunhospital.com

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Environment:** Production  
**Domain:** app.delightssunhospital.com

---

## PRE-DEPLOYMENT (48 Hours Before)

### Code Review
- [ ] All code changes reviewed and approved
- [ ] No debug code or commented-out code in production files
- [ ] No hardcoded passwords or secrets in code
- [ ] Latest code pulled from main branch
- [ ] Composer dependencies updated and locked: `composer install --no-dev`
- [ ] npm dependencies updated and locked: `npm install`

### Testing
- [ ] Application builds without errors: `npm run build`
- [ ] No TypeScript or JavaScript compilation errors
- [ ] All API endpoints tested
- [ ] Login functionality tested
- [ ] Database operations tested
- [ ] File upload functionality tested
- [ ] Email sending tested (if applicable)
- [ ] WebSocket/Reverb tested

### Documentation
- [ ] Deployment plan documented
- [ ] Rollback plan documented
- [ ] Team briefed on deployment
- [ ] On-call support assigned
- [ ] Estimated downtime communicated to users
- [ ] Emergency contact list prepared

### Infrastructure
- [ ] Server provisioned and configured
- [ ] PHP 8.2+ installed and configured
- [ ] MySQL 8.0+ installed and configured
- [ ] Nginx/Apache installed and configured
- [ ] SSL certificate obtained and installed
- [ ] Redis installed (if using cache/sessions)
- [ ] Supervisor installed (for queue workers)
- [ ] Node.js 18+ installed
- [ ] Git configured on server
- [ ] Firewall rules configured

---

## DEPLOYMENT DAY - Before Deployment

### Final Verification (2 Hours Before)
- [ ] Notify users of maintenance window
- [ ] Backup current production database
- [ ] Backup current application code
- [ ] Verify backup integrity
- [ ] Stop queue workers (if running current version)
- [ ] Check disk space available (minimum 20GB free)
- [ ] Verify database connectivity
- [ ] Test SSH connection to server
- [ ] Have rollback plan ready

### Server Preparation
- [ ] Connect to production server via SSH
- [ ] Verify current services are running: `sudo systemctl status nginx php8.2-fpm mysql`
- [ ] Check disk space: `df -h`
- [ ] Check memory: `free -h`
- [ ] Set maintenance mode (optional): `php artisan down --message "Maintenance in progress"`

---

## DEPLOYMENT - Execute These Commands

### Step 1: Clone/Update Code
```bash
cd /var/www
# If new deployment:
git clone <REPO_URL> hospital_management
cd hospital_management

# If updating existing:
cd hospital_management
git fetch origin
git checkout main
git pull origin main
```
- [ ] Code cloned/updated successfully

### Step 2: Install Dependencies
```bash
composer install --no-dev --optimize-autoloader
npm install --legacy-peer-deps
```
- [ ] Composer dependencies installed
- [ ] npm dependencies installed
- [ ] No installation errors

### Step 3: Build Assets
```bash
npm run build
```
- [ ] Build completed successfully
- [ ] No build warnings/errors
- [ ] public/build directory created

### Step 4: Configure Environment
```bash
cp .env.example .env
# Edit with production values:
nano .env

# Critical values to update:
APP_ENV=production
APP_DEBUG=false
APP_URL=https://app.delightssunhospital.com
VITE_API_URL=https://app.delightssunhospital.com
DB_HOST=<production_db_host>
DB_USERNAME=<production_db_user>
DB_PASSWORD=<production_db_password>
DB_DATABASE=hospital_ms
# ... update other credentials
```
- [ ] .env file created
- [ ] All values updated correctly
- [ ] No secrets exposed in code

### Step 5: Generate Application Key (If New)
```bash
php artisan key:generate
```
- [ ] APP_KEY generated and set in .env

### Step 6: Set Permissions
```bash
chown -R www-data:www-data /var/www/hospital_management
chmod -R 755 /var/www/hospital_management
chmod -R 775 /var/www/hospital_management/storage
chmod -R 775 /var/www/hospital_management/bootstrap/cache
```
- [ ] Ownership set to www-data
- [ ] Directory permissions correct
- [ ] File permissions correct

### Step 7: Database Setup
```bash
# If new database:
php artisan migrate --force

# If updating existing:
php artisan migrate --force

# Verify migrations
php artisan migrate:status
```
- [ ] Database migrations completed
- [ ] Migration status shows all complete
- [ ] No migration errors
- [ ] Data integrity verified

### Step 8: Clear Caches
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```
- [ ] All caches cleared

### Step 9: Optimize for Production
```bash
composer dump-autoload --optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan optimize
```
- [ ] Autoloader optimized
- [ ] Configs cached
- [ ] Routes cached
- [ ] Views cached
- [ ] Application optimized

### Step 10: Configure Web Server
```bash
# For Nginx:
sudo ln -s /etc/nginx/sites-available/app.delightssunhospital.com \
           /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# For Apache:
sudo a2ensite app.delightssunhospital.com
sudo a2enmod rewrite
sudo apache2ctl configtest
sudo systemctl restart apache2
```
- [ ] Web server configuration in place
- [ ] Configuration test passes
- [ ] Web server restarted

### Step 11: Configure Services
```bash
# Queue Worker
sudo cp /var/www/hospital_management/supervisor/hospital_management.conf \
        /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start hospital_management_queue

# Reverb WebSocket
sudo supervisorctl start reverb
# Or use systemd if configured

# Cron Job
crontab -e
# Add: * * * * * cd /var/www/hospital_management && php artisan schedule:run >> /dev/null 2>&1
```
- [ ] Queue worker started
- [ ] Reverb WebSocket started
- [ ] Cron job configured

### Step 12: Verify Services
```bash
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo systemctl status mysql
sudo supervisorctl status
redis-cli ping  # If using Redis
```
- [ ] Nginx running
- [ ] PHP-FPM running
- [ ] MySQL running
- [ ] Supervisor services running
- [ ] Redis running (if applicable)

---

## POST-DEPLOYMENT - Verification

### Immediate Verification (First 30 Minutes)

#### Browser Testing
```
Test these in browser:
```
- [ ] https://app.delightssunhospital.com loads without errors
- [ ] No SSL certificate warnings
- [ ] Homepage displays correctly
- [ ] CSS/JavaScript loads properly
- [ ] Can access login page
- [ ] Can submit login form
- [ ] Can see dashboard after login

#### Application Functionality
- [ ] User login works
- [ ] Dashboard loads data
- [ ] Navigation works
- [ ] Patient search works
- [ ] Can create new record
- [ ] Can edit existing record
- [ ] Can delete record
- [ ] File upload works
- [ ] Pagination works

#### API & WebSocket
- [ ] API endpoints respond to requests
- [ ] WebSocket connects (check browser console)
- [ ] Real-time updates work
- [ ] No CORS errors in console
- [ ] No JavaScript errors in console

#### Logs
```bash
# Check for errors
tail -50 /var/www/hospital_management/storage/logs/laravel.log
tail -50 /var/log/nginx/error.log
tail -50 /var/log/php8.2-fpm.log
```
- [ ] No critical errors in application log
- [ ] No errors in web server log
- [ ] No errors in PHP-FPM log

### Extended Verification (First 2 Hours)

#### Performance
- [ ] Pages load in <2 seconds
- [ ] No obvious performance issues
- [ ] Database queries are fast
- [ ] No high memory usage

#### Queue Jobs
```bash
php artisan queue:work --stop-when-empty
```
- [ ] Queue jobs process successfully
- [ ] No failed jobs
- [ ] Jobs complete in reasonable time

#### Database
```bash
php artisan tinker
>>> DB::table('users')->count();
>>> exit;
```
- [ ] Can query database
- [ ] Data is intact
- [ ] No data corruption

#### Email (If Applicable)
- [ ] Test email sends successfully
- [ ] Email arrives in inbox
- [ ] Email formatting is correct

#### Backups
- [ ] Database backup completed
- [ ] Application backup completed
- [ ] Backup files are readable
- [ ] Backup restore tested

---

## DEPLOYMENT COMPLETE

### Final Steps
- [ ] Remove maintenance mode: `php artisan up`
- [ ] Notify team of successful deployment
- [ ] Update deployment log with timestamp
- [ ] Document any issues encountered
- [ ] Schedule post-deployment monitoring
- [ ] Update status page (if applicable)

### Monitoring (Next 24 Hours)
- [ ] Check error logs every hour
- [ ] Monitor application performance
- [ ] Verify queue workers processing
- [ ] Check for user-reported issues
- [ ] Monitor server resources
- [ ] Verify backups are running

---

## ROLLBACK - If Needed

### Quick Rollback (Do Not Proceed Without Approval)

```bash
# Step 1: Enable Maintenance Mode
php artisan down --message "Rolling back to previous version"

# Step 2: Revert Code
cd /var/www/hospital_management
git reset --hard <PREVIOUS_COMMIT>
git pull origin main

# Step 3: Reinstall Dependencies (if major changes)
composer install --no-dev --optimize-autoloader

# Step 4: Clear Caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan optimize

# Step 5: Restart Services
sudo systemctl restart nginx php8.2-fpm supervisor

# Step 6: Exit Maintenance Mode
php artisan up
```

**Rollback Approved By:** _______________  
**Approval Time:** _______________  
**Rollback Start Time:** _______________  
**Rollback Completion Time:** _______________

### Database Rollback (If Needed)
```bash
# Restore from backup
php artisan down
mysql -u admin -p hospital_ms < /backup/hospital_ms_pre_deploy.sql
php artisan migrate:rollback
php artisan up
```

- [ ] Rollback completed
- [ ] Application verified working
- [ ] Team notified

---

## Deployment Summary

**Deployment Date/Time:** _______________  
**Expected Duration:** _______________  
**Actual Duration:** _______________  
**Status:** ☐ SUCCESS ☐ PARTIAL ☐ FAILED ☐ ROLLBACK

### Issues Encountered
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### Resolution Notes
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### Performance Metrics
- Response Time: _______________
- Database Query Time: _______________
- Memory Usage: _______________
- CPU Usage: _______________

### Approval & Sign-Off
```
Deployment Lead:    ______________________  Date: ________
Technical Lead:     ______________________  Date: ________
Operations Lead:    ______________________  Date: ________
Project Manager:    ______________________  Date: ________
```

---

**Next Deployment Window:** _______________  
**Post-Deployment Meeting:** _______________  
**Performance Review Date:** _______________

---

For additional help, refer to:
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Detailed procedures
- `PRODUCTION_ENV_TEMPLATE.md` - Environment variables
- `PRODUCTION_QUICK_REFERENCE.md` - Quick lookup
