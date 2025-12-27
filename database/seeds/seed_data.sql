-- 1. Wipe Everything
TRUNCATE tasks, projects, users, audit_logs, tenants CASCADE;

-- 2. Create the Demo Tenant (Subdomain: demo)
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, plan_name, max_users, max_projects)
VALUES ('d0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'Demo Company', 'demo', 'active', 'pro', 'Pro Plan', 25, 15);

-- 3. Super Admin (tenant_id is NULL)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (gen_random_uuid(), NULL, 'superadmin@system.com', '$2b$10$C93knitd0FoIxQZSRNR6A.o9mHQp8ESE2F1I5zqBD5pTnzYWmXbmi', 'System Admin', 'super_admin', true);

-- 4. Tenant Admin for Demo Company
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES ('a1e4c6b0-7164-4f23-9c71-3a059c3d4e0b', 'd0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'admin@demo.com', '$2b$10$8psE.wjabp/5cQJ.QmiYEOKvS1BdO4xPc.FJXiAHdETjF0Emp.Jzm', 'Demo Admin', 'tenant_admin', true);

-- 5. Two Regular Users for Demo Company
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES 
(gen_random_uuid(), 'd0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'user1@demo.com', '$2b$10$N/XusZEXew.5t5vuLorMNeht7g5MRL2G08jO5EirSXDAOdCPgx90O', 'User One', 'user', true),
(gen_random_uuid(), 'd0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'user2@demo.com', '$2b$10$N/XusZEXew.5t5vuLorMNeht7g5MRL2G08jO5EirSXDAOdCPgx90O', 'User Two', 'user', true);

-- 6. Two Sample Projects
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES 
('b2e4c6b0-7164-4f23-9c71-3a059c3d4e0c', 'd0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'Project Alpha', 'Main demo project', 'active', 'a1e4c6b0-7164-4f23-9c71-3a059c3d4e0b'),
('c3e4c6b0-7164-4f23-9c71-3a059c3d4e0d', 'd0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'Project Beta', 'Secondary research project', 'active', 'a1e4c6b0-7164-4f23-9c71-3a059c3d4e0b');

-- 7. Five Sample Tasks
INSERT INTO tasks (tenant_id, project_id, title, status, priority)
VALUES 
('d0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'b2e4c6b0-7164-4f23-9c71-3a059c3d4e0c', 'Initial Research', 'completed', 'high'),
('d0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'b2e4c6b0-7164-4f23-9c71-3a059c3d4e0c', 'Define Requirements', 'in_progress', 'medium'),
('d0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'b2e4c6b0-7164-4f23-9c71-3a059c3d4e0c', 'Design UI Mockups', 'todo', 'low'),
('d0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'c3e4c6b0-7164-4f23-9c71-3a059c3d4e0d', 'Setup Environment', 'completed', 'high'),
('d0e4c6b0-7164-4f23-9c71-3a059c3d4e0a', 'c3e4c6b0-7164-4f23-9c71-3a059c3d4e0d', 'Beta API Testing', 'todo', 'medium');