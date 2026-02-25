const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Generate JWT token
// @param {Object} payload - Data to encode
// @param {string} expiresIn - Token expiry

const generateToken = (payload, expiresIn = '24h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

//Middleware: Verify JWT token (owner & employee)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Invalid token.',
            code: 'TOKEN_INVALID'
        });
    }
};


// Middleware: allow Owner

const requireOwner = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Owner only.'
            });
        }
        next();
    });
};

// Middleware: allow Employee
const requireEmployee = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Employee only.'
            });
        }
        next();
    });
};

module.exports = { generateToken, verifyToken, requireOwner, requireEmployee };