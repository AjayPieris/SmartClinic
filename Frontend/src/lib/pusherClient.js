

import Pusher from 'pusher-js';

const pusherClient = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,

  // Enable Pusher's built-in logging in development only.
  // Set to false in production — it is verbose and unnecessary.
  // Pusher.logToConsole = true is global; wrapping in env check keeps it clean.
  forceTLS: true, // Always use WSS (encrypted WebSocket) — never WS

  // If we upgrade to private channels, uncomment this block:
  // authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/pusher/auth`,
  // auth: {
  //   headers: {
  //     Authorization: `Bearer ${localStorage.getItem('sc_token')}`,
  //   },
  // },
});

// Enable Pusher debug logging only in development
if (import.meta.env.DEV) {
  Pusher.logToConsole = false; // Flip to true if you need to debug socket events
}

export default pusherClient;