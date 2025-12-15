import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
// ============================================================
// Axios global setup
// ============================================================

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// CSRF setup
const token = document.head.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content')!;
} else {
    console.error(
        'CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token'
    );
}

// ============================================================
// Laravel Reverb + Echo setup (for real-time broadcasting)
// ============================================================

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1',
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws'],
});

// Optional: log connection state in dev
if (import.meta.env.DEV) {
    window.Echo.connector.pusher.connection.bind('connected', () =>
        console.log('✅ Connected to Reverb server')
    );
    window.Echo.connector.pusher.connection.bind('disconnected', () =>
        console.log('⚠️ Disconnected from Reverb server')
    );
}
