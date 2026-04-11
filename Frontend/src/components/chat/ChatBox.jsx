import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getChatHistoryApi, sendMessageApi } from '../../api/chatApi';
import usePusherChat from '../../hooks/usePusherChat';
import ChatMessage from './ChatMessage';
import styles from './ChatBox.module.css';

const CHATABLE_STATUSES = ['Pending', 'Confirmed'];

export default function ChatBox({ appointmentId, appointmentStatus, doctorName, doctorAvatar }) {
  const { user } = useAuth();

  const [messages,         setMessages]         = useState([]);
  const [inputText,        setInputText]        = useState('');
  const [isSending,        setIsSending]        = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error,            setError]            = useState('');

  const messagesEndRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const scrollContainerRef = useRef(null);

  const canSend = CHATABLE_STATUSES.includes(appointmentStatus);

  useEffect(() => {
    if (!appointmentId) return;

    let cancelled = false;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      setMessages([]);
      setError('');

      try {
        const history = await getChatHistoryApi(appointmentId, { pageSize: 50 });
        if (!cancelled) {
          const taggedHistory = history.map(m => ({
            ...m,
            isFromCurrentUser: String(m.senderId) === String(user.userId)
          }));
          setMessages(taggedHistory);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load chat history. Please refresh.');
        }
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };

    loadHistory();
    return () => { cancelled = true; };
  }, [appointmentId]);

  const handleNewMessage = useCallback((incomingMessage) => {
    setMessages((prev) => {
      const withoutOptimistic = prev.filter(
        (m) => !m.id.toString().startsWith('optimistic-') || m.senderId !== incomingMessage.senderId
      );

      const alreadyExists = withoutOptimistic.some((m) => m.id === incomingMessage.id);
      if (alreadyExists) return prev;

      const tagged = {
        ...incomingMessage,
        isFromCurrentUser: String(incomingMessage.senderId) === String(user.userId),
      };

      return [...withoutOptimistic, tagged];
    });

    shouldAutoScrollRef.current = true;
  }, [user.userId]);

  usePusherChat(appointmentId, handleNewMessage);

  useEffect(() => {
    if (shouldAutoScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 60;
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || !canSend) return;

    setInputText('');
    setIsSending(true);
    setError('');

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      appointmentId,
      senderId: user.userId,
      senderFullName: `${user.firstName} ${user.lastName}`,
      senderRole: user.role,
      senderProfilePictureUrl: user.profilePictureUrl,
      messageText: text,
      sentAtUtc: new Date().toISOString(),
      isFromCurrentUser: true,
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    shouldAutoScrollRef.current = true;

    try {
      await sendMessageApi({ appointmentId, messageText: text });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputText(text);
      setError(err.response?.data?.message ?? 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.chatBox}>

      {/* WhatsApp Style Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerProfile}>
          {doctorAvatar ? (
            <img src={doctorAvatar} alt="Doctor" className={styles.headerAvatar} />
          ) : (
            <div className={styles.headerAvatarFallback}>
              {doctorName ? doctorName.charAt(0) : 'D'}
            </div>
          )}
          <div className={styles.headerInfo}>
            <span className={styles.headerTitle}>
              {doctorName ? (user?.role === 'Doctor' ? doctorName : `Dr. ${doctorName}`) : 'Chat'}
            </span>
            <span className={styles.headerOnline}>
              <div className={styles.headerDot}></div> Online
            </span>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <span className={`${styles.statusPill} ${styles[appointmentStatus?.toLowerCase()]}`}>
            {appointmentStatus}
          </span>
          <svg className={styles.wsIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
             <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.128.55 4.195 1.594 6.012L.15 24l6.096-1.597A11.967 11.967 0 0012.031 24c6.644 0 12.031-5.385 12.031-12.031S18.675 0 12.031 0zm0 20.156c-1.785 0-3.53-.483-5.06-1.393l-.363-.215-3.766.987.994-3.67-.236-.376a10.15 10.15 0 01-1.554-5.458c0-5.59 4.549-10.14 10.14-10.14 5.591 0 10.14 4.55 10.14 10.14s-4.549 10.14-10.14 10.14z"/>
             <path fill="var(--color-surface)" d="M17.653 14.18c-.31-.155-1.838-.908-2.122-1.013-.284-.105-.49-.155-.697.155s-.804 1.013-.984 1.22c-.18.207-.361.233-.671.078-2.115-.965-3.328-1.584-4.59-3.725-.18-.306.18-.285.485-.89.078-.155.039-.284-.013-.439-.052-.155-.697-1.682-.955-2.302-.25-.6-.505-.518-.696-.527l-.609-.009c-.206 0-.542.078-.826.388s-1.084 1.06-1.084 2.585 1.11 2.999 1.265 3.206c.155.207 2.185 3.336 5.293 4.673 2.17.933 2.87.802 3.385.672.587-.148 1.838-.75 2.096-1.474.258-.724.258-1.344.18-1.474-.078-.13-.284-.207-.594-.362z"/>
          </svg>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button className={styles.errorDismiss} onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Message Area with Glass Background Graphic */}
      <div className={styles.scrollWrapper}>
        <div className={styles.wsBackground}></div>
        <div
          className={styles.messageList}
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {isLoadingHistory ? (
            <div className={styles.skeletonWrap}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`${styles.skeleton} ${i % 2 === 0 ? styles.skeletonLeft : styles.skeletonRight}`} />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.encrypBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Messages are end-to-end encrypted
              </div>
            </div>
          ) : (
            <>
              <div className={styles.encrypBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Messages are end-to-end encrypted
              </div>
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  showSenderInfo={index === 0 || messages[index - 1].senderId !== message.senderId}
                />
              ))}
            </>
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        {!canSend ? (
          <p className={styles.closedNotice}>
            {appointmentStatus === 'Completed' ? 'This session has been completed.' : 'Chat is not available for this appointment.'}
          </p>
        ) : (
          <>
            <textarea
              className={styles.textInput}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              rows={1}
              disabled={isSending}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
            />
            <button className={styles.sendBtn} onClick={handleSend} disabled={isSending || !inputText.trim()}>
              {isSending ? (
                <span className={styles.sendSpinner} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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