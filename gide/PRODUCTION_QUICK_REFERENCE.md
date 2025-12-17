# Production Deployment Quick Reference

**Domain:** `app.delightssunhospital.com`  
**Date:** December 15, 2025

---

## 1. Pre-Deployment (Perform on Development Machine)

```bash
# Verify code is ready
git status
git log --oneline -5

# Test build
npm run build

# Run tests (if applicable)
php artisan test

# Create fresh database backup (if migrating from staging)
# Generate list of commands for production
```

---

## 2. Critical Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| APP_ENV | `production` | Must be production |
| APP_DEBUG | `false` | Security critical |
| APP_URL | `https://app.delightssunhospital.com` | No trailing slash |
| VITE_API_URL | `https://app.delightssunhospital.com` | Must match APP_URL |
| DB_HOST | Your server IP | Update with actual |
| DB_PASSWORD | Strong password | Update with actual |
| REVERB_HOST | `app.delightssunhospital.com` | For WebSocket |
| REVERB_SCHEME | `wss` | Secure WebSocket |

---

## 3. Production Deployment Commands (On Server)

```bash
# 1. Clone and enter directory
cd /var/www && git clone <repo> hospital_management && cd hospital_management

# 2. Install dependencies
composer install --no-dev --optimize-autoloader
npm install --legacy-peer-deps && npm run build

# 3. Environment setup
cp .env.example .env
nano .env  # ← Edit all values

# 4. Database and caching
php artisan migrate --force
php artisan cache:clear && php artisan config:cache && php artisan route:cache

# 5. Permissions
chown -R www-data:www-data .
chmod -R 775 storage bootstrap/cache

# 6. Start services
sudo systemctl restart nginx php8.2-fpm supervisor
```

---

## 4. Verification Checklist

After deployment, verify these items:

- [ ] **HTTPS:** `curl -I https://app.delightssunhospital.com` → 200 OK
- [ ] **SSL Certificate:** No warnings in browser
- [ ] **Login:** Can login successfully
- [ ] **Database:** Can query data
- [ ] **Queue:** `sudo supervisorctl status hospital_management_queue` → RUNNING
- [ ] **Reverb:** WebSocket connects without errors
- [ ] **Logs:** No errors in `/var/www/hospital_management/storage/logs/laravel.log`
- [ ] **Assets:** CSS/JS load correctly
- [ ] **Permissions:** Files are readable by www-data
- [ ] **Performance:** Page loads in <2 seconds

---

## 5. Rollback Plan

If deployment fails:

```bash
# Quick rollback
cd /var/www/hospital_management
git reset --hard HEAD~1
php artisan cache:clear
sudo systemctl restart php8.2-fpm
```

For database rollback:
```bash
# Restore from backup
mysql -u admin -p hospital_ms < /backup/backup_$(date +%Y%m%d).sql
```

---

## 6. Production Monitoring

**Daily:**
- Check error logs: `tail -50 /var/www/hospital_management/storage/logs/laravel.log`
- Verify services: `sudo supervisorctl status`
- Check disk space: `df -h`

**Weekly:**
- Review slow queries
- Check SSL certificate expiration
- Test backups restore
- Monitor database size

**Monthly:**
- Security updates
- Performance optimization
- Database maintenance
- Clean old logs

---

## 7. Common Issues & Quick Fixes

| Issue | Command |
|-------|---------|
| 500 Error | `php artisan cache:clear && composer dump-autoload` |
| Queue stuck | `sudo supervisorctl restart hospital_management_queue` |
| WebSocket down | `sudo supervisorctl restart reverb` |
| Permission denied | `sudo chown -R www-data:www-data /var/www/hospital_management` |
| High memory | `sudo supervisorctl stop hospital_management_queue` (then investigate) |
| Slow queries | Check database indexes and slow query log |

---

## 8. Important Paths

```
Application Root:     /var/www/hospital_management
Configuration:        /var/www/hospital_management/.env
Logs:                 /var/www/hospital_management/storage/logs/laravel.log
Database Backups:     /backup/
Nginx Config:         /etc/nginx/sites-available/app.delightssunhospital.com
Supervisor Config:    /etc/supervisor/conf.d/hospital_management.conf
SSL Certificate:      /etc/letsencrypt/live/app.delightssunhospital.com/
```

---

## 9. Support Contacts

- **DevOps/Infrastructure:** [Contact Info]
- **Database Administrator:** [Contact Info]
- **Security Team:** [Contact Info]
- **On-Call Support:** [Contact Info]

---

## 10. Post-Deployment Notes

After successful deployment:

1. ✅ Document any custom configurations
2. ✅ Update server documentation
3. ✅ Brief team on deployment
4. ✅ Set up monitoring alerts
5. ✅ Plan backup testing schedule
6. ✅ Schedule next maintenance window

---

**Ready for Production:** YES ✅

All environment variables have been updated to use `app.delightssunhospital.com`  
All security settings are configured for production  
Documentation is complete and ready

See `PRODUCTION_ENV_TEMPLATE.md` for all environment variables  
See `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed deployment steps
