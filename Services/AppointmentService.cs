using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Data;
using SmartClinic.API.Data.Models;
using SmartClinic.API.DTOs.Appointments;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Services;

public class AppointmentService : IAppointmentService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AppointmentService> _logger;

    public AppointmentService(AppDbContext db, ILogger<AppointmentService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<AppointmentResponseDto> BookAppointmentAsync(
        BookAppointmentRequestDto request, Guid patientUserId)
    {
        var doctorProfile = await _db.DoctorProfiles
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == request.DoctorProfileId)
            ?? throw new KeyNotFoundException("Doctor not found.");

        var patientProfile = await _db.PatientProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == patientUserId)
            ?? throw new KeyNotFoundException("Patient profile not found.");

        var startUtc = request.StartTimeUtc.ToUniversalTime();
        var endUtc = startUtc.AddMinutes(doctorProfile.ConsultationDurationMinutes);

        if (startUtc < DateTime.UtcNow)
            throw new InvalidOperationException("Cannot book an appointment in the past.");

        var hasConflict = await _db.Appointments
            .AnyAsync(a =>
                a.DoctorProfileId == request.DoctorProfileId &&
                a.Status != AppointmentStatus.Cancelled &&
                a.StartTimeUtc < endUtc &&
                a.EndTimeUtc > startUtc);

        if (hasConflict)
            throw new InvalidOperationException("This time slot is already booked. Please choose a different time.");

        var appointment = new Appointment
        {
            DoctorProfileId = doctorProfile.Id,
            PatientProfileId = patientProfile.Id,
            StartTimeUtc = startUtc,
            EndTimeUtc = endUtc,
            PatientReason = request.PatientReason,
            IsTelehealth = request.IsTelehealth,
            Status = AppointmentStatus.Pending,
        };

        _db.Appointments.Add(appointment);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Concurrency conflict booking appointment for slot {Start}", startUtc);
            throw new InvalidOperationException("This slot was just booked by someone else. Please choose a different time.");
        }

        _logger.LogInformation(
            "Appointment booked: Doctor {DoctorId}, Patient {PatientId}, Start {Start}",
            doctorProfile.Id, patientProfile.Id, startUtc);

        return MapToResponseDto(appointment, doctorProfile, patientProfile);
    }

    public async Task<IEnumerable<AppointmentResponseDto>> GetDoctorAppointmentsAsync(Guid doctorUserId)
    {
        var appointments = await _db.Appointments
            .AsNoTracking()
            .Include(a => a.DoctorProfile).ThenInclude(d => d.User)
            .Include(a => a.PatientProfile).ThenInclude(p => p.User)
            .Where(a =>
                a.DoctorProfile.UserId == doctorUserId &&
                a.StartTimeUtc >= DateTime.UtcNow.Date)
            .OrderBy(a => a.StartTimeUtc)
            .ToListAsync();

        return appointments.Select(a => MapToResponseDto(a, a.DoctorProfile, a.PatientProfile));
    }

    public async Task<IEnumerable<AppointmentResponseDto>> GetPatientAppointmentsAsync(Guid patientUserId)
    {
        var appointments = await _db.Appointments
            .AsNoTracking()
            .Include(a => a.DoctorProfile).ThenInclude(d => d.User)
            .Include(a => a.PatientProfile).ThenInclude(p => p.User)
            .Where(a => a.PatientProfile.UserId == patientUserId)
            .OrderByDescending(a => a.StartTimeUtc)
            .ToListAsync();

        return appointments.Select(a => MapToResponseDto(a, a.DoctorProfile, a.PatientProfile));
    }

    public async Task<AppointmentResponseDto> UpdateStatusAsync(
        Guid appointmentId, string newStatus, Guid requestingUserId, string requestingUserRole)
    {
        var appointment = await _db.Appointments
            .Include(a => a.DoctorProfile).ThenInclude(d => d.User)
            .Include(a => a.PatientProfile).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == appointmentId)
            ?? throw new KeyNotFoundException("Appointment not found.");

        var isDoctor = requestingUserRole == "Doctor" &&
                       appointment.DoctorProfile.UserId == requestingUserId;
        var isPatient = requestingUserRole == "Patient" &&
                        appointment.PatientProfile.UserId == requestingUserId;
        var isAdmin = requestingUserRole == "Admin";

        if (!isDoctor && !isPatient && !isAdmin)
            throw new UnauthorizedAccessException("You are not authorized to modify this appointment.");

        if (!Enum.TryParse<AppointmentStatus>(newStatus, ignoreCase: true, out var parsedStatus))
            throw new InvalidOperationException($"Invalid status: {newStatus}");

        appointment.Status = parsedStatus;
        appointment.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return MapToResponseDto(appointment, appointment.DoctorProfile, appointment.PatientProfile);
    }

    private static AppointmentResponseDto MapToResponseDto(
        Appointment a, DoctorProfile doctor, PatientProfile patient) => new()
    {
        Id = a.Id,
        StartTimeUtc = a.StartTimeUtc,
        EndTimeUtc = a.EndTimeUtc,
        Status = a.Status.ToString(),
        IsTelehealth = a.IsTelehealth,
        PatientReason = a.PatientReason,
        DoctorNotes = a.DoctorNotes,
        DoctorProfileId = doctor.Id,
        DoctorFullName = $"{doctor.User.FirstName} {doctor.User.LastName}",
        DoctorSpecialization = doctor.Specialization,
        DoctorProfilePictureUrl = doctor.User.ProfilePictureUrl,
        PatientProfileId = patient.Id,
        PatientFullName = $"{patient.User.FirstName} {patient.User.LastName}",
        PatientProfilePictureUrl = patient.User.ProfilePictureUrl,
    };
}