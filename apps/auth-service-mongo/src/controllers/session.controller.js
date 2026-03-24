import { getUserIdFromAccessToken } from '../utils/auth-token.utils.js';
import { extractAccessToken } from '../utils/request-token.utils.js';
import { deleteSessionById, listUserSessions } from '../services/auth-session.service.js';

const listSessionsController = async (req, res) => {
    try {
        const accessToken = extractAccessToken(req);
        const userId = getUserIdFromAccessToken(accessToken);

        if (!userId) {
            return res.status(401).json({ message: 'Valid access token is required' });
        }

        const sessions = await listUserSessions(userId);
        return res.status(200).json({
            sessions: sessions.map((session) => ({
                id: session._id,
                userAgent: session.userAgent,
                ipAddress: session.ipAddress,
                expiresAt: session.expiresAt,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            }))
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to list sessions', error: error.message });
    }
};

const deleteSessionController = async (req, res) => {
    try {
        const accessToken = extractAccessToken(req);
        const userId = getUserIdFromAccessToken(accessToken);

        if (!userId) {
            return res.status(401).json({ message: 'Valid access token is required' });
        }

        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({ message: 'sessionId is required' });
        }

        const deleted = await deleteSessionById({ userId, sessionId });
        if (!deleted) {
            return res.status(404).json({ message: 'Session not found' });
        }

        return res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to delete session', error: error.message });
    }
};

export { listSessionsController, deleteSessionController };
