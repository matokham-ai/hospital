#!/bin/bash

# Hospital Management System - Production Setup Script
# This script prepares the system for production deployment

echo "🏥 Hospital Management System - Production Setup"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it first."
    exit 1
fi

# Check if APP_ENV is set to production
if ! grep -q "APP_ENV=production" .env; then
    echo "⚠️  Warning: APP_ENV is not set to 'production' in .env file"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🔧 Installing dependencies..."
composer install --no-dev --optimize-autoloader

echo "🔑 Generating application key..."
php artisan key:generate --force

echo "🗄️  Running database migrations..."
php artisan migrate --force

echo "👥 Setting up roles and permissions..."
php artisan db:seed --class=ProductionRolePermissionSeeder --force

echo "🧹 Clearing and caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "📦 Building frontend assets..."
npm run build

echo "🔒 Setting proper file permissions..."
chmod -R 755 storage bootstrap/cache
if command -v chown &> /dev/null; then
    chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || echo "⚠️  Could not set file ownership (run as root if needed)"
fi

echo ""
echo "✅ Production setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create your first admin user:"
echo "   php artisan admin:create-user"
echo ""
echo "2. Configure your web server (Nginx/Apache) to point to the 'public' directory"
echo ""
echo "3. Set up SSL certificate for HTTPS"
echo ""
echo "4. Configure regular database backups"
echo ""
echo "5. Set up monitoring and logging"
echo ""
echo "🔐 Security checklist:"
echo "- APP_DEBUG=false in .env"
echo "- Strong database passwords"
echo "- Firewall configured"
echo "- Regular security updates"
echo ""
echo "🌐 Your HMS is ready for production!"