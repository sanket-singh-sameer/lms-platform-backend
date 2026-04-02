import { AuthUser } from '../../models/auth-user.model.js';
import { EMAIL_VERIFICATION_EXPIRES_MS } from '../../constants/auth.constants.js';
import {
    createAuthToken,
    deleteAuthTokens,
} from '../../services/auth-token.service.js';

export const requestEmailVerificationFunction = async (to) => {
    try {
        const email = to;

        if (!email) {
            throw new Error('email is required');
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await AuthUser.findOne({ email: normalizedEmail });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isVerified) {
            throw new Error('Email is already verified');
        }
        await deleteAuthTokens({ userId: user._id, type: 'email_verification' });
        
        const token = await createAuthToken({
            userId: user._id,
            type: 'email_verification',
            expiresInMs: EMAIL_VERIFICATION_EXPIRES_MS
        });
        
        
        return { message: 'Email verification token generated successfully', verificationToken: token };
    } catch (error) {
        throw new Error(`Failed to generate email verification token: ${error.message}`);
    }
};