export const mockUsers = {
  patient: {
    userId: 'mock-patient-1',
    email: 'patient@clinic.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'Patient',
    token: 'mock-token-patient-123',
    profilePictureUrl: null,
  },
  doctor: {
    userId: 'mock-doctor-1',
    email: 'doctor@clinic.com',
    firstName: 'James',
    lastName: 'Wilson',
    role: 'Doctor',
    token: 'mock-token-doctor-123',
    profilePictureUrl: null,
  },
  admin: {
    userId: 'mock-admin-1',
    email: 'admin@clinic.com',
    firstName: 'System',
    lastName: 'Admin',
    role: 'Admin',
    token: 'mock-token-admin-123',
    profilePictureUrl: null,
  }
};

export const mockAppointments = [
  {
    appointmentId: 'apt-1',
    patientId: 'mock-patient-1',
    doctorId: 'mock-doctor-1',
    doctorName: 'Dr. James Wilson',
    patientName: 'John Doe',
    status: 'Scheduled',
    dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    notes: 'Routine checkup'
  },
  {
    appointmentId: 'apt-2',
    patientId: 'mock-patient-1',
    doctorId: 'mock-doctor-1',
    doctorName: 'Dr. James Wilson',
    patientName: 'John Doe',
    status: 'Completed',
    dateTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    notes: 'Follow up'
  }
];

export const mockDoctors = [
  {
    doctorId: 'mock-doctor-1',
    firstName: 'James',
    lastName: 'Wilson',
    specialization: 'Cardiology',
    experienceYears: 15,
    email: 'doctor@clinic.com',
    verificationStatus: 'Verified',
  },
  {
    doctorId: 'mock-doctor-2',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    specialization: 'Neurology',
    experienceYears: 10,
    email: 'sarah.m@clinic.com',
    verificationStatus: 'Verified',
  }
];

export const mockAvailability = [
  {
    availabilityId: 'av-1',
    dayOfWeek: 'Monday',
    startTime: '09:00:00',
    endTime: '17:00:00',
    isAvailable: true
  },
  {
    availabilityId: 'av-2',
    dayOfWeek: 'Tuesday',
    startTime: '09:00:00',
    endTime: '17:00:00',
    isAvailable: true
  }
];
