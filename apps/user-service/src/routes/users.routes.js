import { Router } from 'express';
import {
	createProfile,
	getMyProfile,
	getPublicProfile,
	updateMyProfile,
	deleteMyProfile,
	getPreferences,
	updatePreferences,
	getStats,
	updateStats,
	uploadAvatar,
	uploadCover,
	searchUsers,
} from '../controllers/users.controller.js';

const router = Router();

router.post('/', createProfile);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.delete('/me', deleteMyProfile);

router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);

router.get('/stats', getStats);
router.patch('/stats', updateStats);

router.post('/avatar', uploadAvatar);
router.post('/cover', uploadCover);

router.get('/search', searchUsers);
router.get('/:userId', getPublicProfile);

export default router;
