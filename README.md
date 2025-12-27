# Multi-Tenant SaaS Platform - Project & Task Management System

A production-ready, multi-tenant SaaS application where multiple organizations can independently register, manage teams, and track projects with complete data isolation, role-based access control (RBAC), and subscription management.

## 🚀 Features

- **Multi-Tenancy Architecture**: Shared database with `tenant_id` column isolation and unique subdomain identification.
- **Role-Based Access Control (RBAC)**: Secure access for Super Admin (system-level), Tenant Admin (org-level), and User (team member).
- **Subscription Plan Enforcement**: Automated checks for `max_users` and `max_projects` based on Free, Pro, and Enterprise plans.
- **Audit Logging**: Mandatory tracking of all critical CREATE, UPDATE, and DELETE actions in the `audit_logs` table.
- **Kanban Task Management**: Real-time project tracking with tasks grouped by status (Todo, In Progress, Completed).
- **Responsive Dashboard**: Data-driven overview showing organization-wide statistics and recent activities.

## 🛠️ Tech Stack

- **Frontend**: React.js, React Router, Axios (Stateless UI).
- **Backend**: Node.js, Express.js (RESTful API).
- **Database**: PostgreSQL 15 (Relational storage with Foreign Key constraints).
- **Authentication**: JWT (JSON Web Tokens) with 24-hour expiry.
- **Containerization**: Docker & Docker Compose (Mandatory).

## 🏛️ Architecture Overview

The system follows a "Shared Database, Shared Schema" approach, utilizing a mandatory `tenant_id` on every table (projects, tasks, users) to ensure strict data isolation.

## ⚙️ Installation & Setup (MANDATORY)

This application is fully containerized. Follow these steps for a one-command deployment:

1. **Prerequisites**: Ensure Docker and Docker Compose are installed on your machine.
2. **Clone the Repo**: `git clone https://github.com/Srikar-jayanthi/saas-platform.git`
3. **Start Services**: Run the following command in the root directory:
`docker-compose up -d`

**Access the App:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

*The database will be automatically initialized with migrations and seed data upon startup.*

## 🔑 Test Credentials

Detailed credentials for all roles are provided in the submission.json file located in the root directory.

| Role          | Email                    | Password  | Tenant/Subdomain |
|---------------|--------------------------|-----------|------------------|
| Super Admin   | superadmin@system.com    | Admin@123 | (None)           |
| Tenant Admin  | admin@demo.com           | Demo@123  | demo             |
| Standard User | user1@demo.com           | User@123  | demo             |

## 📡 API Documentation

All 19 endpoints are documented in docs/API.md. Key modules include:

- POST /api/auth/register-tenant: Organization onboarding.
- POST /api/auth/login: Tenant-specific authentication.
- GET /api/health: System and database status check.
- GET /api/projects: Isolated project listing.
- GET /api/tenants: Platform-wide management (Super Admin only).

## 📄 Documentation

- Research Document: docs/research.md (Multi-tenancy analysis).
- PRD: docs/PRD.md (User personas and requirements).
- Architecture: docs/architecture.md (ERD and System Design).
- Technical Spec: docs/technical-spec.md (Setup and structure).
