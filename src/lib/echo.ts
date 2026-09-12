import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

export const initEcho = (token?: string): Echo<any> | null => {
  if (typeof window === 'undefined') return null;

  window.Pusher = Pusher;

  const echoHost = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost';
  const echoPort = process.env.NEXT_PUBLIC_REVERB_PORT || '8080';
  const echoScheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http';
  const appKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'reverb-app-key';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  return new Echo({
    broadcaster: 'reverb',
    key: appKey,
    wsHost: echoHost,
    wsPort: Number(echoPort),
    wssPort: Number(echoPort),
    forceTLS: echoScheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiBaseUrl}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
      },
    },
  });
};
