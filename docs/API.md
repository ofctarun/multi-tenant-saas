# API Documentation

This document provides a comprehensive list of the 19 API endpoints implemented in the Multi-Tenant SaaS Platform. All responses follow the format: `{ "success": boolean, "message": string, "data": object }`.

## 1. Authentication Module

Endpoints for tenant registration, user login, and session management.

- **POST** `/api/auth/register-tenant`
  - **Auth**: None (Public)
  - **Description**: Registers a new organization and its primary administrator.
  - **Request Body**: `tenantName, subdomain, adminEmail, adminPassword, adminFullName`

- **POST** `/api/auth/login`
  - **Auth**: None (Public)
  - **Description**: Authenticates a user and returns a 24-hour JWT.
  - **Request Body**: `email, password, tenantSubdomain`

- **GET** `/api/auth/me`
  - **Auth**: Required (JWT)
  - **Description**: Returns the current authenticated user's profile and tenant info.

- **POST** `/api/auth/logout`
  - **Auth**: Required (JWT)
  - **Description**: Informs the system to end the session (handled client-side by token removal).

## 2. Tenant Management Module

Endpoints for system-level and organization-level administration.

- **GET** `/api/tenants`
  - **Auth**: Required (Super Admin Only)
  - **Description**: Lists all tenants in the system with their usage stats.

- **GET** `/api/tenants/:tenantId`
  - **Auth**: Required (Tenant Admin or Super Admin)
  - **Description**: Retrieves details for a specific organization, including subscription limits.

- **PUT** `/api/tenants/:tenantId`
  - **Auth**: Required (Tenant Admin or Super Admin)
  - **Description**: Updates organization name (Tenant Admin) or status/plan (Super Admin).

## 3. User Management Module

Endpoints for managing team members within an organization.

- **POST** `/api/tenants/:tenantId/users`
  - **Auth**: Required (Tenant Admin)
  - **Description**: Adds a new user. Enforces `max_users` plan limits.
  - **Request Body**: `email, password, fullName, role`

- **GET** `/api/tenants/:tenantId/users`
  - **Auth**: Required (Same Tenant)
  - **Description**: Lists all users belonging to the organization.

- **PUT** `/api/users/:userId`
  - **Auth**: Required (Tenant Admin or Self)
  - **Description**: Updates user profile details or active status.

- **DELETE** `/api/users/:userId`
  - **Auth**: Required (Tenant Admin)
  - **Description**: Removes a user. Tenant admins cannot delete themselves.

## 4. Project Management Module

Endpoints for handling organization-wide projects.

- **POST** `/api/projects`
  - **Auth**: Required (Any Role)
  - **Description**: Creates a new project. Enforces `max_projects` plan limits.
  - **Request Body**: `name, description`

- **GET** `/api/projects`
  - **Auth**: Required (Any Role)
  - **Description**: Lists all projects for the user's organization.

- **PUT** `/api/projects/:projectId`
  - **Auth**: Required (Admin or Creator)
  - **Description**: Updates project name, description, or status (Active/Archived).

- **DELETE** `/api/projects/:projectId`
  - **Auth**: Required (Admin or Creator)
  - **Description**: Deletes a project and all associated tasks.

## 5. Task Management Module

Endpoints for granular task tracking within projects.

- **POST** `/api/projects/:projectId/tasks`
  - **Auth**: Required (Any Role)
  - **Description**: Creates a task. Inherits `tenant_id` from the project for isolation.
  - **Request Body**: `title, description, assignedTo, priority, dueDate`

- **GET** `/api/projects/:projectId/tasks`
  - **Auth**: Required (Any Role)
  - **Description**: Lists all tasks within a specific project.

- **PATCH** `/api/tasks/:taskId/status`
  - **Auth**: Required (Any Role)
  - **Description**: Specialized endpoint for quick status updates (Todo/In Progress/Done).

- **PUT** `/api/tasks/:taskId`
  - **Auth**: Required (Any Role)
  - **Description**: Full update of task details, assignments, or deadlines.

## 6. System Health

- **GET** `/api/health`
  - **Auth**: None
  - **Description**: Returns status "ok" and database connection status for monitoring.
