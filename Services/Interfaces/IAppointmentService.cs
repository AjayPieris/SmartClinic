using SmartClinic.API.DTOs.Appointments;

namespace SmartClinic.API.Services.Interfaces;

public interface IAppointmentService
{
    Task<AppointmentResponseDto> BookAppointmentAsync(
        BookAppointmentRequestDto request, Guid patientUserId);

    Task<IEnumerable<AppointmentResponseDto>> GetDoctorAppointmentsAsync(Guid doctorUserId);

    Task<IEnumerable<AppointmentResponseDto>> GetPatientAppointmentsAsync(Guid patientUserId);

    Task<AppointmentResponseDto> UpdateStatusAsync(
        Guid appointmentId, string newStatus, Guid requestingUserId, string requestingUserRole);
}