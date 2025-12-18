# Production Environment Configuration Template

This template provides all required environment variables for deploying the Hospital Management System to production on the domain `app.delightssunhospital.com`.

## Required .env Variables for Production

```dotenv
# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
APP_NAME="Hospital Management System"
APP_ENV=production
APP_KEY=base64:LDAezxeZaR14Gp/kyLj2rq3uRBupoHG3OIxhCSKBBAE=
APP_DEBUG=false
APP_URL=https://app.delightssunhospital.com
ASSET_URL=https://app.delightssunhospital.com

# ============================================================================
# LOCALIZATION
# ============================================================================
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US
APP_TIMEZONE=UTC

# ============================================================================
# API CONFIGURATION
# ============================================================================
VITE_API_URL=https://app.delightssunhospital.com

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hospital_ms
DB_USERNAME=admin
DB_PASSWORD=P@ssw0rd$$$$

# For production, consider using separate read replicas:
# DB_READ_HOST=read-replica.example.com
# DB_READ_PORT=3306

# ============================================================================
# CACHE CONFIGURATION
# ============================================================================
# For production, use Redis for better performance (recommended)
CACHE_STORE=redis
# CACHE_STORE=file
CACHE_PREFIX=hospital_ms

# Redis cache configuration (recommended for production)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
REDIS_CACHE_DB=1
REDIS_TIMEOUT=60

# ============================================================================
# SESSION CONFIGURATION
# ============================================================================
SESSION_DRIVER=database
SESSION_LIFETIME=720
SESSION_EXPIRE_ON_CLOSE=false
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.delightssunhospital.com
SESSION_SECURE_COOKIES=true

# ============================================================================
# SANCTUM AUTHENTICATION
# ============================================================================
SANCTUM_STATEFUL_DOMAINS=app.delightssunhospital.com,www.app.delightssunhospital.com
SANCTUM_TOKEN_PREFIX=

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================
LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=info

# ============================================================================
# MAIL CONFIGURATION
# ============================================================================
MAIL_MAILER=smtp
MAIL_SCHEME=tls
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM_ADDRESS=no-reply@delightssunhospital.com
MAIL_FROM_NAME="${APP_NAME}"

# ============================================================================
# BROADCAST CONFIGURATION
# ============================================================================
BROADCAST_CONNECTION=reverb

# ============================================================================
# REVERB WEBSOCKET CONFIGURATION
# ============================================================================
REVERB_APP_ID=846932
REVERB_APP_KEY=hr2c2s55un1q3kwfyvsq
REVERB_APP_SECRET=zagdukivwiil7e8ztmw1

# Server-side Reverb configuration
REVERB_SERVER_HOST=app.delightssunhospital.com
REVERB_SERVER_PORT=443
REVERB_SERVER_PATH=
REVERB_SCHEME=wss

# Client-side Reverb configuration
REVERB_HOST=app.delightssunhospital.com
REVERB_PORT=443
REVERB_SCHEME=wss

# Vite Reverb configuration
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"

# ============================================================================
# QUEUE CONFIGURATION
# ============================================================================
QUEUE_CONNECTION=database
# For production, consider using:
# QUEUE_CONNECTION=redis

# ============================================================================
# AWS CONFIGURATION (if needed)
# ============================================================================
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

# ============================================================================
# FILESYSTEM CONFIGURATION
# ============================================================================
FILESYSTEM_DISK=local
# For production, consider using S3:
# FILESYSTEM_DISK=s3

# ============================================================================
# MAINTENANCE MODE
# ============================================================================
APP_MAINTENANCE_DRIVER=file

# ============================================================================
# PHP CLI CONFIGURATION
# ============================================================================
PHP_CLI_SERVER_WORKERS=4

# ============================================================================
# VITE APP NAME
# ============================================================================
VITE_APP_NAME="${APP_NAME}"
```

## Important Notes

### Key Changes from Development

1. **APP_ENV**: Changed from `local` to `production`
2. **APP_DEBUG**: Changed from `true` to `false` (essential for security)
3. **APP_URL**: Changed from `http://192.168.100.8:8000` to `https://app.delightssunhospital.com`
4. **VITE_API_URL**: Changed to use production domain with HTTPS
5. **REVERB_SCHEME**: Changed from `ws` to `wss` (secure WebSocket)
6. **SESSION_DOMAIN**: Set to `.delightssunhospital.com` for subdomain compatibility
7. **CACHE_STORE**: Recommended to use Redis for better performance
8. **LOG_LEVEL**: Changed from `debug` to `info` to reduce log volume

### SSL/TLS Certificate

- Ensure you have a valid SSL certificate for `app.delightssunhospital.com`
- Update HTTPS URLs accordingly
- WebSocket (Reverb) should use `wss://` (secure)

### Database Recommendations

- Use strong password for DB_PASSWORD
- Consider using read replicas for high traffic
- Enable database backups
- Monitor database performance

### Cache Recommendations

- **Development**: File cache is fine
- **Production**: Use Redis for:
  - Better performance
  - Session sharing across servers
  - Queue management
  - Real-time features

### Session Configuration

- SESSION_LIFETIME: 720 minutes (12 hours) suitable for hospital shifts
- SESSION_DOMAIN: Set to `.delightssunhospital.com` to share sessions across subdomains
- SESSION_SECURE_COOKIES: Always use `true` in production with HTTPS

### Mail Configuration

- Update MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD with your provider
- Recommended providers: SendGrid, Mailtrap, AWS SES, MailChimp
- Ensure FROM address is correct for hospital communications

### API Rate Limiting

Add to config/api.php or middleware as needed:
```php
// Throttle requests to prevent abuse
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});
```

### Security Checklist

- ✅ APP_DEBUG is false
- ✅ APP_KEY is set (generate new one if needed: `php artisan key:generate`)
- ✅ Using HTTPS for all URLs
- ✅ Database credentials are strong
- ✅ SANCTUM_STATEFUL_DOMAINS is configured correctly
- ✅ CORS is configured (if using separate frontend)
- ✅ API rate limiting is implemented
- ✅ Session security is enabled
- ✅ Error logging is configured

### Deployment Checklist

1. ✅ Create new `.env` file from this template
2. ✅ Update all credentials and passwords
3. ✅ Generate new APP_KEY if needed: `php artisan key:generate`
4. ✅ Run migrations: `php artisan migrate`
5. ✅ Clear cache: `php artisan cache:clear`
6. ✅ Build assets: `npm run build`
7. ✅ Configure SSL certificate
8. ✅ Set up Reverb WebSocket server
9. ✅ Configure queue worker
10. ✅ Set up logging and monitoring
