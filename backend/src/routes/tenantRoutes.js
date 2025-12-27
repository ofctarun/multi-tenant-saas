const express = require('express');
const router = express.Router();
const tenantCtrl = require('../controllers/tenantController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * --- Global Management (Super Admin ONLY) ---
 * MANDATORY: Platform-wide administration.
 */

// API 7: List all tenants globally
router.get('/', authenticate, authorize('super_admin'), tenantCtrl.getTenants);

// API 6: Update tenant status/plan (Super Admin only)
router.put('/:tenantId', authenticate, authorize('super_admin'), tenantCtrl.updateTenantStatus);


/**
 * --- Organization Management (Tenant Admin/User) ---
 * MANDATORY: Isolated by tenant_id.
 */

// API 5: DASHBOARD STATS: Fills cards on the Dashboard
router.get('/dashboard/stats', authenticate, tenantCtrl.getDashboardStats);

// API 5 (Extended): Get current organization details
router.get('/me', authenticate, tenantCtrl.getTenantDetails);


/**
 * --- User Management Module ---
 * MANDATORY: Enforces RBAC and plan limits.
 */

// API 8: Add User (Enforces max_users limit)
router.post('/users', authenticate, authorize(['tenant_admin', 'super_admin']), tenantCtrl.addUser);

// API 9: List users in the organization (Isolated by tenant_id)
router.get('/users', authenticate, tenantCtrl.listUsers);

// API 10: Update User Profile
router.put('/users/:userId', authenticate, tenantCtrl.updateUser);

// API 11: Delete User (Cannot delete self)
router.delete('/users/:userId', authenticate, authorize(['tenant_admin', 'super_admin']), tenantCtrl.deleteUser);

module.exports = router;