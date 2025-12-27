const db = require('../config/db');

/**
 * 1. Fetch a single project by ID (API 13 equivalent)
 * SECURITY: Enforces isolation for regular users, global access for Super Admin.
 */
exports.getProjectById = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, role } = req.user;

    try {
        let query;
        let params;

        if (role === 'super_admin') {
            query = 'SELECT * FROM projects WHERE id = $1';
            params = [projectId];
        } else {
            query = 'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2';
            params = [projectId, tenantId];
        }

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.json({ 
            success: true, 
            message: 'Project retrieved successfully', 
            data: result.rows[0] 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 2. Create a new project (API 12)
 * MANDATORY: Includes Plan Limits, Audit Logging, and Transaction Safety.
 */
exports.createProject = async (req, res) => {
    const { name, description, status } = req.body;
    const { tenantId, userId, role } = req.user;

    if (role === 'super_admin') {
        return res.status(400).json({ 
            success: false, 
            message: 'Super Admins cannot create projects directly. Please login as a Tenant Admin.' 
        });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Step A: Check Subscription Plan Limits
        const tenantRes = await client.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
        const countRes = await client.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);

        if (parseInt(countRes.rows[0].count) >= tenantRes.rows[0].max_projects) {
            await client.query('ROLLBACK');
            return res.status(403).json({ 
                success: false, 
                message: 'Project limit reached for your plan.' 
            });
        }

        // Step B: Insert Project
        const result = await client.query(
            'INSERT INTO projects (tenant_id, name, description, status, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tenantId, name, description, status || 'active', userId]
        );

        const newProject = result.rows[0];

        // Step C: LOG AUDIT EVENT
        await client.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, details) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenantId, userId, 'CREATE_PROJECT', 'projects', newProject.id, JSON.stringify({ name: newProject.name })]
        );

        await client.query('COMMIT');
        res.status(201).json({ 
            success: true, 
            message: 'Project created successfully', 
            data: newProject 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

/**
 * 3. List all projects (API 13)
 * Logic: Super Admin sees global projects, Tenant Admin/User sees restricted projects.
 */
exports.listProjects = async (req, res) => {
    const { tenantId, role } = req.user;

    try {
        let query;
        let params = [];

        if (role === 'super_admin') {
            query = `
                SELECT p.*, u.full_name as creator_name, t.name as tenant_name,
                (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
                FROM projects p
                LEFT JOIN users u ON p.created_by = u.id
                LEFT JOIN tenants t ON p.tenant_id = t.id
                ORDER BY p.created_at DESC`;
        } else {
            query = `
                SELECT p.*, u.full_name as creator_name,
                (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
                (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_task_count
                FROM projects p
                LEFT JOIN users u ON p.created_by = u.id
                WHERE p.tenant_id = $1
                ORDER BY p.created_at DESC`;
            params = [tenantId];
        }

        const result = await db.query(query, params);

        res.json({ 
            success: true, 
            message: 'Projects retrieved successfully',
            data: { projects: result.rows, total: result.rows.length } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 4. Update Project (API 14)
 * Logic: Grants global authority to Super Admin; restricts Tenant Admin to their organization.
 */
exports.updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { tenantId, role } = req.user;

    try {
        let query = `UPDATE projects 
                     SET name = COALESCE($1, name), 
                         description = COALESCE($2, description), 
                         status = COALESCE($3, status), 
                         updated_at = NOW() 
                     WHERE id = $4`;
        let params = [name, description, status, projectId];

        // Conditional Isolation
        if (role !== 'super_admin') {
            query += ' AND tenant_id = $5';
            params.push(tenantId);
        }

        const result = await db.query(query + ' RETURNING *', params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found or unauthorized' });
        }

        res.json({ success: true, message: 'Project updated successfully', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 5. Delete Project (API 15)
 * Logic: Super Admin can delete any project; others strictly limited to own organization.
 */
exports.deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, role } = req.user;

    try {
        let query = 'DELETE FROM projects WHERE id = $1';
        let params = [projectId];

        if (role !== 'super_admin') {
            query += ' AND tenant_id = $2';
            params.push(tenantId);
        }

        const result = await db.query(query + ' RETURNING id', params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found or unauthorized' });
        }

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};