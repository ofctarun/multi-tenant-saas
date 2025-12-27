# Multi-Tenancy Research Document

## 1. Multi-Tenancy Architecture Analysis

For this SaaS platform, we evaluated three primary architectural patterns for data isolation:

### Approach A: Shared Database + Shared Schema (Column-based Isolation)
In this model, all tenants share the same database and the same tables. A `tenant_id` column is added to every table to distinguish data.
- **Pros:** Easiest to maintain, lowest cost, simple migrations, scales well for thousands of small tenants.
- **Cons:** Risk of "leaky" data if a developer forgets a WHERE clause; "noisy neighbor" effect where one tenant's high usage affects others.

### Approach B: Shared Database + Separate Schema
Each tenant has their own schema (namespace) within one database.
- **Pros:** Better security than column-based; allows for some tenant-specific customization.
- **Cons:** Harder to run analytics across all tenants; migration scripts become complex as you must run them for every schema.

### Approach C: Separate Database
Every tenant gets a physically separate database instance.
- **Pros:** Highest isolation and security; no "noisy neighbor" effect.
- **Cons:** Extremely expensive; massive management overhead for updates and backups.

### Chosen Approach: Shared Database + Shared Schema
**Justification:** We have chosen **Approach A** (Shared Schema) because it aligns perfectly with the requirement for "Tenant Identification via tenant_id". It is the most cost-effective for a startup SaaS and allows us to use standard PostgreSQL indexes on `tenant_id` to maintain high performance. Security will be enforced via a mandatory Backend Middleware that injects the `tenant_id` into every query.

## 2. Technology Stack Justification

- **Backend: Node.js with Express.js**: Chosen for its non-blocking I/O and vast ecosystem. Express allows us to build the 19 required REST endpoints quickly with clear middleware for RBAC.
- **Frontend: React.js**: The industry standard for SPAs. Its component-based architecture makes building the Dashboard and Project views efficient.
- **Database: PostgreSQL**: A robust relational database required for complex foreign key constraints (CASCADE deletes) and the JSONB support we might need for audit logs.
- **Auth: JWT (JSON Web Tokens)**: Perfect for stateless multi-tenancy. We can encode the `tenant_id` and `role` directly into the token payload.
- **Containerization: Docker**: Mandatory for this project to ensure the "one-command" setup (`docker-compose up`) works regardless of the host machine.

## 3. Security Considerations
1. **Data Isolation:** Every SQL query will be appended with `WHERE tenant_id = current_user_tenant_id`.
2. **RBAC:** We will implement a `checkRole` middleware to restrict Super Admin and Tenant Admin routes.
3. **Password Hashing:** Using `bcrypt` with 12 salt rounds to prevent rainbow table attacks.
4. **JWT Expiry:** Tokens expire in 24 hours to minimize the window of opportunity for stolen tokens.
5. **CORS:** Restricting API access only to the frontend service container.