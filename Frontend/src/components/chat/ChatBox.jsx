

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getChatHistoryApi, sendMessageApi } from '../../api/chatApi';
import usePusherChat from '../../hooks/usePusherChat';
import ChatMessage from './ChatMessage';
import styles from './ChatBox.module.css';

// Appointments in these statuses allow sending messages
const CHATABLE_STATUSES = ['Pending', 'Confirmed'];

export default function ChatBox({ appointmentId, appointmentStatus }) {
  const { user } = useAuth();

  const [messages,         setMessages]         = useState([]);
  const [inputText,        setInputText]        = useState('');
  const [isSending,        setIsSending]        = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error,            setError]            = useState('');

  // Ref to the invisible div at the bottom of the message list
  const messagesEndRef = useRef(null);

  // Track whether we should auto-scroll.
  // Set to false when user scrolls up; reset to true when they scroll to bottom.
  const shouldAutoScrollRef = useRef(true);

  // The scroll container ref — used to detect manual scroll-up
  const scrollContainerRef = useRef(null);

  // ── Determine if sending is allowed ────────────────────────────────────
  const canSend = CHATABLE_STATUSES.includes(appointmentStatus);

  // ── Load chat history on mount / appointmentId change ──────────────────
  useEffect(() => {
    if (!appointmentId) return;

    let cancelled = false; // Prevents state update if component unmounts mid-fetch

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      setMessages([]);
      setError('');

      try {
        const history = await getChatHistoryApi(appointmentId, { pageSize: 50 });
        if (!cancelled) {
          setMessages(history);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load chat history. Please refresh.');
          console.error('[ChatBox] History load failed:', err);
        }
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };

    loadHistory();

    return () => { cancelled = true; };
  }, [appointmentId]);

  // ── Handle incoming Pusher message ─────────────────────────────────────
  // useCallback is REQUIRED here — usePusherChat's useEffect depends on this
  // function. Without useCallback, a new function reference on every render
  // would cause the Pusher subscription to teardown and re-subscribe constantly.
  const handleNewMessage = useCallback((incomingMessage) => {
    setMessages((prev) => {
      // Remove the optimistic placeholder if this is our own message coming back.
      // We identify optimistic messages by their "optimistic-" prefixed id.
      const withoutOptimistic = prev.filter(
        (m) => !m.id.toString().startsWith('optimistic-')
          || m.senderId !== incomingMessage.senderId
      );

      // Prevent duplicate messages (Pusher occasionally delivers twice on reconnect)
      const alreadyExists = withoutOptimistic.some((m) => m.id === incomingMessage.id);
      if (alreadyExists) return prev;

      // Tag isFromCurrentUser client-side — never trust the server value
      const tagged = {
        ...incomingMessage,
        isFromCurrentUser: incomingMessage.senderId === user.userId,
      };

      return [...withoutOptimistic, tagged];
    });

    // Reset auto-scroll when a new message arrives
    shouldAutoScrollRef.current = true;
  }, [user.userId]);

  // Wire up the Pusher subscription via our custom hook
  usePusherChat(appointmentId, handleNewMessage);

  // ── Auto-scroll to bottom whenever messages change ──────────────────────
  useEffect(() => {
    if (shouldAutoScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ── Detect when the user scrolls up (disable auto-scroll) ──────────────
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // "At bottom" = within 60px of the bottom edge
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom < 60;
  };

  // ── Send a message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || !canSend) return;

    setInputText(''); // Clear immediately for better UX
    setIsSending(true);
    setError('');

    // Optimistic message — appears instantly while the API call is in-flight
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage = {
      id:                   optimisticId,
      appointmentId,
      senderId:             user.userId,
      senderFullName:       `${user.firstName} ${user.lastName}`,
      senderRole:           user.role,
      senderProfilePictureUrl: user.profilePictureUrl,
      messageText:          text,
      sentAtUtc:            new Date().toISOString(),
      isFromCurrentUser:    true,
      isOptimistic:         true, // Internal flag for styling (e.g. opacity)
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    shouldAutoScrollRef.current = true;

    try {
      // API call — backend saves to DB and triggers Pusher event
      await sendMessageApi({ appointmentId, messageText: text });
      // The real message will arrive via Pusher and handleNewMessage will
      // replace the optimistic entry automatically.
    } catch (err) {
      // Roll back the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));

      // Restore the typed text so the user doesn't lose their message
      setInputText(text);

      setError(
        err.response?.data?.message ??
        'Failed to send message. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  // ── Allow Enter to send (Shift+Enter for newline) ───────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.chatBox}>

      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerDot} />
        <span className={styles.headerTitle}>
          Telehealth session
        </span>
        <span className={`${styles.statusPill} ${styles[appointmentStatus?.toLowerCase()]}`}>
          {appointmentStatus}
        </span>
      </div>

      {/* Error banner — non-fatal, dismissible */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button
            className={styles.errorDismiss}
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Message list */}
      <div
        className={styles.messageList}
        ref={scrollContainerRef}
        onScroll={handleScroll}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {isLoadingHistory ? (
          // Skeleton loading state
          <div className={styles.skeletonWrap}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`${styles.skeleton} ${i % 2 === 0 ? styles.skeletonLeft : styles.skeletonRight}`}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No messages yet.</p>
            <p className={styles.emptyHint}>
              {canSend
                ? 'Send a message to start the conversation.'
                : 'This session has ended.'}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              // Show avatar/name only when sender changes (groups consecutive messages)
              showSenderInfo={
                index === 0 ||
                messages[index - 1].senderId !== message.senderId
              }
            />
          ))
        )}

        {/* Invisible anchor div — scrollIntoView target */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input area */}
      <div className={styles.inputArea}>
        {!canSend ? (
          <p className={styles.closedNotice}>
            {appointmentStatus === 'Completed'
              ? 'This session has been completed. Chat is read-only.'
              : 'Chat is not available for this appointment.'}
          </p>
        ) : (
          <>
            <textarea
              className={styles.textInput}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              disabled={isSending}
              aria-label="Message input"
              // Auto-expand textarea height as user types
              style={{
                height: 'auto',
                minHeight: '44px',
                maxHeight: '120px',
              }}
              onInput={(e) => {
                // Reset height then expand to scrollHeight for auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={isSending || !inputText.trim()}
              aria-label="Send message"
            >
              {isSending ? (
                <span className={styles.sendSpinner} aria-hidden="true" />
              ) : (
                /* Send arrow icon — pure CSS/SVG, no icon library needed */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>

    </div>
  );
}