# System Architecture

## 1. Overview

This SaaS platform uses a **Shared Database, Shared Schema** approach. Data isolation is enforced at the application level using a `tenant_id` column on all primary tables.

## 2. Components

- **Frontend**: React SPA communicating via REST API.
- **Backend**: Node.js/Express service handling business logic and RBAC.
- **Database**: PostgreSQL storing tenant, user, project, and task data.

## 3. Database ERD

- **Tenants**: Stores organization settings and limits.
- **Users**: Associated with a `tenant_id` (except Super Admins).
- **Projects**: Filtered by `tenant_id`.
- **Tasks**: Filtered by `tenant_id` and linked to `project_id`.

## 4. API Endpoints

- `POST /api/auth/register-tenant`: Atomic transaction for new organizations.
- `POST /api/auth/login`: Issues 24h JWT with tenant context.
- `GET /api/projects`: Isolated query returns only tenant-specific data.
