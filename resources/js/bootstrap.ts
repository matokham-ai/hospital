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

// Only initialize Echo if we have valid broadcast credentials
if (reverbKey && reverbHost) {
    const port = reverbPortStr ? parseInt(reverbPortStr, 10) : 8080;
    const scheme = (reverbScheme || 'http').toLowerCase();
    const useTLS = scheme === 'https';
    
    try {
        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: reverbKey,
            wsHost: reverbHost,
            wsPort: port,
            wssPort: port,
            forceTLS: useTLS,
            encrypted: useTLS,
            disableStats: true,
            enabledTransports: ['ws', 'wss'],
        });
        
        if (import.meta.env.DEV) {
            console.log('✅ Echo initialized with Reverb');
        }
    } catch (error) {
        console.warn('Failed to initialize Echo with Reverb:', error);
    }
} else if (pusherKey && pusherKey !== 'missing' && pusherCluster) {
    try {
        window.Echo = new Echo({
            broadcaster: 'pusher',
            key: pusherKey,
            cluster: pusherCluster,
            forceTLS: pusherUseTLS,
            encrypted: pusherUseTLS,
            disableStats: true,
        });
        
        if (import.meta.env.DEV) {
            console.log('✅ Echo initialized with Pusher');
        }
    } catch (error) {
        console.warn('Failed to initialize Echo with Pusher:', error);
    }
} else {
    if (import.meta.env.DEV) {
        console.info('ℹ️ Broadcasting disabled - no valid credentials found');
    }
}

// Optional: log connection state in dev
if (import.meta.env.DEV && window.Echo?.connector?.pusher?.connection) {
    window.Echo.connector.pusher.connection.bind('connected', () =>
        console.log('✅ Connected to broadcast server')
    );
    window.Echo.connector.pusher.connection.bind('disconnected', () =>
        console.log('⚠️ Disconnected from broadcast server')
    );
    window.Echo.connector.pusher.connection.bind('error', (err: any) =>
        console.warn('⚠️ Broadcast connection error:', err)
    );
}
