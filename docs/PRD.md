# Product Requirements Document (PRD)

## User Personas

1. **Super Admin**: Manages the platform, monitors all tenants, and updates subscription plans.
2. **Tenant Admin**: Manages their specific organization, invites users, and oversees all projects.
3. **End User**: Focuses on task execution and project updates within their assigned organization.

## Functional Requirements

- **FR-001**: System shall allow tenant registration with a unique subdomain.
- **FR-002**: System shall support JWT login with tenant-specific context.
- **FR-003**: System shall isolate all project data by `tenant_id`.
- **FR-004**: System shall enforce User Limits (Free: 5, Pro: 25, Enterprise: 100).
- **FR-005**: System shall enforce Project Limits (Free: 3, Pro: 15, Enterprise: 50).
- **FR-006**: Super Admin shall have the ability to suspend any tenant.
- **FR-007**: Tenant Admin shall be able to add/remove users.
- **FR-008**: Users shall be able to create tasks within projects.
- **FR-009**: Users shall be able to update task status (Todo/In Progress/Completed).
- **FR-010**: System shall log all entity deletions in `audit_logs`.
- **FR-011**: System shall provide a dashboard with real-time stats.
- **FR-012**: System shall support searching projects by name.
- **FR-013**: System shall support filtering tasks by priority.
- **FR-014**: System shall allow Tenant Admins to update the organization name.
- **FR-015**: System shall provide a health check endpoint for monitoring.

## Non-Functional Requirements

- **NFR-001 (Security)**: All API endpoints must be protected by JWT except registration and login.
- **NFR-002 (Performance)**: Database queries must be indexed on `tenant_id`.
- **NFR-003 (Scalability)**: Application must be containerized for horizontal scaling.
- **NFR-004 (Usability)**: Frontend must be fully responsive for mobile devices.
- **NFR-005 (Reliability)**: Critical operations must use SQL Transactions to prevent data orphans.
