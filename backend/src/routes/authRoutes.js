const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

// Public Routes
router.post('/register-tenant', authController.registerTenant);
router.post('/login', authController.login);

// System Health Check (MANDATORY)
router.get('/health', async (req, res) => {
    try {
        // Query to check DB connectivity
        await db.query('SELECT 1'); 
        res.json({ status: "ok", database: "connected" });
    } catch (error) {
        res.status(500).json({ status: "error", database: "disconnected" });
    }
});

// Protected Audit Logs for Dashboard
router.get('/audit-logs', authenticate, async (req, res) => {
    try {
        let query;
        let params = [];

        // Super Admin sees everything; Tenant Admin/User is isolated
        if (req.user.role === 'super_admin') {
            query = 'SELECT action, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5';
        } else {
            query = 'SELECT action, details, created_at FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5';
            params = [req.user.tenantId];
        }

        const result = await db.query(query, params);
        res.json({ success: true, data: { logs: result.rows } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Current User Info
router.get('/me', authenticate, (req, res) => {
    res.json({ success: true, data: req.user });
});

// Logout Endpoint (MANDATORY)
router.post('/logout', authenticate, (req, res) => {
    // Audit log the logout action here
    res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;