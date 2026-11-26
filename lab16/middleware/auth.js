const jwt = require('jsonwebtoken');

const JWT_SECRET = 'lab16_secret_key_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Требуется авторизация',
            status: 401
        });
    }

    const token = authHeader.substring(7);

    try {
        const user = jwt.verify(token, JWT_SECRET);

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Недействительный или просроченный JWT токен',
            status: 401
        });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Доступ разрешен только администраторам',
            status: 403
        });
    }

    next();
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    requireAdmin
};