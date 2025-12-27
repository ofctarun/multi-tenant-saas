const jwt = require('jsonwebtoken');



const authenticate = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {

        return res.status(401).json({ success: false, message: 'No token provided' });

    }



    const token = authHeader.split(' ')[1];



    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // This attaches the user info (id, role, tenantId) to every request

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({ success: false, message: 'Invalid or expired token' });

    }

};



const authorize = (roles = []) => {

    return (req, res, next) => {

        if (typeof roles === 'string') roles = [roles];

       

        // Super Admin bypasses all checks

        if (req.user.role === 'super_admin') return next();



        if (roles.length && !roles.includes(req.user.role)) {

            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });

        }

        next();

    };

};



module.exports = { authenticate, authorize };