import { AuthSession } from '../models/auth-session.model.js';
import { REFRESH_EXPIRES_IN, buildRefreshToken, toMs } from '../utils/auth-token.utils.js';

const createSession = async (req, user) => {
    const refreshToken = buildRefreshToken(user);
    const session = await AuthSession.create({
        userId: user._id,
        refreshToken,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
        expiresAt: new Date(Date.now() + toMs(REFRESH_EXPIRES_IN))
    });

    return { session, refreshToken };
};

const deleteSession = async ({ userId, refreshToken }) => {
    return AuthSession.findOneAndDelete({ userId, refreshToken });
};

const deleteAllUserSessions = async (userId) => {
    return AuthSession.deleteMany({ userId });
};

const findValidSessionByRefreshToken = async ({ userId, refreshToken }) => {
    return AuthSession.findOne({
        userId,
        refreshToken,
        expiresAt: { $gt: new Date() }
    });
};

const listUserSessions = async (userId) => {
    return AuthSession.find({ userId }).sort({ createdAt: -1 });
};

const deleteSessionById = async ({ userId, sessionId }) => {
    return AuthSession.findOneAndDelete({ _id: sessionId, userId });
};

export {
    createSession,
    deleteSession,
    deleteAllUserSessions,
    findValidSessionByRefreshToken,
    listUserSessions,
    deleteSessionById
};