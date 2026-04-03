import bcrypt from 'bcryptjs';
import { AuthUser } from '../models/auth-user.model.js';
import {
    buildAccessToken,
    getUserIdFromAccessToken,
    getUserIdFromRefreshToken,
    verifyRefreshToken
} from '../utils/auth-token.utils.js';
import { extractAccessToken, extractRefreshToken } from '../utils/request-token.utils.js';
import { ALLOWED_ROLES, EMAIL_VERIFICATION_EXPIRES_MS, PASSWORD_RESET_EXPIRES_MS } from '../constants/auth.constants.js';
import { normalizeRoles } from '../services/auth-user.service.js';
import {
    createSession,
    deleteAllUserSessions,
    deleteSession,
    findValidSessionByRefreshToken
} from '../services/auth-session.service.js';
import {
    createAuthToken,
    deleteAuthTokenById,
    deleteAuthTokens,
    findValidAuthToken
} from '../services/auth-token.service.js';
import { publishEmailVerficationEmailEvent, publishPasswordResetEmailEvent, publishUserDeletedEvent } from '../messaging/producer.js';


const registerController = async (req, res) => {
    try {
        const { email, password, role, roles } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await AuthUser.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const roleResult = normalizeRoles({ role, roles, allowedRoles: ALLOWED_ROLES });
        if (!roleResult.isValid) {
            return res.status(400).json({ message: roleResult.message });
        }

        const user = await AuthUser.create({
            email: normalizedEmail,
            passwordHash,
            provider: 'local',
            roles: roleResult.roles
        });

        // Publish event to send verification email
        await publishEmailVerficationEmailEvent(user.email);

        const accessToken = buildAccessToken(user);
        const { refreshToken } = await createSession(req, user);
        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified,
                isActive: user.isActive,
                roles: user.roles
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await AuthUser.findOne({ email: normalizedEmail });

        if (!user || user.provider !== 'local' || !user.passwordHash) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'User account is disabled' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = buildAccessToken(user);
        const { refreshToken } = await createSession(req, user);

        return res.status(200).json({
            message: 'User logged in successfully',
            user: {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified,
                isActive: user.isActive,
                roles: user.roles
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

const oauthController = async (req, res) => {
    try {
        const { provider, providerId, email } = req.body;

        if (!provider || !providerId) {
            return res.status(400).json({ message: 'provider and providerId are required' });
        }

        const normalizedProvider = String(provider).toLowerCase().trim();
        if (!['google', 'github'].includes(normalizedProvider)) {
            return res.status(400).json({ message: 'provider must be google or github' });
        }

        let user = await AuthUser.findOne({ provider: normalizedProvider, providerId: String(providerId) });

        if (!user && email) {
            const normalizedEmail = String(email).toLowerCase().trim();
            user = await AuthUser.findOne({ email: normalizedEmail });

            if (user) {
                user.provider = normalizedProvider;
                user.providerId = String(providerId);
                user.isVerified = true;
                await user.save();
            }
        }

        if (!user) {
            if (!email) {
                return res.status(400).json({ message: 'email is required for first-time OAuth sign-in' });
            }

            user = await AuthUser.create({
                email: String(email).toLowerCase().trim(),
                provider: normalizedProvider,
                providerId: String(providerId),
                passwordHash: null,
                isVerified: true,
                roles: ['student']
            });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'User account is disabled' });
        }

        const accessToken = buildAccessToken(user);
        const { refreshToken } = await createSession(req, user);

        return res.status(200).json({
            message: 'OAuth login successful',
            user: {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified,
                isActive: user.isActive,
                roles: user.roles,
                provider: user.provider
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'OAuth login failed', error: error.message });
    }
};

const meController = async (req, res) => {
    try {
        const accessToken = extractAccessToken(req);
        const userId = getUserIdFromAccessToken(accessToken);

        if (!userId) {
            return res.status(401).json({ message: 'Valid access token is required' });
        }

        const user = await AuthUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified,
                isActive: user.isActive,
                roles: user.roles,
                provider: user.provider,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
    }
};

const refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'refreshToken is required' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const session = await findValidSessionByRefreshToken({ userId: decoded.sub, refreshToken });

        if (!session) {
            return res.status(401).json({ message: 'Session expired or invalid' });
        }

        const user = await AuthUser.findById(decoded.sub);
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        const accessToken = buildAccessToken(user);
        return res.status(200).json({ accessToken });
    } catch (error) {
        return res.status(500).json({ message: 'Token refresh failed', error: error.message });
    }
};

const logoutController = async (req, res) => {
    try {
        const refreshToken = extractRefreshToken(req);

        if (!refreshToken) {
            return res.status(400).json({
                message: 'refreshToken is required in body, x-refresh-token header, or cookie'
            });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        if (decoded.tokenType !== 'refresh') {
            return res.status(401).json({ message: 'Invalid token type for logout' });
        }

        const deleted = await deleteSession({ userId: decoded.sub, refreshToken });

        if (!deleted) {
            return res.status(200).json({ message: 'Session already logged out' });
        }

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Logout failed', error: error.message });
    }
};

const logoutAllController = async (req, res) => {
    try {
        const refreshToken = extractRefreshToken(req);
        const accessToken = extractAccessToken(req);
        const userIdFromAccessToken = getUserIdFromAccessToken(accessToken);
        const userIdFromRefreshToken = getUserIdFromRefreshToken(refreshToken);
        const userId = userIdFromAccessToken || userIdFromRefreshToken;

        if (!userId) {
            return res.status(400).json({
                message: 'Valid access token or refreshToken is required for logout-all'
            });
        }

        const result = await deleteAllUserSessions(userId);
        return res.status(200).json({
            message: 'Logged out from all devices successfully',
            revokedSessions: result.deletedCount
        });
    } catch (error) {
        return res.status(500).json({ message: 'Logout-all failed', error: error.message });
    }
};

const requestEmailVerificationController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await AuthUser.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(200).json({
                message: 'If the account exists, an email verification token has been generated'
            });
        }

        if (user.isVerified) {
            return res.status(200).json({ message: 'Email is already verified' });
        }

        await deleteAuthTokens({ userId: user._id, type: 'email_verification' });

        const token = await createAuthToken({
            userId: user._id,
            type: 'email_verification',
            expiresInMs: EMAIL_VERIFICATION_EXPIRES_MS
        });

        return res.status(200).json({
            message: 'Email verification token generated successfully',
            verificationToken: token
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to generate email verification token', error: error.message });
    }
};

const verifyEmailController = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'token is required' });
        }

        const tokenDoc = await findValidAuthToken({ token, type: 'email_verification' });

        if (!tokenDoc) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        const user = await AuthUser.findById(tokenDoc.userId);
        if (!user) {
            await deleteAuthTokenById(tokenDoc._id);
            return res.status(404).json({ message: 'User not found' });
        }

        user.isVerified = true;
        await user.save();
        await deleteAuthTokens({ userId: user._id, type: 'email_verification' });

        return res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Email verification failed', error: error.message });
    }
};

