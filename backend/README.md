Multi-Tenant SaaS Backend API
=============================

This repository contains the backend service for the Multi-Tenant SaaS Platform, a project and task management system designed with strict data isolation and role-based access control.

🚀 Features
-----------

*   **Multi-Tenancy:** Data isolation at the database level using tenant\_id filtering to ensure users only see data belonging to their organization.
    
*   **Role-Based Access Control (RBAC):** Granular permissions for Super Admins, Tenant Admins, and Users.
    
*   **JWT Authentication:** Secure user authentication using JSON Web Tokens and password hashing with bcrypt.
    
*   **Audit Logging:** Automatic tracking of critical actions including user, project, and task updates.
    
*   **Automated Database Management:** Automatic execution of migrations and seeds on startup to ensure the schema is always up to date.
    
*   **Health Monitoring:** Dedicated endpoint to verify API and database connectivity.
    

🛠 Tech Stack
-------------

*   **Runtime:** Node.js (v18+)
    
*   **Framework:** Express.js
    
*   **Database:** PostgreSQL
    
*   **Authentication:** JWT (JsonWebToken)
    
*   **Process Management:** Nodemon (for development)
    
*   **Containerization:** Docker
    

📁 Project Structure
--------------------
├── src/
│   ├── config/          # Database connection & environment config
│   ├── controllers/     # Request handling & business logic
│   ├── middleware/      # Auth, RBAC, JWT, tenant isolation
│   ├── routes/          # Route definitions (auth, tenants, users, etc.)
│   ├── utils/           # Migration runner, seed loader, helpers
│   └── app.js           # Express app setup & middleware registration
│
├── migrations/          # SQL schema migrations
├── seeds/               # Initial demo / sample data
├── Dockerfile           # Backend container configuration
├── docker-compose.yml   # Service orchestration (if present)
├── package.json         # Dependencies & scripts
└── README.md


⚙️ Environment Variables
------------------------

The backend requires the following environment variables to be defined in a .env file:

**VariableDescriptionDefault**DB\_HOSTDatabase hostdatabaseDB\_PORTPostgreSQL port5432DB\_NAMEDatabase namesaas\_dbDB\_USERDatabase userpostgresDB\_PASSWORDDatabase passwordpostgresJWT\_SECRETSecret for signing tokensdev\_secret\_key\_1234567890...JWT\_EXPIRES\_INToken expiration time24hPORTAPI server port5000FRONTEND\_URLAllowed CORS originhttp://frontend:3000

🚦 Getting Started
------------------

### Prerequisites

*   Node.js (v18+)
    
*   Docker & Docker Compose (Recommended)
    

### Using Docker (Recommended)

From the root directory of the project, run:

Bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   docker-compose up -d   `

### Manual Setup

1.  Bashnpm install
    
2.  **Configure environment:** Create a .env file based on the table above.
    
3.  **Start the server:**
    
    *   Development: npm run dev
        
    *   Production: npm start
        

🛣 API Routes
-------------

The API is accessible at http://localhost:5000/api.

**CategoryEndpointDescriptionAuth**/api/authUser login and registration**Tenants**/api/tenantsTenant management (Admin only)**Users**/api/usersUser management within a tenant**Projects**/api/projectsProject management**Tasks**/api/tasksTask management**Health**/api/healthAPI and DB status check

📜 Error Handling
-----------------

The API follows a standardized error response format:

JSON

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "success": false,    "message": "Error description"  }   `