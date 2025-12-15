import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { configureEcho } from '@laravel/echo-react';
import ErrorBoundary from '@/Components/ErrorBoundary';
import axios from 'axios';

configureEcho({
    broadcaster: 'reverb',
});

// Avoid document.write fallback when a non-Inertia response is returned
router.on('invalid', (event) => {
    const response = event.detail?.response as Response | undefined;

    if (!response) {
        console.warn('[Inertia] Invalid response without payload. Reloading…');
        setTimeout(() => window.location.reload(), 500);
        return;
    }

    const inertiaRedirect = response.headers.get('X-Inertia-Location');
    if (inertiaRedirect) {
        console.warn('[Inertia] Redirecting to X-Inertia-Location:', inertiaRedirect);
        setTimeout(() => window.location.assign(inertiaRedirect), 500);
        return;
    }

    if (response.url) {
        console.warn('[Inertia] Redirecting to response URL:', response.url);
        setTimeout(() => window.location.assign(response.url), 500);
        return;
    }

    console.warn('[Inertia] Invalid response fallback. Reloading…');
    setTimeout(() => window.location.reload(), 500);
});

// Import performance testing utilities in development
if (import.meta.env.DEV) {
    import('./utils/runAdminPerformanceTests');
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ErrorBoundary
                onError={(error, errorInfo) => {
                    // Log errors to console in development
                    if (import.meta.env.DEV) {
                        console.error('Application Error:', error);
                        console.error('Error Info:', errorInfo);
                    }
                    // In production, you could send errors to a logging service
                    // e.g., Sentry, LogRocket, etc.
                }}
            >
                <App {...props} />
            </ErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
