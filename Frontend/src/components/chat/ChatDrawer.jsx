import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyAppointmentsApi, getMyScheduleApi } from '../../api/appointmentsApi';
import ChatBox from './ChatBox';
import styles from './ChatDrawer.module.css';

export default function ChatDrawer({ isOpen, onClose, initialAppointmentId }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(initialAppointmentId || null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialAppointmentId) {
      setSelectedAppointmentId(initialAppointmentId);
    }
  }, [initialAppointmentId]);

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadContacts = async () => {
      try {
        setIsLoading(true);
        const appointments = user.role === 'Doctor' 
          ? await getMyScheduleApi()
          : await getMyAppointmentsApi();
        
        // Filter out cancelled
        const validAppts = appointments.filter(a => a.status !== 'Cancelled');
        
        // Get unique contacts based on the other party
        // Sort by most recent appointment first
        validAppts.sort((a, b) => new Date(b.startTimeUtc) - new Date(a.startTimeUtc));
        
        const uniqueContacts = [];
        const seenProfileIds = new Set();
        
        for (const appt of validAppts) {
          const profileId = user.role === 'Doctor' ? appt.patientProfileId : appt.doctorProfileId;
          const name = user.role === 'Doctor' ? appt.patientFullName : appt.doctorFullName;
          const avatar = user.role === 'Doctor' ? appt.patientProfilePictureUrl : appt.doctorProfilePictureUrl;
          
          if (!seenProfileIds.has(profileId)) {
            seenProfileIds.add(profileId);
            uniqueContacts.push({
              appointmentId: appt.id,
              profileId,
              name,
              avatar,
              status: appt.status,
              latestApptDate: appt.startTimeUtc
            });
          }
        }
        
        setContacts(uniqueContacts);
        
        // Auto-select if requested
        if (selectedAppointmentId) {
          const contact = uniqueContacts.find(c => c.appointmentId === selectedAppointmentId);
          if (contact) setSelectedContact(contact);
        } else if (uniqueContacts.length > 0 && window.innerWidth > 768) {
          // On desktop, auto-select first
          setSelectedAppointmentId(uniqueContacts[0].appointmentId);
          setSelectedContact(uniqueContacts[0]);
        }
        
      } catch (err) {
        console.error('Failed to load chat contacts', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadContacts();
  }, [isOpen, user]);

  useEffect(() => {
    // Keep selected contact synced
    if (selectedAppointmentId) {
      const contact = contacts.find(c => c.appointmentId === selectedAppointmentId);
      if (contact) setSelectedContact(contact);
    }
  }, [selectedAppointmentId, contacts]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        
        {/* Contacts Sidebar */}
        <div className={`${styles.sidebar} ${selectedAppointmentId ? styles.sidebarHiddenMobile : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Chats</h2>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
          </div>
          
          <div className={styles.contactList}>
            {isLoading ? (
              <div className={styles.skeletonWrap}>
                <div className="skeleton" style={{height: 60, marginBottom: 8, borderRadius: 12}}></div>
                <div className="skeleton" style={{height: 60, marginBottom: 8, borderRadius: 12}}></div>
                <div className="skeleton" style={{height: 60, marginBottom: 8, borderRadius: 12}}></div>
              </div>
            ) : contacts.length === 0 ? (
              <p className={styles.noContacts}>No active appointments for chatting.</p>
            ) : (
              contacts.map(c => (
                <div 
                  key={c.appointmentId} 
                  className={`${styles.contactItem} ${selectedAppointmentId === c.appointmentId ? styles.activeContact : ''}`}
                  onClick={() => setSelectedAppointmentId(c.appointmentId)}
                >
                  {c.avatar ? (
                    <img src={c.avatar} alt="" className={styles.contactAvatar} />
                  ) : (
                    <div className={styles.contactAvatarFallback}>{c.name?.charAt(0) || '?'}</div>
                  )}
                  <div className={styles.contactInfo}>
                    <h4 className={styles.contactName}>
                      {user.role === 'Patient' ? `Dr. ${c.name}` : c.name}
                    </h4>
                    <p className={styles.contactStatus}>{c.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${styles.chatArea} ${!selectedAppointmentId ? styles.chatHiddenMobile : ''}`}>
          {selectedAppointmentId && selectedContact ? (
            <>
              {/* Mobile Back Button built into Chat Area */}
              <button 
                className={styles.mobileBackBtn} 
                onClick={() => setSelectedAppointmentId(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Back to Contacts
              </button>
              
              <div className={styles.chatWrapper}>
                <ChatBox 
                  appointmentId={selectedAppointmentId} 
                  appointmentStatus={selectedContact.status} 
                  doctorName={selectedContact.name}
                  doctorAvatar={selectedContact.avatar}
                />
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <p>Select a contact to start chatting</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
