// =============================================================================
// IAppointmentService.cs — Contract for appointment business logic.
// =============================================================================

using SmartClinic.API.DTOs.Appointments;

namespace SmartClinic.API.Services.Interfaces;

public interface IAppointmentService
{
    // Book a new appointment — throws on double-booking or concurrency conflict
    Task<AppointmentResponseDto> BookAppointmentAsync(
        BookAppointmentRequestDto request, Guid patientUserId);

    // Get all appointments for a specific doctor (today and future)
    Task<IEnumerable<AppointmentResponseDto>> GetDoctorAppointmentsAsync(Guid doctorUserId);

    // Get all appointments for a specific patient
    Task<IEnumerable<AppointmentResponseDto>> GetPatientAppointmentsAsync(Guid patientUserId);

    // Update appointment status (Confirm, Complete, Cancel)
    Task<AppointmentResponseDto> UpdateStatusAsync(
        Guid appointmentId, string newStatus, Guid requestingUserId, string requestingUserRole);
}