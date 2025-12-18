# Hospital Management System - Production Deployment Guide

**Domain:** `app.delightssunhospital.com`  
**Last Updated:** December 15, 2025

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Server Requirements](#server-requirements)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code & Configuration
- [ ] All sensitive files are excluded from git (.env, node_modules, vendor)
- [ ] Environment variables template created (PRODUCTION_ENV_TEMPLATE.md)
- [ ] Database migrations reviewed and tested
- [ ] Asset compilation tested locally: `npm run build`
- [ ] PHP code is production-ready (no debug statements)
- [ ] All vendor dependencies are up to date: `composer update`
- [ ] All npm dependencies are up to date: `npm update`

### Security
- [ ] APP_DEBUG is set to `false`
- [ ] APP_ENV is set to `production`
- [ ] APP_KEY is generated and secure
- [ ] Database password is strong and unique
- [ ] SSL certificate is valid for `app.delightssunhospital.com`
- [ ] CORS configuration is properly set
- [ ] API rate limiting is configured
- [ ] Database backups are configured
- [ ] Error logging is configured (no sensitive data exposed)

### Infrastructure
- [ ] Hosting provider account is set up
- [ ] Domain DNS is configured
- [ ] SSL certificate is obtained and installed
- [ ] PHP 8.2+ is installed on server
- [ ] MySQL 8.0+ is installed and configured
- [ ] Redis is installed (recommended)
- [ ] Node.js 18+ is installed
- [ ] Supervisor/systemd is configured for queue worker
- [ ] Nginx/Apache is properly configured

### Documentation
- [ ] Deployment procedure is documented
- [ ] Rollback procedure is documented
- [ ] Server credentials are securely stored
- [ ] Database backup location is documented
- [ ] Team is notified of deployment

---

## Server Requirements

### Minimum Specifications
- **CPU:** 2 cores
- **RAM:** 4 GB (8 GB recommended)
- **Storage:** 50 GB SSD
- **OS:** Ubuntu 20.04 LTS or CentOS 8+

### Software Stack
```
PHP 8.2+ with extensions:
  - php-mysql
  - php-redis (recommended)
  - php-memcached
  - php-bcmath
  - php-ctype
  - php-json
  - php-mbstring
  - php-openssl
  - php-pdo
  - php-tokenizer
  - php-xml
  - php-gd
  - php-curl
  - php-fileinfo
  - php-zip

Web Server:
  - Nginx 1.20+ (recommended)
  - Apache 2.4+ (alternative)

Database:
  - MySQL 8.0+ or MariaDB 10.6+

Cache:
  - Redis 6.0+ (recommended)

Task Queue:
  - Supervisor or systemd (for Laravel queue)

Node.js:
  - Node.js 18+ LTS
  - npm 9+
```

---

## Deployment Steps

### Step 1: Clone Repository

```bash
cd /var/www
git clone https://your-repo-url.git hospital_management
cd hospital_management
```

### Step 2: Install Dependencies

```bash
# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Install Node dependencies
npm install --legacy-peer-deps

# Build frontend assets
npm run build
```

### Step 3: Environment Configuration

```bash
# Copy and edit environment file
cp .env.example .env

# Edit with your production values
nano .env

# Key values to update:
# - APP_URL=https://app.delightssunhospital.com
# - APP_ENV=production
# - APP_DEBUG=false
# - Database credentials
# - REVERB settings
# - Mail configuration

# Generate application key (if needed)
php artisan key:generate
```

### Step 4: Database Setup

```bash
# Run migrations
php artisan migrate --force

# Seed initial data (if needed)
php artisan db:seed

# Create admin user (create custom seeder if needed)
# php artisan make:seeder CreateAdminUser
```

### Step 5: Cache & Configuration

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Optimize autoloader
composer dump-autoload --optimize
```

### Step 6: File Permissions

```bash
# Set proper ownership
chown -R www-data:www-data /var/www/hospital_management

# Set proper permissions
chmod -R 755 /var/www/hospital_management
chmod -R 775 /var/www/hospital_management/storage
chmod -R 775 /var/www/hospital_management/bootstrap/cache

# Make artisan executable
chmod +x /var/www/hospital_management/artisan
```

### Step 7: Web Server Configuration

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/app.delightssunhospital.com
server {
    listen 80;
    listen [::]:80;
    server_name app.delightssunhospital.com www.app.delightssunhospital.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name app.delightssunhospital.com www.app.delightssunhospital.com;
    
    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/app.delightssunhospital.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.delightssunhospital.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /var/www/hospital_management/public;
    index index.php index.html index.htm;
    
    # Logs
    access_log /var/log/nginx/hospital_management_access.log;
    error_log /var/log/nginx/hospital_management_error.log;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_vary on;
    gzip_min_length 1024;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval';" always;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    location ~ /\.ht {
        deny all;
    }
    
    # WebSocket for Reverb
    location /app {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

#### Apache Configuration

```apache
# /etc/apache2/sites-available/app.delightssunhospital.com.conf
<VirtualHost *:80>
    ServerName app.delightssunhospital.com
    ServerAlias www.app.delightssunhospital.com
    
    Redirect / https://app.delightssunhospital.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName app.delightssunhospital.com
    ServerAlias www.app.delightssunhospital.com
    
    DocumentRoot /var/www/hospital_management/public
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/app.delightssunhospital.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/app.delightssunhospital.com/privkey.pem
    
    <Directory /var/www/hospital_management/public>
        AllowOverride All
        Require all granted
    </Directory>
    
    LogLevel warn
    ErrorLog ${APACHE_LOG_DIR}/hospital_management_error.log
    CustomLog ${APACHE_LOG_DIR}/hospital_management_access.log combined
</VirtualHost>
```

### Step 8: SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d app.delightssunhospital.com

# Auto-renewal setup
sudo systemctl enable certbot.timer
```

### Step 9: Queue Worker Setup

#### Using Supervisor

```ini
# /etc/supervisor/conf.d/hospital_management.conf
[program:hospital_management_queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/hospital_management/artisan queue:work database --sleep=3 --tries=3
autostart=true
autorestart=true
numprocs=4
redirect_stderr=true
stdout_logfile=/var/log/hospital_management_queue.log
stopwaitsecs=60
user=www-data
```

#### Using systemd

```ini
# /etc/systemd/system/hospital_queue.service
[Unit]
Description=Hospital Management Queue Worker
After=network.target

[Service]
User=www-data
ExecStart=/usr/bin/php /var/www/hospital_management/artisan queue:work database
Restart=unless-stopped
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Step 10: Reverb WebSocket Server

```bash
# Install Reverb dependencies (if not already installed)
composer require laravel/reverb

# Generate Reverb SSL certificates
php artisan reverb:install

# Start Reverb server with supervisord
# Add to supervisor configuration:
[program:reverb]
process_name=%(program_name)s
command=php /var/www/hospital_management/artisan reverb:start
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/reverb.log
user=www-data
```

### Step 11: Cron Job Setup

```bash
# Add to crontab
crontab -e

# Add the following line:
* * * * * cd /var/www/hospital_management && php artisan schedule:run >> /dev/null 2>&1
```

### Step 12: Enable Site and Restart Services

```bash
# Enable nginx site
sudo ln -s /etc/nginx/sites-available/app.delightssunhospital.com \
           /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart services
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
sudo systemctl restart supervisor
sudo systemctl restart mysql

# Check status
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo supervisorctl status
```

---

## Post-Deployment Verification

### Access & Connectivity

```bash
# Test HTTP redirect to HTTPS
curl -I http://app.delightssunhospital.com

# Test HTTPS connectivity
curl -I https://app.delightssunhospital.com

# Check SSL certificate
openssl s_client -connect app.delightssunhospital.com:443
```

### Application Health Checks

```bash
# Check application status page
curl https://app.delightssunhospital.com/status

# Check logs
tail -f /var/log/nginx/hospital_management_error.log
tail -f /var/log/nginx/hospital_management_access.log
tail -f /var/www/hospital_management/storage/logs/laravel.log

# Check queue worker
supervisorctl status hospital_management_queue

# Check Reverb WebSocket
supervisorctl status reverb
```

### Database Verification

```bash
# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();
>>> exit;

# Check migrations status
php artisan migrate:status
```

### Browser Testing

1. ✅ Open https://app.delightssunhospital.com in browser
2. ✅ Check for SSL certificate warning (should be none)
3. ✅ Test login functionality
4. ✅ Test dashboard loading
5. ✅ Test API endpoints
6. ✅ Test WebSocket connectivity (Reverb)
7. ✅ Test file uploads
8. ✅ Test email notifications
9. ✅ Check browser console for JavaScript errors
10. ✅ Test on mobile devices

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check logs for errors
tail -100 /var/www/hospital_management/storage/logs/laravel.log

# Check disk usage
df -h

# Check system resources
free -h
vmstat 1 5

# Check nginx status
curl -s http://127.0.0.1:8080/nginx_status | grep Active
```

### Weekly Maintenance

```bash
# Update OS packages (test first)
sudo apt update
sudo apt upgrade -y

# Backup database
mysqldump -u admin -p hospital_ms > /backup/hospital_ms_$(date +%Y%m%d).sql

# Check SSL certificate expiration
echo | openssl s_client -servername app.delightssunhospital.com -connect app.delightssunhospital.com:443 2>/dev/null | openssl x509 -noout -dates

# Review error logs
sudo journalctl -u nginx -n 50
sudo journalctl -u php8.2-fpm -n 50
```

### Monthly Maintenance

```bash
# Optimize database
php artisan optimize

# Clear old logs
find /var/www/hospital_management/storage/logs -mtime +30 -delete

# Review and clean up cache
php artisan cache:clear
php artisan queue:prune-batches

# Check Composer packages for security vulnerabilities
composer audit

# Check npm packages for vulnerabilities
npm audit
```

### Logging Strategy

```php
// Configure in config/logging.php or .env
LOG_CHANNEL=stack
LOG_LEVEL=info  // Use 'debug' only when troubleshooting

// Logs are stored in:
/var/www/hospital_management/storage/logs/laravel.log
```

### Monitoring Tools (Recommended)

- **Application:** Laravel Telescope, Sentry, New Relic
- **Server:** Datadog, New Relic Infrastructure, Prometheus
- **Database:** Percona Monitoring, MySQL Enterprise Monitor
- **Uptime:** UptimeRobot, StatusCake

---

## Rollback Procedures

### Quick Rollback (Last Hour)

```bash
# 1. Revert to previous git commit
cd /var/www/hospital_management
git revert HEAD
git push origin main

# 2. Clear caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# 3. Restart services
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
sudo supervisorctl restart hospital_management_queue
```

### Full Rollback to Previous Version

```bash
# 1. Stop services
sudo systemctl stop nginx
sudo systemctl stop php8.2-fpm
sudo supervisorctl stop hospital_management_queue

# 2. Restore from backup
cd /var/www
rm -rf hospital_management
git clone https://your-repo-url.git hospital_management
cd hospital_management
git checkout production-v1.0.0  # Previous version tag

# 3. Restore database
mysql -u admin -p hospital_ms < /backup/hospital_ms_backup.sql

# 4. Reinstall dependencies
composer install --no-dev --optimize-autoloader
npm install --legacy-peer-deps

# 5. Run any pending rollback migrations
php artisan migrate:rollback

# 6. Clear caches and optimize
php artisan optimize

# 7. Restart services
sudo systemctl start nginx
sudo systemctl start php8.2-fpm
sudo supervisorctl start hospital_management_queue

# 8. Verify
curl -I https://app.delightssunhospital.com
```

### Database Rollback

```bash
# 1. Stop application
sudo systemctl stop php8.2-fpm
sudo supervisorctl stop hospital_management_queue

# 2. Restore from backup
mysql -u admin -p hospital_ms < /backup/hospital_ms_pre_deploy.sql

# 3. Verify data integrity
php artisan tinker
>>> DB::table('migrations')->get();
>>> exit;

# 4. Restart application
sudo systemctl start php8.2-fpm
sudo supervisorctl start hospital_management_queue
```

---

## Troubleshooting

### Common Issues

#### 1. White Screen of Death (500 Error)

```bash
# Check logs
tail -50 /var/www/hospital_management/storage/logs/laravel.log

# Verify permissions
ls -la /var/www/hospital_management/storage/logs/

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Rebuild autoloader
composer dump-autoload --optimize
```

#### 2. Database Connection Error

```bash
# Test MySQL connection
mysql -h 127.0.0.1 -u admin -p hospital_ms

# Verify .env credentials
cat /var/www/hospital_management/.env | grep DB_

# Check MySQL is running
sudo systemctl status mysql

# Verify file permissions
sudo chown -R www-data:www-data /var/www/hospital_management
```

#### 3. Permission Denied Errors

```bash
# Fix storage directory permissions
sudo chown -R www-data:www-data /var/www/hospital_management/storage
sudo chmod -R 775 /var/www/hospital_management/storage

# Fix bootstrap cache permissions
sudo chown -R www-data:www-data /var/www/hospital_management/bootstrap/cache
sudo chmod -R 775 /var/www/hospital_management/bootstrap/cache
```

#### 4. Reverb WebSocket Not Connecting

```bash
# Check if Reverb is running
sudo supervisorctl status reverb

# Restart Reverb
sudo supervisorctl restart reverb

# Check Reverb logs
tail -50 /var/log/reverb.log

# Verify REVERB configuration
grep -A 5 "REVERB" /var/www/hospital_management/.env

# Test WebSocket connection
curl -I https://app.delightssunhospital.com/app
```

#### 5. Queue Jobs Not Processing

```bash
# Check queue worker status
sudo supervisorctl status hospital_management_queue

# Restart queue worker
sudo supervisorctl restart hospital_management_queue

# Check pending jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Monitor queue
php artisan queue:monitor
```

#### 6. High Memory Usage

```bash
# Check memory usage
free -h
ps aux | grep php | head -10

# Reduce queue processes in supervisor
# Edit /etc/supervisor/conf.d/hospital_management.conf
# Change numprocs=4 to numprocs=2

# Restart supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart hospital_management_queue
```

#### 7. Slow Response Times

```bash
# Check slow queries
mysql -u admin -p hospital_ms
> SET GLOBAL slow_query_log = 'ON';
> SHOW VARIABLES LIKE 'long_query_time';

# Check indexes on critical tables
SHOW INDEX FROM patients;
SHOW INDEX FROM consultations;

# Monitor PHP-FPM
php-fpm -t

# Check Redis cache
redis-cli INFO stats
redis-cli DBSIZE
```

### Debug Mode (Temporary)

⚠️ **NEVER enable debug mode in production for extended periods**

```bash
# Temporarily enable for debugging
php artisan tinker

# Test specific components
>>> DB::table('users')->count();
>>> Cache::get('key');
>>> Log::info('Test message');

# Exit tinker
>>> exit;
```

### Support Resources

- Laravel Documentation: https://laravel.com/docs
- Laravel Deployment: https://laravel.com/docs/deployment
- Ubuntu Server Guide: https://ubuntu.com/server
- MySQL Documentation: https://dev.mysql.com/doc/
- Nginx Documentation: https://nginx.org/en/docs/

---

## Contact & Escalation

- **Deployment Issues:** DevOps Team
- **Application Bugs:** Development Team
- **Database Issues:** Database Administrator
- **Security Concerns:** Security Team

---

**Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** Ready for Production Deployment
