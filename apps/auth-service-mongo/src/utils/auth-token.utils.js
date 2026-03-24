import jwt from 'jsonwebtoken';

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const toMs = (value) => {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) {
        return 7 * 24 * 60 * 60 * 1000;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const unitMs = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    return amount * unitMs[unit];
};

const buildAccessToken = (user) => {
    return jwt.sign(
        {
            sub: user._id,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
};

const buildRefreshToken = (user) => {
    return jwt.sign(
        {
            sub: user._id,
            tokenType: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
};

const verifyRefreshToken = (refreshToken) => {
    try {
        return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (_error) {
        return null;
    }
};

const verifyAccessToken = (accessToken) => {
    try {
        return jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (_error) {
        return null;
    }
};

const getUserIdFromRefreshToken = (refreshToken) => {
    if (!refreshToken) {
        return null;
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.tokenType !== 'refresh') {
        return null;
    }

    return decoded.sub || null;
};

const getUserIdFromAccessToken = (accessToken) => {
    if (!accessToken) {
        return null;
    }

    const decoded = verifyAccessToken(accessToken);
    return decoded?.sub || null;
};

export {
    ACCESS_EXPIRES_IN,
    REFRESH_EXPIRES_IN,
    toMs,
    buildAccessToken,
    buildRefreshToken,
    verifyRefreshToken,
    verifyAccessToken,
    getUserIdFromRefreshToken,
    getUserIdFromAccessToken
};