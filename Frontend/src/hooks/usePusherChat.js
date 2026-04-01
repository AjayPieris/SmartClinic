

import { useEffect, useRef } from 'react';
import pusherClient from '../lib/pusherClient';

/**
 * Subscribes to a Pusher appointment chat channel and calls
 * onNewMessage whenever a "new-message" event arrives.
 *
 * @param {string|null} appointmentId — the appointment UUID. Pass null to skip.
 * @param {function} onNewMessage — stable callback (wrap in useCallback in caller)
 */
export default function usePusherChat(appointmentId, onNewMessage) {
  // Keep a ref to the current channel so cleanup can unsubscribe from the
  // correct channel even if appointmentId changes between renders.
  const channelRef = useRef(null);

  useEffect(() => {
    // Don't subscribe if there's no appointmentId yet
    if (!appointmentId) return;

    // Channel name must exactly match what the .NET ChatService triggers on:
    // "appointment-{appointmentId}-chat"
    const channelName = `appointment-${appointmentId}-chat`;

    // Subscribe — if already subscribed (e.g. HMR in dev), Pusher returns
    // the existing channel subscription rather than creating a duplicate.
    const channel = pusherClient.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('new-message', (data) => {
      // data is the ChatMessageDto deserialized from Pusher's JSON payload.
      // Normalize keys to camelCase because the .NET Pusher SDK uses Newtonsoft.Json
      // and serializes properties as PascalCase by default, unlike System.Text.Json.
      const normalizedData = Object.keys(data).reduce((acc, key) => {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        acc[camelKey] = data[key];
        return acc;
      }, {});
      
      onNewMessage(normalizedData);
    });

    // Connection state logging (dev only) — helps diagnose subscribe issues
    if (import.meta.env.DEV) {
      channel.bind('pusher:subscription_succeeded', () => {
        console.debug(`[Pusher] Subscribed to ${channelName}`);
      });
      channel.bind('pusher:subscription_error', (err) => {
        console.error(`[Pusher] Subscription error on ${channelName}:`, err);
      });
    }

    // ── Cleanup: runs when appointmentId changes or component unmounts ──────
    return () => {
      // Unbind our specific event listener first, then unsubscribe the channel.
      // Unsubscribing without unbinding first leaks the listener.
      channel.unbind('new-message');

      if (import.meta.env.DEV) {
        channel.unbind('pusher:subscription_succeeded');
        channel.unbind('pusher:subscription_error');
      }

      pusherClient.unsubscribe(channelName);
      channelRef.current = null;

      if (import.meta.env.DEV) {
        console.debug(`[Pusher] Unsubscribed from ${channelName}`);
      }
    };
  }, [appointmentId, onNewMessage]);
  // onNewMessage MUST be stable (useCallback) — see file header comment.
}