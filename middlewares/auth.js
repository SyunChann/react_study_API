const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: '토큰 없음' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // 토큰에 role 등을 넣었다면 같이 복원
        req.user = { id: payload.userId, role: payload.role };
        return next();
    } catch (e) {
        return res.status(401).json({ success: false, message: '토큰 검증 실패' });
    }
}