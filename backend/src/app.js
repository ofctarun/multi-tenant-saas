const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const projectRoutes = require('./routes/projectRoutes');
const db = require('./config/db');

const app = express();

/**
 * 1. DYNAMIC CORS CONFIGURATION
 * Allows requests from both the Docker internal network and your local browser.
 */
const allowedOrigins = [
    'http://localhost:3000',      // Local browser access
    'http://127.0.0.1:3000',     // Alternative local access
    'http://frontend:3000'        // Docker internal service name
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('CORS blocked: Origin not allowed by SaaS Security Policy'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

/**
 * 2. MANDATORY HEALTH CHECK
 * Verifies that the container is alive AND the database is reachable.
 */
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1'); // Actual connectivity test
        res.json({ status: "ok", database: "connected", timestamp: new Date() });
    } catch (err) {
        res.status(500).json({ status: "error", database: "disconnected", message: err.message });
    }
});

// Route Modules
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/projects', projectRoutes);

/**
 * 3. GLOBAL ERROR HANDLER
 * Ensures all server errors return a consistent JSON format for the Frontend.
 */
app.use((err, req, res, next) => {
    console.error(`[Server Error]: ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SaaS Backend running on port ${PORT}`);
    console.log(`✅ Allowed Origins: ${allowedOrigins.join(', ')}`);
});