const requestPasswordResetController = async (req, res) => {
    try {
        await publishPasswordResetEmailEvent(req.body.email);
        return res.status(200).json({
            message: 'Password reset token generated successfully'
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to generate password reset token', error: error.message });
    }
};

const resetPasswordController = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'token and newPassword are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'newPassword must be at least 6 characters' });
        }

        const tokenDoc = await findValidAuthToken({ token, type: 'password_reset' });

        if (!tokenDoc) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

        const user = await AuthUser.findById(tokenDoc.userId);
        if (!user) {
            await deleteAuthTokenById(tokenDoc._id);
            return res.status(404).json({ message: 'User not found' });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        await deleteAuthTokens({ userId: user._id, type: 'password_reset' });
        await deleteAllUserSessions(user._id);

        return res.status(200).json({ message: 'Password reset successfully. Please login again.' });
    } catch (error) {
        return res.status(500).json({ message: 'Password reset failed', error: error.message });
    }
};

const deleteUserController = async (req, res) => {
    try {
        const accessToken = extractAccessToken(req);
        const userId = getUserIdFromAccessToken(accessToken);

        if (!userId) {
            return res.status(401).json({ message: 'Valid access token is required' });
        }

        const user = await AuthUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await Promise.all([
            deleteAllUserSessions(user._id),
            deleteAuthTokens({ userId: user._id, type: 'email_verification' }),
            deleteAuthTokens({ userId: user._id, type: 'password_reset' }),
            AuthUser.deleteOne({ _id: user._id })
        ]);

        await publishUserDeletedEvent({ userId: String(user._id), email: user.email });

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
};

export {
    registerController,
    loginController,
    oauthController,
    meController,
    refreshTokenController,
    logoutController,
    logoutAllController,
    requestEmailVerificationController,
    verifyEmailController,
    requestPasswordResetController,
    resetPasswordController,
    deleteUserController
};