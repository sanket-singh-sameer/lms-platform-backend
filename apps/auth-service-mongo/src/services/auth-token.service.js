import crypto from 'crypto';
import { AuthToken } from '../models/auth-verification-token.model.js';

const generateOneTimeToken = () => crypto.randomBytes(32).toString('hex');

const createAuthToken = async ({ userId, type, expiresInMs }) => {
    const token = generateOneTimeToken();

    await AuthToken.create({
        userId,
        token,
        type,
        expiresAt: new Date(Date.now() + expiresInMs)
    });

    return token;
};

const findValidAuthToken = async ({ token, type }) => {
    return AuthToken.findOne({
        token,
        type,
        expiresAt: { $gt: new Date() }
    });
};

const deleteAuthTokens = async ({ userId, type }) => {
    return AuthToken.deleteMany({ userId, type });
};

const deleteAuthTokenById = async (id) => {
    return AuthToken.deleteOne({ _id: id });
};

export { createAuthToken, findValidAuthToken, deleteAuthTokens, deleteAuthTokenById };