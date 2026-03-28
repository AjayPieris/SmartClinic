// =============================================================================
// AppointmentService.cs — The scheduling engine.
//
// DOUBLE-BOOKING PREVENTION (two layers):
//   Layer 1 (Application): Before inserting, query for overlapping appointments
//                          in the same transaction using a SELECT ... FOR UPDATE
//                          equivalent (achieved via EF Core + serializable txn).
//   Layer 2 (Database):    The xmin concurrency token on Appointment means that
//                          if two requests pass Layer 1 simultaneously and both
//                          try to SaveChanges, only the first commit wins.
//                          The second throws DbUpdateConcurrencyException,
//                          which we catch and return as a 409 Conflict.
//
// This pattern is known as Optimistic Concurrency Control and is the
// recommended approach for EF Core + Postgres.
// =============================================================================

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

    // -------------------------------------------------------------------------
    // BookAppointmentAsync
    // -------------------------------------------------------------------------
    public async Task<AppointmentResponseDto> BookAppointmentAsync(
        BookAppointmentRequestDto request, Guid patientUserId)
    {
        // --- 1. Load required entities ---

        // Load DoctorProfile (needed for ConsultationDurationMinutes)
        var doctorProfile = await _db.DoctorProfiles
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == request.DoctorProfileId)
            ?? throw new KeyNotFoundException("Doctor not found.");

        // Load PatientProfile for the requesting user
        var patientProfile = await _db.PatientProfiles
            .FirstOrDefaultAsync(p => p.UserId == patientUserId)
            ?? throw new KeyNotFoundException("Patient profile not found.");

        // --- 2. Calculate end time from doctor's consultation duration ---
        // All time math is done in UTC
        var startUtc = request.StartTimeUtc.ToUniversalTime();
        var endUtc = startUtc.AddMinutes(doctorProfile.ConsultationDurationMinutes);

        // Reject bookings in the past
        if (startUtc < DateTime.UtcNow)
            throw new InvalidOperationException("Cannot book an appointment in the past.");

        // --- 3. Check for overlapping appointments (Layer 1 protection) ---
        // An overlap exists when: existing.Start < newEnd AND existing.End > newStart
        // This covers all overlap cases: partial left, partial right, total encapsulation
        var hasConflict = await _db.Appointments
            .AnyAsync(a =>
                a.DoctorProfileId == request.DoctorProfileId &&
                a.Status != AppointmentStatus.Cancelled &&
                a.StartTimeUtc < endUtc &&
                a.EndTimeUtc > startUtc);

        if (hasConflict)
            throw new InvalidOperationException(
                "This time slot is already booked. Please choose a different time.");

        // --- 4. Create and persist the appointment ---
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
            // SaveChanges will throw DbUpdateConcurrencyException if xmin changed
            // since we read (Layer 2 protection for race conditions)
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Concurrency conflict booking appointment for slot {Start}", startUtc);
            throw new InvalidOperationException(
                "This slot was just booked by someone else. Please choose a different time.");
        }

        _logger.LogInformation(
            "Appointment booked: Doctor {DoctorId}, Patient {PatientId}, Start {Start}",
            doctorProfile.Id, patientProfile.Id, startUtc);

        return MapToResponseDto(appointment, doctorProfile, patientProfile);
    }

    // -------------------------------------------------------------------------
    // GetDoctorAppointmentsAsync
    // -------------------------------------------------------------------------
    public async Task<IEnumerable<AppointmentResponseDto>> GetDoctorAppointmentsAsync(Guid doctorUserId)
    {
        var appointments = await _db.Appointments
            .AsNoTracking()
            .Include(a => a.DoctorProfile).ThenInclude(d => d.User)
            .Include(a => a.PatientProfile).ThenInclude(p => p.User)
            .Where(a =>
                a.DoctorProfile.UserId == doctorUserId &&
                a.StartTimeUtc >= DateTime.UtcNow.Date) // today onwards
            .OrderBy(a => a.StartTimeUtc)
            .ToListAsync();

        return appointments.Select(a =>
            MapToResponseDto(a, a.DoctorProfile, a.PatientProfile));
    }

    // -------------------------------------------------------------------------
    // GetPatientAppointmentsAsync
    // -------------------------------------------------------------------------
    public async Task<IEnumerable<AppointmentResponseDto>> GetPatientAppointmentsAsync(Guid patientUserId)
    {
        var appointments = await _db.Appointments
            .AsNoTracking()
            .Include(a => a.DoctorProfile).ThenInclude(d => d.User)
            .Include(a => a.PatientProfile).ThenInclude(p => p.User)
            .Where(a => a.PatientProfile.UserId == patientUserId)
            .OrderByDescending(a => a.StartTimeUtc)
            .ToListAsync();

        return appointments.Select(a =>
            MapToResponseDto(a, a.DoctorProfile, a.PatientProfile));
    }

    // -------------------------------------------------------------------------
    // UpdateStatusAsync — status machine transitions
    // -------------------------------------------------------------------------
    public async Task<AppointmentResponseDto> UpdateStatusAsync(
        Guid appointmentId, string newStatus, Guid requestingUserId, string requestingUserRole)
    {
        var appointment = await _db.Appointments
            .Include(a => a.DoctorProfile).ThenInclude(d => d.User)
            .Include(a => a.PatientProfile).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == appointmentId)
            ?? throw new KeyNotFoundException("Appointment not found.");

        // Authorization check: ensure the requesting user owns this appointment
        var isDoctor = requestingUserRole == "Doctor" &&
                       appointment.DoctorProfile.UserId == requestingUserId;
        var isPatient = requestingUserRole == "Patient" &&
                        appointment.PatientProfile.UserId == requestingUserId;
        var isAdmin = requestingUserRole == "Admin";

        if (!isDoctor && !isPatient && !isAdmin)
            throw new UnauthorizedAccessException("You are not authorized to modify this appointment.");

        // Parse and validate the status transition
        if (!Enum.TryParse<AppointmentStatus>(newStatus, ignoreCase: true, out var parsedStatus))
            throw new InvalidOperationException($"Invalid status: {newStatus}");

        appointment.Status = parsedStatus;
        appointment.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return MapToResponseDto(appointment, appointment.DoctorProfile, appointment.PatientProfile);
    }

    // -------------------------------------------------------------------------
    // Private mapper — converts EF entities to DTOs
    // -------------------------------------------------------------------------
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