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

function getMeta(name: string): string | null {
    const el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    return el ? el.getAttribute('content') : null;
}

const reverbKey = getMeta('reverb-key') || (import.meta as any).env?.VITE_REVERB_APP_KEY || null;
const reverbHost = getMeta('reverb-host') || (import.meta as any).env?.VITE_REVERB_HOST || null;
const reverbPortStr = getMeta('reverb-port') || (import.meta as any).env?.VITE_REVERB_PORT || null;
const reverbScheme = getMeta('reverb-scheme') || (import.meta as any).env?.VITE_REVERB_SCHEME || null;

const pusherKey = getMeta('pusher-key') || (import.meta as any).env?.VITE_PUSHER_APP_KEY || null;
const pusherCluster = getMeta('pusher-cluster') || (import.meta as any).env?.VITE_PUSHER_APP_CLUSTER || null;
const pusherUseTLS = (getMeta('pusher-use-tls') || (import.meta as any).env?.VITE_PUSHER_USE_TLS || 'true') === 'true';

let echoConfig: any;

if (reverbKey) {
    const port = reverbPortStr ? parseInt(reverbPortStr, 10) : 8080;
    const scheme = (reverbScheme || 'http').toLowerCase();
    const useTLS = scheme === 'https';
    echoConfig = {
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: reverbHost || '127.0.0.1',
        wsPort: port,
        wssPort: port,
        forceTLS: useTLS,
        encrypted: useTLS,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
    };
} else if (pusherKey) {
    echoConfig = {
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: pusherCluster || 'mt1',
        forceTLS: pusherUseTLS,
        encrypted: pusherUseTLS,
        disableStats: true,
    };
} else {
    console.error('Broadcast config missing: no reverb-key or pusher-key meta/env found.');
    echoConfig = {
        broadcaster: 'pusher',
        key: 'missing',
        cluster: 'mt1',
        forceTLS: true,
        encrypted: true,
        disableStats: true,
    };
}

window.Echo = new Echo(echoConfig);

// Optional: log connection state in dev
if (import.meta.env.DEV && (window as any).Echo?.connector?.pusher?.connection) {
    window.Echo.connector.pusher.connection.bind('connected', () =>
        console.log('✅ Connected to Reverb server')
    );
    window.Echo.connector.pusher.connection.bind('disconnected', () =>
        console.log('⚠️ Disconnected from Reverb server')
    );
}
