const db = require('../config/db');

const bcrypt = require('bcryptjs');



/**

 * API 8: Add User to Tenant

 * Requirements: Plan limits, Audit Logging, and Transaction Safety

 */

exports.addUser = async (req, res) => {

    const { tenantId, userId, role: adminRole } = req.user;

    const adminId = userId;



    // Handle naming styles from frontend and required fields

    const fullName = req.body.fullName || req.body.full_name;

    const { email, password, role } = req.body;



    if (!fullName || !email || !password) {

        return res.status(400).json({

            success: false,

            message: 'Full Name, Email, and Password are required.'

        });

    }



    // Super Admin should not create users without a tenant context in this flow

    if (adminRole === 'super_admin' && !req.body.tenantId) {

        return res.status(400).json({ success: false, message: 'Super Admin must specify a tenantId to add a user.' });

    }



    const targetTenantId = adminRole === 'super_admin' ? req.body.tenantId : tenantId;

    const client = await db.pool.connect();



    try {

        await client.query('BEGIN');



        // 1. Get Tenant Plan Limits

        const tenantRes = await client.query(

            'SELECT max_users FROM tenants WHERE id = $1',

            [targetTenantId]

        );

        if (tenantRes.rows.length === 0) {

            await client.query('ROLLBACK');

            return res.status(404).json({ success: false, message: 'Tenant not found' });

        }

       

        const maxUsers = tenantRes.rows[0].max_users;



        // 2. Count Current Users and Enforce Limits

        const countRes = await client.query(

            'SELECT COUNT(*) FROM users WHERE tenant_id = $1',

            [targetTenantId]

        );

        if (parseInt(countRes.rows[0].count) >= maxUsers) {

            await client.query('ROLLBACK');

            return res.status(403).json({

                success: false,

                message: 'Subscription limit reached for this tenant.'

            });

        }



        // 3. Create User with Hashed Password

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await client.query(

            `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)

             VALUES ($1, $2, $3, $4, $5, $6)

             RETURNING id, email, full_name, role`,

            [targetTenantId, email, hashedPassword, fullName, role || 'user', true]

        );



        // 4. Mandatory Audit Logging

        await client.query(

            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, details)

             VALUES ($1, $2, $3, $4, $5, $6)`,

            [targetTenantId, adminId, 'CREATE_USER', 'users', newUser.rows[0].id, JSON.stringify({ email: email })]

        );



        await client.query('COMMIT');

        res.status(201).json({ success: true, message: 'User created successfully', data: newUser.rows[0] });



    } catch (error) {

        await client.query('ROLLBACK');

        if (error.code === '23505') {

            return res.status(409).json({ success: false, message: 'Email already exists in this tenant.' });

        }

        res.status(500).json({ success: false, message: "Internal server error" });

    } finally {

        client.release();

    }

};



/**

 * API 9: List Tenant Users

 * Logic: Super Admin sees global users, Tenant Admin sees organization users.

 */

exports.listUsers = async (req, res) => {

    const { tenantId, role } = req.user;



    try {

        let query;

        let params = [];



        if (role === 'super_admin') {

            // Super Admin: List ALL users across the platform

            query = `

                SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at, t.name as tenant_name

                FROM users u

                LEFT JOIN tenants t ON u.tenant_id = t.id

                ORDER BY u.created_at DESC`;

        } else {

            // Tenant Admin/User: Restricted to their organization

            query = `

                SELECT id, email, full_name, role, is_active, created_at

                FROM users

                WHERE tenant_id = $1

                ORDER BY created_at DESC`;

            params = [tenantId];

        }



        const result = await db.query(query, params);



        res.json({

            success: true,

            message: 'Users retrieved successfully',

            data: { users: result.rows }

        });

    } catch (error) {

        res.status(500).json({ success: false, message: error.message });

    }

};