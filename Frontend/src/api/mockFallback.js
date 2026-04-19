// mockFallback.js
// Provides mock data responses when the backend is unreachable

const demoUser = {
  userId: 'demo-user-123',
  email: 'demo@clinic.com',
  firstName: 'Demo',
  lastName: 'User',
  role: 'Patient',
  profilePictureUrl: null,
  token: 'mock.jwt.token.12345'
};

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
    return { ...demoUser, email: data.email || demoUser.email };
  }

  if (url.includes('/auth/register') && method === 'post') {
    const data = JSON.parse(config.data || '{}');
    let role = data.role || 'Patient';
    if (!['Patient', 'Doctor', 'Admin'].includes(role)) {
       role = 'Patient';
    }
    return { 
      ...demoUser, 
      email: data.email || demoUser.email, 
      firstName: data.firstName || 'Demo',
      lastName: data.lastName || 'User',
      role: role
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
     // Book appointment mock
     const data = JSON.parse(config.data || '{}');
     return {
        id: `mock-appt-${Date.now()}`,
        ...data,
        status: 'Pending',
        doctorFullName: 'Demo Doctor',
        doctorSpecialization: 'General',
     };
  }
  
  // 3. Doctors (for booking page)
  if (url.includes('/doctors') && method === 'get' && !url.includes('booked-slots')) {
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
     // Return empty array meaning no slots are booked
     return [];
  }

  return null; // No mock available
};
