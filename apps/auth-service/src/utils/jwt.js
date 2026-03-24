import jwt from "jsonwebtoken";

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};

export { generateToken, verifyToken };