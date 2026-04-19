// mockFallback.js
// Provides mock data responses when the backend is unreachable

const mockAppointments = [
  {
    id: 'appt-1',
    startTimeUtc: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    status: 'Confirmed',
    doctorFullName: 'Sarah Jenkins',
    doctorSpecialization: 'Cardiology',
    doctorProfilePictureUrl: null,
    patientReason: 'Regular checkup'
  },
  {
    id: 'appt-2',
    startTimeUtc: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    status: 'Pending',
    doctorFullName: 'Michael Chen',
    doctorSpecialization: 'Neurology',
    doctorProfilePictureUrl: null,
    patientReason: 'Frequent headaches'
  }
];

export const generateMockResponse = (config) => {
  const url = config.url;
  const method = config.method?.toLowerCase();

  // 1. Auth routes
  if (url.includes('/auth/login') && method === 'post') {
    const data = JSON.parse(config.data || '{}');
    const email = data.email || 'demo@clinic.com';
    
    // Dynamic role based on email hint for easy testing
    let role = 'Patient';
    if (email.includes('doctor')) role = 'Doctor';
    if (email.includes('admin')) role = 'Admin';

    return {
      userId: 'demo-user-123',
      email: email,
      firstName: 'Demo',
      lastName: role,
      role: role,
      profilePictureUrl: null,
      token: 'mock.jwt.token.12345'
    };
  }

  if (url.includes('/auth/register') && method === 'post') {
    const data = JSON.parse(config.data || '{}');
    let role = data.role || 'Patient';
    if (!['Patient', 'Doctor', 'Admin'].includes(role)) {
       role = 'Patient';
    }
    return {
      userId: 'demo-user-123',
      email: data.email || 'demo@clinic.com',
      firstName: data.firstName || 'Demo',
      lastName: data.lastName || 'User',
      role: role,
      profilePictureUrl: null,
      token: 'mock.jwt.token.12345'
    };
  }

  // 2. Appointments routes
  if (url.includes('/appointments/my-appointments') && method === 'get') {
    return mockAppointments;
  }

  if (url.includes('/appointments/my-schedule') && method === 'get') {
    return mockAppointments;
  }
  
  if (url.includes('/appointments') && method === 'post') {
     const data = JSON.parse(config.data || '{}');
     return {
        id: `mock-appt-${Date.now()}`,
        ...data,
        status: 'Pending',
        doctorFullName: 'Demo Doctor',
        doctorSpecialization: 'General',
     };
  }
  
  // 3. Doctors
  if (url.includes('/doctors/me') && method === 'get') {
    // Mock doctor profile for the Doctor Availability page
    return {
      userId: 'demo-user-123',
      profileId: 'doc-prof-demo',
      firstName: 'Demo',
      lastName: 'Doctor',
      specialization: 'General',
      bio: 'Demo doctor bio',
      consultationFee: 100,
      verificationStatus: 'Approved',
      consultationDurationMinutes: 30,
      availabilityJson: JSON.stringify([
        { DayOfWeek: 1, StartTime: '09:00', EndTime: '17:00' },
        { DayOfWeek: 2, StartTime: '09:00', EndTime: '17:00' },
      ])
    };
  }

  if (url.includes('/doctors/availability') && method === 'patch') {
    return {}; // Success 204 equivalent
  }

  if (url.includes('/doctors') && method === 'get' && !url.includes('booked-slots') && !url.includes('me')) {
     return [
       {
         userId: 'doc-1',
         profileId: 'doc-prof-1',
         firstName: 'Sarah',
         lastName: 'Jenkins',
         specialization: 'Cardiology',
         bio: 'Experienced cardiologist with 15 years of practice.',
         consultationFee: 150
       },
       {
         userId: 'doc-2',
         profileId: 'doc-prof-2',
         firstName: 'Michael',
         lastName: 'Chen',
         specialization: 'Neurology',
         bio: 'Specialist in neurological disorders and treatments.',
         consultationFee: 200
       }
     ];
  }

  if (url.includes('booked-slots') && method === 'get') {
     return [];
  }

  // 4. Notifications
  if (url.includes('/notifications') && method === 'get') {
    return [
      {
        id: 'notif-1',
        title: 'Welcome to SmartClinic',
        message: 'This is a demo notification.',
        isRead: false,
        createdAtUtc: new Date().toISOString()
      }
    ];
  }

  if (url.includes('/notifications') && method === 'patch') {
    return {};
  }

  // 5. Chat
  if (url.includes('/chat') && method === 'get') {
    return [
      {
        id: 'msg-1',
        senderId: 'other-user',
        senderName: 'System',
        content: 'Welcome to the chat!',
        timestampUtc: new Date().toISOString()
      }
    ];
  }

  if (url.includes('/chat') && method === 'post') {
    return {
      id: `msg-${Date.now()}`,
      ...JSON.parse(config.data || '{}'),
      timestampUtc: new Date().toISOString()
    };
  }

  // 6. Admin
  if (url.includes('/admin/stats') && method === 'get') {
    return {
      totalPatients: 150,
      totalDoctors: 12,
      pendingVerifications: 2,
      systemHealth: 'Optimal'
    };
  }

  if (url.includes('/admin/users') && method === 'get') {
    return [
      {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'Patient',
        createdAtUtc: new Date().toISOString()
      }
    ];
  }

  return null; // Fallback to failing
};
