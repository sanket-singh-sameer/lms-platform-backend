const extractBearerToken = (authorizationHeader) => {
    if (!authorizationHeader || typeof authorizationHeader !== 'string') {
        return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return null;
    }

    return token.trim();
};

const extractRefreshToken = (req) => {
    if (req.body?.refreshToken) {
        return String(req.body.refreshToken).trim();
    }

    if (req.headers['x-refresh-token']) {
        return String(req.headers['x-refresh-token']).trim();
    }

    if (req.cookies?.refreshToken) {
        return String(req.cookies.refreshToken).trim();
    }

    return null;
};

const extractAccessToken = (req) => {
    return extractBearerToken(req.headers.authorization);
};

export { extractBearerToken, extractRefreshToken, extractAccessToken };