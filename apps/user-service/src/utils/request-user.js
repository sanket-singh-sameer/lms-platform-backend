import mongoose from 'mongoose';

export const getRequestUserId = (req) => {
	const fromHeader = req.header('x-user-id');
	const fromReqUser = req.user?.id || req.user?._id;
	const userId = fromHeader || fromReqUser;

	if (!userId) {
		return { error: 'Missing authenticated user id. Provide x-user-id header.' };
	}

	if (!mongoose.Types.ObjectId.isValid(userId)) {
		return { error: 'Invalid authenticated user id.' };
	}

	return { userId };
};
