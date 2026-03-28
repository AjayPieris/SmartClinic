// =============================================================================
// AppDbContext.cs — The EF Core gateway to Neon PostgreSQL.
//
// Responsibilities:
//   1. Register all DbSets (one per model)
//   2. Configure relationships, constraints, and indexes in OnModelCreating
//   3. Set up the xmin concurrency token for Appointment (Postgres-specific)
//   4. Seed the Admin user on first migration
// =============================================================================

using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Data.Models;

namespace SmartClinic.API.Data;

public class AppDbContext : DbContext
{
    // Injected via DI — connection string comes from appsettings.json
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // -------------------------------------------------------------------------
    // DbSets — one per model = one table in Postgres
    // -------------------------------------------------------------------------
    public DbSet<User> Users => Set<User>();
    public DbSet<DoctorProfile> DoctorProfiles => Set<DoctorProfile>();
    public DbSet<PatientProfile> PatientProfiles => Set<PatientProfile>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<MedicalDocument> MedicalDocuments => Set<MedicalDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =====================================================================
        // User configuration
        // =====================================================================
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            // Unique index on Email — prevents duplicate registrations at DB level
            entity.HasIndex(u => u.Email).IsUnique();

            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.Role).IsRequired().HasMaxLength(20);
        });

        // =====================================================================
        // DoctorProfile — 1-to-1 with User
        // =====================================================================
        modelBuilder.Entity<DoctorProfile>(entity =>
        {
            entity.HasKey(d => d.Id);

            // Configure the 1-to-1 relationship with cascade delete:
            // deleting a User also deletes their DoctorProfile
            entity.HasOne(d => d.User)
                  .WithOne(u => u.DoctorProfile)
                  .HasForeignKey<DoctorProfile>(d => d.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(d => d.Specialization).HasMaxLength(200);
            entity.Property(d => d.LicenseNumber).HasMaxLength(100);
        });

        // =====================================================================
        // PatientProfile — 1-to-1 with User
        // =====================================================================
        modelBuilder.Entity<PatientProfile>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.HasOne(p => p.User)
                  .WithOne(u => u.PatientProfile)
                  .HasForeignKey<PatientProfile>(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // =====================================================================
        // Appointment — many-to-many bridge between Doctor and Patient profiles
        // =====================================================================
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(a => a.Id);

            // Doctor relationship — restrict delete so we don't lose history
            entity.HasOne(a => a.DoctorProfile)
                  .WithMany(d => d.Appointments)
                  .HasForeignKey(a => a.DoctorProfileId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Patient relationship
            entity.HasOne(a => a.PatientProfile)
                  .WithMany(p => p.Appointments)
                  .HasForeignKey(a => a.PatientProfileId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Composite index for the double-booking query:
            // "Does this doctor have any appointment overlapping this time window?"
            // This index makes that WHERE clause very fast.
            entity.HasIndex(a => new { a.DoctorProfileId, a.StartTimeUtc, a.EndTimeUtc })
                  .HasDatabaseName("IX_Appointments_Doctor_TimeSlot");

            // Map AppointmentStatus enum to its integer value in the DB
            entity.Property(a => a.Status)
                  .HasConversion<int>();

            // CRITICAL: Use Postgres xmin as the concurrency token.
            // xmin is a system column that increments on every row update.
            // EF Core checks this value during SaveChanges and throws
            // DbUpdateConcurrencyException if it changed since we last read.
            entity.UseXminAsConcurrencyToken();
        });

        // =====================================================================
        // ChatMessage
        // =====================================================================
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.HasOne(c => c.Appointment)
                  .WithMany(a => a.ChatMessages)
                  .HasForeignKey(c => c.AppointmentId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Sender is a User — no navigation from User to ChatMessages
            // to keep the User entity lightweight
            entity.HasOne(c => c.Sender)
                  .WithMany()
                  .HasForeignKey(c => c.SenderId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(c => c.MessageText).HasMaxLength(4000);
        });

        // =====================================================================
        // MedicalDocument
        // =====================================================================
        modelBuilder.Entity<MedicalDocument>(entity =>
        {
            entity.HasKey(m => m.Id);

            entity.HasOne(m => m.PatientProfile)
                  .WithMany(p => p.MedicalDocuments)
                  .HasForeignKey(m => m.PatientProfileId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(m => m.CloudinaryUrl).HasMaxLength(1000);
            entity.Property(m => m.DocumentName).HasMaxLength(500);
        });

        // =====================================================================
        // Seed Data — a default Admin user so you can log in on day one.
        // Password: "Admin@123!" — CHANGE THIS before production.
        // =====================================================================
        var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = adminId,
            FirstName = "System",
            LastName = "Admin",
            Email = "admin@smartclinic.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123!"),
            Role = "Admin",
            CreatedAtUtc = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAtUtc = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        });
    }
}