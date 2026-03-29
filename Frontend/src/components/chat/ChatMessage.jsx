

import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import styles from './ChatBox.module.css';

export default function ChatMessage({ message, showSenderInfo }) {
  const isOwn = message.isFromCurrentUser;

  // Format the timestamp for display
  const timestamp = formatTimestamp(new Date(message.sentAtUtc));

  return (
    <div
      className={`
        ${styles.messageRow}
        ${isOwn ? styles.messageRowOwn : styles.messageRowOther}
        ${message.isOptimistic ? styles.optimistic : ''}
      `}
    >
      {/* Avatar — shown on the left for incoming, right for outgoing */}
      {/* Only rendered when showSenderInfo is true (sender changed) */}
      {showSenderInfo && !isOwn && (
        <div className={styles.avatarWrap}>
          {message.senderProfilePictureUrl ? (
            <img
              src={message.senderProfilePictureUrl}
              alt={message.senderFullName}
              className={styles.msgAvatar}
            />
          ) : (
            <div className={`${styles.msgAvatarFallback} ${styles[message.senderRole?.toLowerCase()]}`}>
              {message.senderFullName?.charAt(0) ?? '?'}
            </div>
          )}
        </div>
      )}

      {/* Spacer when avatar is hidden (consecutive messages from same sender) */}
      {!showSenderInfo && !isOwn && <div className={styles.avatarSpacer} />}

      {/* Bubble content */}
      <div className={`${styles.bubbleWrap} ${isOwn ? styles.bubbleWrapOwn : ''}`}>

        {/* Sender name + role badge — only on first message in a group */}
        {showSenderInfo && !isOwn && (
          <div className={styles.senderInfo}>
            <span className={styles.senderName}>{message.senderFullName}</span>
            <span className={`role-badge ${message.senderRole?.toLowerCase()}`}>
              {message.senderRole}
            </span>
          </div>
        )}

        <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
          {/* Message text — preserves newlines from Shift+Enter */}
          <p className={styles.messageText}>{message.messageText}</p>
        </div>

        {/* Timestamp + delivery status */}
        <div className={`${styles.meta} ${isOwn ? styles.metaOwn : ''}`}>
          <time
            dateTime={message.sentAtUtc}
            className={styles.timestamp}
            title={format(new Date(message.sentAtUtc), 'PPpp')} // Full date on hover
          >
            {timestamp}
          </time>
          {/* Sending indicator for optimistic messages */}
          {message.isOptimistic && (
            <span className={styles.sendingLabel} aria-label="Sending">
              Sending…
            </span>
          )}
        </div>

      </div>

      {/* Own avatar on the right */}
      {showSenderInfo && isOwn && (
        <div className={styles.avatarWrap}>
          {message.senderProfilePictureUrl ? (
            <img
              src={message.senderProfilePictureUrl}
              alt="You"
              className={styles.msgAvatar}
            />
          ) : (
            <div className={`${styles.msgAvatarFallback} ${styles[message.senderRole?.toLowerCase()]}`}>
              {message.senderFullName?.charAt(0) ?? '?'}
            </div>
          )}
        </div>
      )}

      {!showSenderInfo && isOwn && <div className={styles.avatarSpacer} />}
    </div>
  );
}

// ── Timestamp formatter ───────────────────────────────────────────────────────
// Shows: "just now" / "5 min ago" / "Yesterday" / "Mar 22" depending on age
function formatTimestamp(date) {
  const secondsAgo = (Date.now() - date.getTime()) / 1000;

  if (secondsAgo < 60)   return 'just now';
  if (secondsAgo < 3600) return formatDistanceToNow(date, { addSuffix: true });
  if (isToday(date))     return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;

  return format(date, 'MMM d, h:mm a');
}