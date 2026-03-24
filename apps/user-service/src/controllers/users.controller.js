import mongoose from 'mongoose';
import { UserProfile } from '../models/user-profile.model.js';
import { UserPreferences } from '../models/user-performance.model.js';
import { UserStats } from '../models/user-stats.model.js';
import { getRequestUserId } from '../utils/request-user.js';

const profileFields = [
	'fullName',
	'username',
	'bio',
	'avatar',
	'coverImage',
	'phone',
	'dateOfBirth',
	'gender',
	'location',
	'socialLinks',
];

const preferenceFields = ['theme', 'language', 'notifications'];
const statsFields = ['enrolledCourses', 'completedCourses', 'totalWatchTime'];

const pickAllowedFields = (source, allowedFields) => {
	const output = {};

	for (const key of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(source, key)) {
			output[key] = source[key];
		}
	}

	return output;
};

const sendAuthError = (res, errorMessage) => {
	const statusCode = errorMessage.includes('Missing') ? 401 : 400;
	return res.status(statusCode).json({ message: errorMessage });
};

export const createProfile = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const existing = await UserProfile.findOne({ userId: auth.userId }).lean();
		if (existing) {
			return res.status(409).json({ message: 'Profile already exists for this user.' });
		}

		const payload = pickAllowedFields(req.body, profileFields);
		if (!payload.fullName) {
			return res.status(400).json({ message: 'fullName is required.' });
		}

		const profile = await UserProfile.create({
			userId: auth.userId,
			...payload,
		});

		await Promise.all([
			UserPreferences.findOneAndUpdate(
				{ userId: auth.userId },
				{ $setOnInsert: { userId: auth.userId } },
				{ upsert: true, new: true }
			),
			UserStats.findOneAndUpdate(
				{ userId: auth.userId },
				{ $setOnInsert: { userId: auth.userId } },
				{ upsert: true, new: true }
			),
		]);

		return res.status(201).json(profile);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to create profile.', error: error.message });
	}
};

export const getMyProfile = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const profile = await UserProfile.findOne({ userId: auth.userId });
		if (!profile) {
			return res.status(404).json({ message: 'Profile not found.' });
		}

		return res.status(200).json(profile);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch profile.', error: error.message });
	}
};

export const getPublicProfile = async (req, res) => {
	try {
		const { userId } = req.params;
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ message: 'Invalid userId.' });
		}

		const profile = await UserProfile.findOne(
			{ userId },
			'fullName username bio avatar coverImage location socialLinks createdAt updatedAt'
		);
		if (!profile) {
			return res.status(404).json({ message: 'Profile not found.' });
		}

		return res.status(200).json(profile);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch public profile.', error: error.message });
	}
};

export const updateMyProfile = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const updates = pickAllowedFields(req.body, profileFields);
		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ message: 'No valid profile fields provided.' });
		}

		const profile = await UserProfile.findOneAndUpdate(
			{ userId: auth.userId },
			{ $set: updates },
			{ new: true }
		);
		if (!profile) {
			return res.status(404).json({ message: 'Profile not found.' });
		}

		return res.status(200).json(profile);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update profile.', error: error.message });
	}
};

export const deleteMyProfile = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const [profile] = await Promise.all([
			UserProfile.findOneAndDelete({ userId: auth.userId }),
			UserPreferences.findOneAndDelete({ userId: auth.userId }),
			UserStats.findOneAndDelete({ userId: auth.userId }),
		]);

		if (!profile) {
			return res.status(404).json({ message: 'Profile not found.' });
		}

		return res.status(200).json({ message: 'User profile, preferences, and stats deleted.' });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to delete profile.', error: error.message });
	}
};

export const getPreferences = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const preferences = await UserPreferences.findOneAndUpdate(
			{ userId: auth.userId },
			{ $setOnInsert: { userId: auth.userId } },
			{ upsert: true, new: true }
		);

		return res.status(200).json(preferences);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch preferences.', error: error.message });
	}
};

export const updatePreferences = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const updates = pickAllowedFields(req.body, preferenceFields);
		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ message: 'No valid preferences fields provided.' });
		}

		const preferences = await UserPreferences.findOneAndUpdate(
			{ userId: auth.userId },
			{ $set: updates, $setOnInsert: { userId: auth.userId } },
			{ upsert: true, new: true }
		);

		return res.status(200).json(preferences);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update preferences.', error: error.message });
	}
};

export const getStats = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const stats = await UserStats.findOneAndUpdate(
			{ userId: auth.userId },
			{ $setOnInsert: { userId: auth.userId } },
			{ upsert: true, new: true }
		);

		return res.status(200).json(stats);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch stats.', error: error.message });
	}
};

export const updateStats = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const updates = pickAllowedFields(req.body, statsFields);
		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ message: 'No valid stats fields provided.' });
		}

		const stats = await UserStats.findOneAndUpdate(
			{ userId: auth.userId },
			{ $set: updates, $setOnInsert: { userId: auth.userId } },
			{ upsert: true, new: true }
		);

		return res.status(200).json(stats);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update stats.', error: error.message });
	}
};

export const uploadAvatar = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const { avatar } = req.body;
		if (!avatar) {
			return res.status(400).json({ message: 'avatar URL is required.' });
		}

		const profile = await UserProfile.findOneAndUpdate(
			{ userId: auth.userId },
			{ $set: { avatar } },
			{ new: true }
		);
		if (!profile) {
			return res.status(404).json({ message: 'Profile not found.' });
		}

		return res.status(200).json(profile);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update avatar.', error: error.message });
	}
};

export const uploadCover = async (req, res) => {
	try {
		const auth = getRequestUserId(req);
		if (auth.error) return sendAuthError(res, auth.error);

		const coverImage = req.body.coverImage || req.body.cover;
		if (!coverImage) {
			return res.status(400).json({ message: 'coverImage URL is required.' });
		}

		const profile = await UserProfile.findOneAndUpdate(
			{ userId: auth.userId },
			{ $set: { coverImage } },
			{ new: true }
		);
		if (!profile) {
			return res.status(404).json({ message: 'Profile not found.' });
		}

		return res.status(200).json(profile);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update cover image.', error: error.message });
	}
};

export const searchUsers = async (req, res) => {
	try {
		const q = (req.query.q || '').trim();
		const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
		const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));

		const filter = q
			? {
				$or: [
					{ fullName: { $regex: q, $options: 'i' } },
					{ username: { $regex: q, $options: 'i' } },
				],
			}
			: {};

		const users = await UserProfile.find(
			filter,
			'fullName username bio avatar coverImage location createdAt updatedAt'
		)
			.skip((page - 1) * limit)
			.limit(limit)
			.sort({ createdAt: -1 });

		return res.status(200).json({ page, limit, count: users.length, users });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to search users.', error: error.message });
	}
};
