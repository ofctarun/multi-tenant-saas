const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * 1. GET DASHBOARD STATS (API 5)
 * Dynamically switches between Super Admin (global) and Tenant (isolated) views.
 */
exports.getDashboardStats = async (req, res) => {
    const { tenantId, role } = req.user;

    try {
        let statsQuery;
        let queryParams = [];

        if (role === 'super_admin') {
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM projects) as total_projects,
                    (SELECT COUNT(*) FROM tasks WHERE status != 'completed') as active_tasks,
                    (SELECT COUNT(*) FROM users) as total_users,
                    'System Wide' as plan_name,
                    'Unlimited' as max_users,
                    'Unlimited' as max_projects
            `;
        } else {
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) as total_projects,
                    (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1 AND status != 'completed') as active_tasks,
                    (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
                    t.max_users,
                    t.max_projects,
                    t.subscription_plan as plan_name
                FROM tenants t
                WHERE t.id = $1
            `;
            queryParams = [tenantId];
        }

        const statsResult = await db.query(statsQuery, queryParams);

        // Fetch Recent Activity (Mandatory Audit Logs)
        let activityQuery = 'SELECT action, details, created_at FROM audit_logs';
        let activityParams = [];
        
        if (role !== 'super_admin') {
            activityQuery += ' WHERE tenant_id = $1';
            activityParams = [tenantId];
        }
        
        activityQuery += ' ORDER BY created_at DESC LIMIT 5';
        const activityResult = await db.query(activityQuery, activityParams);

        res.json({ 
            success: true, 
            data: { 
                stats: statsResult.rows[0],
                activity: activityResult.rows 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 2. List all tenants (API 7 - Super Admin only)
 */
exports.getTenants = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const result = await db.query(`
            SELECT t.*, 
            (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as total_users,
            (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as total_projects
            FROM tenants t ORDER BY t.created_at DESC
        `);
        
        res.json({ success: true, data: { tenants: result.rows } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 3. Update Tenant Status (API 6 - Super Admin only)
 */
exports.updateTenantStatus = async (req, res) => {
    const { tenantId } = req.params;
    const { status, subscription_plan } = req.body;
    try {
        const result = await db.query(
            'UPDATE tenants SET status = $1, subscription_plan = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [status, subscription_plan, tenantId]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 4. Get tenant details (API 5)
 */
exports.getTenantDetails = async (req, res) => {
    const { tenantId, role } = req.user;
    try {
        const result = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 5. Add User (API 8)
 * MANDATORY: Enforces max_users limit from subscription plan.
 */
exports.addUser = async (req, res) => {
    const { email, password, fullName, role } = req.body;
    const tenantId = req.user.tenantId;
    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');

        // Check Subscription Plan Limits
        const tenantRes = await client.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
        const userCountRes = await client.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);

        if (parseInt(userCountRes.rows[0].count) >= tenantRes.rows[0].max_users) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'User limit reached for your plan.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await client.query(
            'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
            [tenantId, email, hashedPassword, fullName, role || 'user']
        );

        // Audit Logging
        await client.query(
            'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
            [tenantId, req.user.userId, 'USER_CREATED', 'users', result.rows[0].id]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

/**
 * 6. Update User Profile (API 10)
 */
exports.updateUser = async (req, res) => {
    const { userId } = req.params;
    const { fullName, role, is_active } = req.body;
    try {
        const result = await db.query(
            'UPDATE users SET full_name = $1, role = $2, is_active = $3 WHERE id = $4 AND tenant_id = $5 RETURNING id, email, full_name, role',
            [fullName, role, is_active, userId, req.user.tenantId]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 7. Delete User (API 11)
 * UPDATED: Allows Super Admin to delete any user; Tenant Admins restricted to their tenant.
 */
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    const { tenantId, role, userId: currentUserId } = req.user;

    // Security: Prevent self-deletion
    if (userId == currentUserId) {
        return res.status(400).json({ success: false, message: 'Cannot delete self' });
    }

    try {
        let query;
        let params;

        // Conditional Logic: Super Admin has global authority
        if (role === 'super_admin') {
            query = 'DELETE FROM users WHERE id = $1 RETURNING id';
            params = [userId];
        } else {
            // Regular Admin: Isolated to their own organization
            query = 'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id';
            params = [userId, tenantId];
        }

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found or access denied' });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 8. List Users (API 9)
 */
exports.listUsers = async (req, res) => {
    const { tenantId, role } = req.user;
    try {
        let query = role === 'super_admin' 
            ? 'SELECT u.*, t.name as tenant_name FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id' 
            : 'SELECT id, email, full_name, role, is_active FROM users WHERE tenant_id = $1';
        
        const result = await db.query(query, role === 'super_admin' ? [] : [tenantId]);
        res.json({ success: true, data: { users: result.rows } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};