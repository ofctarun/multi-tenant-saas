const db = require('../config/db');

/**
 * 1. Create a New Task (API 16)
 */
exports.createTask = async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const { tenantId, userId, role } = req.user; 

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        let projectCheckQuery = 'SELECT id FROM projects WHERE id = $1';
        let projectCheckParams = [projectId];

        if (role !== 'super_admin') {
            projectCheckQuery += ' AND tenant_id = $2';
            projectCheckParams.push(tenantId);
        }

        const projectRes = await client.query(projectCheckQuery, projectCheckParams);

        if (projectRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Access denied to this project' });
        }

        const result = await client.query(
            `INSERT INTO tasks (project_id, tenant_id, title, description, assigned_to, priority, due_date, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [projectId, tenantId, title, description, assignedTo, priority || 'medium', dueDate, 'todo', userId]
        );

        const newTask = result.rows[0];

        await client.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, details) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenantId, userId, 'CREATE_TASK', 'tasks', newTask.id, JSON.stringify({ title: newTask.title })]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Task created successfully', data: newTask });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

/**
 * 2. List Project Tasks (API 17)
 */
exports.getProjectTasks = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, role } = req.user;

    try {
        let query;
        let params;

        if (role === 'super_admin') {
            query = `
                SELECT t.*, u.full_name as assignee_name
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.project_id = $1
                ORDER BY t.created_at DESC`;
            params = [projectId];
        } else {
            query = `
                SELECT t.*, u.full_name as assignee_name
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.project_id = $1 AND t.tenant_id = $2 
                ORDER BY t.created_at DESC`;
            params = [projectId, tenantId];
        }

        const result = await db.query(query, params);
        res.json({ success: true, data: { tasks: result.rows } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 3. Quick Kanban status update (Used for drag-and-drop or simple status toggles)
 */
exports.updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId, role } = req.user;

    try {
        let query = 'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2';
        let params = [status, taskId];

        if (role !== 'super_admin') {
            query += ' AND tenant_id = $3';
            params.push(tenantId);
        }

        const result = await db.query(query + ' RETURNING *', params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found or access denied' });
        }

        res.json({ success: true, message: 'Status updated', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 4. Full Task Update (API 18)
 * UPDATED: Explicitly handles title and description updates for Tenant Admins.
 */
exports.updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { status, title, description, assigned_to, priority, due_date } = req.body;
    const { tenantId, role, userId } = req.user;

    try {
        let query = `UPDATE tasks 
                     SET status = COALESCE($1, status), 
                         title = COALESCE($2, title),
                         description = COALESCE($3, description),
                         assigned_to = COALESCE($4, assigned_to),
                         priority = COALESCE($5, priority),
                         due_date = COALESCE($6, due_date),
                         updated_at = NOW() 
                     WHERE id = $7`;
        let params = [status, title, description, assigned_to, priority, due_date, taskId];

        // Ensure user can only update tasks within their own tenant
        if (role !== 'super_admin') {
            query += ' AND tenant_id = $8';
            params.push(tenantId);
        }

        const result = await db.query(query + ' RETURNING *', params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
        }

        // Audit the update action
        await db.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, userId, 'UPDATE_TASK', 'tasks', taskId]
        );

        res.json({ success: true, message: 'Task updated successfully', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 5. Delete Task
 * Logic: Super Admin global delete; Tenant Admin restricted to organization.
 */
exports.deleteTask = async (req, res) => {
    const { taskId } = req.params;
    const { tenantId, role, userId } = req.user;

    try {
        let query = 'DELETE FROM tasks WHERE id = $1';
        let params = [taskId];

        if (role !== 'super_admin') {
            query += ' AND tenant_id = $2';
            params.push(tenantId);
        }

        const result = await db.query(query + ' RETURNING id', params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
        }

        // Audit the deletion
        await db.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, userId, 'DELETE_TASK', 'tasks', taskId]
        );

        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};