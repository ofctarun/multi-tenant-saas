# Technical Specification

## 1. Project Structure

The application follows a modular architecture separating the concern of data, logic, and presentation.

```text
/
├── backend/
│   ├── src/
│   │   ├── config/       # Database connection pool
│   │   ├── controllers/  # Request handlers and business logic
│   │   ├── middleware/   # Authentication, Authorization, and Tenant isolation
│   │   ├── routes/       # API endpoint definitions
│   │   └── app.js        # Main Express application setup
│   ├── Dockerfile        # Backend container definition
│   └── package.json      # Dependencies and scripts
├── frontend/
│   ├── src/
│   │   ├── pages/        # Neat UI components and screens
│   │   ├── services/     # API integration using Axios
│   │   ├── App.js        # Protected routing and layout
│   │   └── index.css     # Global neat UI styling
│   ├── Dockerfile        # Frontend container definition
│   └── package.json
├── database/
│   ├── migrations/       # SQL files for automatic table creation
│   └── seeds/            # SQL files for mandatory test data
├── docs/                 # Mandatory research and architecture docs
├── docker-compose.yml    # Main orchestration file
├── README.md             # Project overview and setup guide
└── submission.json       # Mandatory test credentials
```

## 2. Development Setup Guide

### Prerequisites

- Docker & Docker Desktop: Required to run the containerized environment
- Node.js v18+: Required for local development and package management
- PostgreSQL: Managed via Docker container

### Installation Steps

- Initialize Environment: Ensure the `.env` file exists in the backend folder
- Build Containers:

  ```bash
  docker-compose build --no-cache
  ```

- Start Platform:

  ```bash
  docker-compose up -d
  ```

- Access UI: Visit <http://localhost:3000> in your browser

## 3. Implementation Details

### Multi-Tenancy Strategy

- Architecture: Shared Database, Shared Schema
- Isolation: Every table contains a `tenant_id` column
- Enforcement: The authenticate middleware extracts `tenantId` from the JWT and applies it to all SQL queries

### Security

- Authentication: Stateless JWT-based authentication with 24-hour expiry
- Password Safety: Bcrypt hashing with 10–12 salt rounds
- RBAC: Middleware-based role checking (super_admin, tenant_admin, user)

### Subscription Management

- Plan Checks: Before creating users or projects, the backend queries the tenants table to compare current counts against `max_users` and `max_projects`
- Blocking: If limits are reached, the API returns a 403 Forbidden response

## 4. Database Initialization

Database setup is 100% automated using the `docker-entrypoint-initdb.d` volume mapping in `docker-compose.yml`.  
Migrations and seed files execute automatically as soon as the database container is healthy.
