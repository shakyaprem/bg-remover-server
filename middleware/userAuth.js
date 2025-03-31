import jwt from 'jsonwebtoken';

export const userAuth = async (req, res, next) => {
    const secretKey = process.env.SECRET_KEY;
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ success: false, message: 'unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        if (decoded.id) {
            req.body.userId = decoded.id;
        } else {
            return res.status(401).json({ success: false, message: 'unauthorized' });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}