using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartClinic.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "DoctorProfiles",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationDocumentUrl",
                table: "DoctorProfiles",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VerificationStatus",
                table: "DoctorProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerifiedAtUtc",
                table: "DoctorProfiles",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "VerificationDocumentUrl",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "VerificationStatus",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "VerifiedAtUtc",
                table: "DoctorProfiles");
        }
    }
}
