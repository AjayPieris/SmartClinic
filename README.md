<div align="center">

# 🏥 SmartClinic

### A Full-Stack Telehealth Scheduling & Communication Platform

[![.NET](https://img.shields.io/badge/.NET_10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

*Appointment scheduling · Real-time chat · Document management · Role-based access control*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [User Roles](#-user-roles)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)

---

## 🌐 Overview

**SmartClinic** is a production-ready full-stack telehealth platform that connects **patients**, **doctors**, and **administrators** through a unified web application. It provides secure appointment scheduling, real-time messaging, medical document management, and comprehensive admin controls — all secured with JWT-based role authentication.

The backend is built on **ASP.NET Core (.NET 10)** with a clean **N-Tier architecture** (Controller → Service → EF Core), while the frontend is a lightning-fast **React 19 + Vite SPA** with code-splitting, lazy-loaded routes, and a custom CSS design system.

---

## ✨ Features

### 👤 Patient Portal
| Feature | Description |
|---|---|
| **Appointment Booking** | Browse doctors, select time slots, and book appointments |
| **Appointment Management** | View upcoming/past appointments with real-time status updates |
| **Real-Time Chat** | Communicate directly with doctors via Pusher-powered messaging |
| **Document Uploads** | Upload and manage medical documents stored on Cloudinary |
| **Profile Management** | Maintain personal health profile and contact information |

### 👨‍⚕️ Doctor Portal
| Feature | Description |
|---|---|
| **Schedule View** | Timeline-based view of daily/weekly appointments |
| **Availability Management** | Set and update weekly availability windows |
| **Clinical Notes** | Write and store per-appointment consultation notes |
| **Real-Time Chat** | Respond to patients with live, bidirectional messaging |
| **Profile Management** | Maintain specialization, bio, and professional details |

### 🔧 Admin Portal
| Feature | Description |
|---|---|
| **User Management** | View, manage, and control all patient accounts |
| **Doctor Management** | Verify doctor credentials and manage practitioner accounts |
| **System Oversight** | Monitor platform-wide activity |

### 🔒 Platform-Wide
- **JWT Authentication** — Stateless, role-aware Bearer tokens (8-hour expiry)
- **Role-Based Access Control** — `Patient`, `Doctor`, `Admin` role guards on every route
- **Global Exception Handling** — Centralized middleware catches and formats all errors
- **Auto DB Migration** — EF Core migrations applied automatically on startup
- **Retry Logic** — Transient Neon/PostgreSQL failures retried up to 3× with backoff

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React 19 Frontend                    │
│  (Vite SPA · React Router v7 · Axios · Pusher-JS)      │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST + Pusher WebSocket
┌──────────────────────────▼──────────────────────────────┐
│              ASP.NET Core (.NET 10) API                 │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Controllers  │→ │   Services   │→ │  EF Core DB  │  │
│  │  (7 routes)  │  │  (6 scoped)  │  │   Context    │  │
│  └──────────────┘  └──────────────┘  └──────┬───────┘  │
│                                             │           │
│  ┌──────────────┐  ┌──────────────┐         │           │
│  │  Cloudinary  │  │    Pusher    │         │           │
│  │  (singleton) │  │  (singleton) │         │           │
│  └──────────────┘  └──────────────┘         │           │
└─────────────────────────────────────────────┼───────────┘
                                              │
                              ┌───────────────▼──────────┐
                              │   Neon PostgreSQL (Cloud) │
                              └───────────────────────────┘
```

**Middleware Pipeline Order (critical in ASP.NET Core):**
1. `GlobalExceptionMiddleware` — Catch-all for unhandled exceptions
2. Swagger UI — Development only
3. HTTPS Redirection
4. CORS — `ReactFrontend` policy
5. Authentication — JWT Bearer validation
6. Authorization — Role claim enforcement
7. Controller routing

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **ASP.NET Core** | .NET 10 | Web API framework |
| **Entity Framework Core** | 10.0.5 | ORM & migrations |
| **Npgsql** | 10.0.1 | PostgreSQL driver for EF Core |
| **BCrypt.Net-Next** | 4.1.0 | Secure password hashing |
| **JwtBearer** | 10.0.5 | JWT authentication middleware |
| **CloudinaryDotNet** | 1.28.0 | Cloud media storage |
| **PusherServer** | 5.0.0 | Real-time WebSocket events |
| **Swashbuckle** | 10.1.7 | Swagger/OpenAPI docs |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2 | UI library |
| **Vite** | 8.0 | Build tool & dev server |
| **React Router** | 7.13 | Client-side routing |
| **Axios** | 1.14 | HTTP client with interceptors |
| **Pusher-JS** | 8.4 | Real-time WebSocket client |
| **date-fns** | 4.1 | Date formatting utilities |
| **Vanilla CSS Modules** | — | Scoped, component-level styles |

### Infrastructure
| Service | Purpose |
|---|---|
| **Neon (PostgreSQL)** | Serverless cloud database |
| **Cloudinary** | Medical document & image storage |
| **Pusher** | Real-time bidirectional messaging |
| **Vercel** | Frontend deployment |

---

## 📁 Project Structure

```
SmartClinic.API/
│
├── Controllers/                  # API endpoint handlers
│   ├── AuthController.cs         # Login & registration
│   ├── AppointmentsController.cs # Booking & scheduling
│   ├── DoctorsController.cs      # Doctor profile & availability
│   ├── ChatController.cs         # Real-time messaging
│   ├── DocumentsController.cs    # Medical document uploads
│   ├── NotificationsController.cs# In-app notifications
│   └── AdminController.cs        # Admin management endpoints
│
├── Services/                     # Business logic layer
│   ├── Interfaces/               # Service contracts (ISP)
│   ├── AppointmentService.cs
│   ├── ChatService.cs
│   ├── CloudinaryService.cs
│   ├── DocumentService.cs
│   ├── NotificationService.cs
│   └── PusherService.cs
│
├── Data/
│   ├── AppDbContext.cs           # EF Core DbContext
│   └── Models/                  # Domain entities
│       ├── User.cs
│       ├── Appointment.cs
│       ├── DoctorProfile.cs
│       ├── PatientProfile.cs
│       ├── ChatMessage.cs
│       ├── MedicalDocument.cs
│       ├── Notification.cs
│       └── VerificationStatus.cs
│
├── DTOs/                         # Request/response data shapes
├── Middleware/
│   └── GlobalExceptionMiddleware.cs
├── Migrations/                   # EF Core migration history
├── Program.cs                    # DI composition root & pipeline
├── appsettings.json
│
└── Frontend/                     # React SPA (Vite)
    ├── index.html
    ├── vite.config.js
    ├── vercel.json                # SPA redirect rule
    └── src/
        ├── App.jsx                # Root router
        ├── api/                  # Axios instance & API modules
        ├── components/           # Shared/reusable UI components
        │   ├── guards/           # ProtectedRoute & RoleGuard
        │   ├── schedule/         # Appointment timeline components
        │   └── ...
        ├── context/              # React Context (AuthContext etc.)
        ├── hooks/                # Custom hooks
        ├── layouts/              # PatientLayout, DoctorLayout, AdminLayout
        ├── lib/                  # Third-party wrappers (Pusher)
        ├── pages/
        │   ├── auth/             # Login, Register
        │   ├── patient/          # Appointments, Chat, Documents, Profile, Book
        │   ├── doctor/           # Schedule, Availability, Chat, Notes, Profile
        │   └── admin/            # Users, Doctors
        └── utils/                # Shared utilities
```

---

## 🚀 Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) & npm
- A [Neon](https://neon.tech/) PostgreSQL database (free tier works)
- A [Cloudinary](https://cloudinary.com/) account (free tier works)
- A [Pusher](https://pusher.com/) account (free Sandbox tier works)

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/SmartClinic.git
cd SmartClinic
```

---

### 2. Configure the Backend

Copy the sample settings and fill in your credentials:

```bash
cp appsettings.json appsettings.Development.json
```

Edit `appsettings.Development.json` (see [Environment Variables](#-environment-variables) below).

**Run the API:**

```bash
dotnet restore
dotnet run
```

The API will be available at `https://localhost:7xxx` and Swagger UI at `https://localhost:7xxx/swagger`.

> EF Core migrations are applied **automatically** on startup — no manual `dotnet ef database update` needed in development.

---

### 3. Configure the Frontend

```bash
cd Frontend
cp .env.example .env     # or create .env manually
npm install
npm run dev
```

The React app will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables

### Backend — `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=<neon-host>; Database=<db>; Username=<user>; Password=<password>; SSL Mode=VerifyFull;"
  },
  "Jwt": {
    "Secret": "<min-32-char-secret-key>",
    "Issuer": "SmartClinic.API",
    "Audience": "SmartClinic.Client",
    "ExpiryHours": 8
  },
  "Cloudinary": {
    "CloudName": "<your-cloud-name>",
    "ApiKey": "<your-api-key>",
    "ApiSecret": "<your-api-secret>"
  },
  "Pusher": {
    "AppId": "<your-app-id>",
    "Key": "<your-key>",
    "Secret": "<your-secret>",
    "Cluster": "<your-cluster>"
  }
}
```

> ⚠️ **Never commit real secrets.** Add `appsettings.Development.json` to `.gitignore` or use environment variables / Secret Manager in production.

### Frontend — `Frontend/.env`

```env
VITE_API_BASE_URL=https://localhost:7xxx
VITE_PUSHER_KEY=<your-pusher-key>
VITE_PUSHER_CLUSTER=<your-pusher-cluster>
```

---

## 📡 API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Authenticate and receive JWT |
| `GET` | `/api/appointments` | Patient / Doctor | List appointments for current user |
| `POST` | `/api/appointments` | Patient | Book an appointment |
| `PUT` | `/api/appointments/{id}` | Doctor | Update appointment status |
| `GET` | `/api/doctors` | Patient | Browse available doctors |
| `GET` | `/api/doctors/{id}/availability` | Patient | Get doctor's availability slots |
| `PUT` | `/api/doctors/availability` | Doctor | Update availability windows |
| `GET` | `/api/chat/{appointmentId}` | Patient / Doctor | Load chat history |
| `POST` | `/api/chat/{appointmentId}` | Patient / Doctor | Send a chat message |
| `POST` | `/api/documents` | Patient | Upload a medical document |
| `GET` | `/api/documents` | Patient | List own documents |
| `GET` | `/api/notifications` | All | Fetch unread notifications |
| `GET` | `/api/admin/users` | Admin | List all patients |
| `GET` | `/api/admin/doctors` | Admin | List all doctors |
| `PUT` | `/api/admin/doctors/{id}/verify` | Admin | Verify a doctor account |

> **Full interactive documentation** is available via Swagger UI at `/swagger` when running in Development mode.

---

## 👥 User Roles

SmartClinic uses claim-based Role-Based Access Control (RBAC). The `role` claim is embedded in the JWT and enforced on **both** the API (via `[Authorize(Roles = "...")]`) and the frontend (via `<RoleGuard>`).

```
┌──────────┬────────────────────────────────────────────────────────┐
│ Role     │ Permissions                                            │
├──────────┼────────────────────────────────────────────────────────┤
│ Patient  │ Book appointments · Chat · Upload documents · Profile  │
│ Doctor   │ View schedule · Set availability · Notes · Chat        │
│ Admin    │ Manage all users · Verify doctors · Platform oversight │
└──────────┴────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

Core entities managed by EF Core:

```
User ──┬── PatientProfile
       └── DoctorProfile ──── VerificationStatus

Appointment ──── User (Patient FK)
             └── DoctorProfile FK

ChatMessage ──── Appointment FK

MedicalDocument ── User (Patient FK)

Notification ──── User FK
```

| Entity | Key Fields |
|---|---|
| `User` | Id, Email, PasswordHash, Role, CreatedAt |
| `DoctorProfile` | UserId, Specialization, Bio, LicenseNumber, IsVerified |
| `PatientProfile` | UserId, DateOfBirth, BloodType, Allergies |
| `Appointment` | Id, PatientId, DoctorId, ScheduledAt, Status, Notes |
| `ChatMessage` | Id, AppointmentId, SenderId, Content, SentAt |
| `MedicalDocument` | Id, PatientId, FileName, CloudinaryUrl, UploadedAt |
| `Notification` | Id, UserId, Message, IsRead, CreatedAt |

---

## ☁️ Deployment

### Frontend (Vercel)

The frontend is configured for Vercel with a SPA rewrite rule (`vercel.json`) that redirects all routes to `index.html`, allowing React Router to handle client-side navigation.

```bash
cd Frontend
npm run build      # Outputs to dist/
# Push to GitHub → Vercel auto-deploys on push
```

Set all `VITE_*` environment variables in the Vercel project dashboard.

### Backend

The .NET API can be deployed to any host that supports .NET 10:

- **Railway / Render** — `dotnet publish -c Release` → Docker or native runner
- **Azure App Service** — Native .NET support with publish profiles
- **Docker** — Add a `Dockerfile` using the `mcr.microsoft.com/dotnet/aspnet:10.0` base image

Set all `ConnectionStrings`, `Jwt`, `Cloudinary`, and `Pusher` values as environment variables (not in `appsettings.json`) for any production deployment.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Built with ❤️ using .NET 10 & React 19
</div>
