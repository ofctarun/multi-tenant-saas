const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Add these console logs at the top of your login or register function just once to see the hashes


exports.registerTenant = async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Create Tenant
        const tenantRes = await client.query(
            'INSERT INTO tenants (name, subdomain, subscription_plan, status) VALUES ($1, $2, $3, $4) RETURNING id',
            [tenantName, subdomain, 'pro', 'active']
        );
        const tenantId = tenantRes.rows[0].id;
        
        // 2. Create Admin User
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const userRes = await client.query(
            'INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [tenantId, adminEmail, hashedPassword, adminFullName, 'tenant_admin', true]
        );
        const adminId = userRes.rows[0].id;

        // 3. LOG AUDIT EVENT: Tenant Registration
        await client.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, details) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenantId, adminId, 'TENANT_REGISTERED', 'tenants', tenantId, JSON.stringify({ name: tenantName, subdomain })]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: "Registered successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(409).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

exports.login = async (req, res) => {
    const { email, password, tenantSubdomain } = req.body;

    try {
        const result = await db.query(
            `SELECT u.*, t.subdomain as actual_subdomain, t.status as tenant_status 
             FROM users u 
             LEFT JOIN tenants t ON u.tenant_id = t.id 
             WHERE u.email = $1`,
            [email]
        );

        const user = result.rows[0];
        if (!user) return res.status(401).json({ success: false, message: 'User not found' });
        
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect password' });

        if (user.role !== 'super_admin') {
            if (user.actual_subdomain !== tenantSubdomain) {
                return res.status(401).json({ success: false, message: 'Invalid subdomain' });
            }
            if (user.tenant_status !== 'active') {
                return res.status(403).json({ success: false, message: 'Tenant inactive' });
            }
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // LOG AUDIT EVENT: User Login (for non-super admins)
        if (user.tenant_id) {
            await db.query(
                'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
                [user.tenant_id, user.id, 'USER_LOGIN', 'users', user.id]
            );
        }

        res.json({
            success: true,
            data: {
                user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id, full_name: user.full_name },
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};