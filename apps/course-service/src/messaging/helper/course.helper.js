

import mongoose from 'mongoose';
import { enrollInCourse } from '../../services/enrollment.service.js';
import { publishEvent } from '../producer.js';

export const enrollUserFromPaymentEvent = async (data) => {
	const { userId, courseId, paymentId } = data || {};

	if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
		throw new Error('Valid userId is required in course_enrollment_requests event');
	}

	if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
		throw new Error('Valid courseId is required in course_enrollment_requests event');
	}

	const enrollment = await enrollInCourse({ userId, courseId });

	await publishEvent('course_enrollment_success', 'course_exchange', 'course_enrolled', {
		courseId,
		userId,
		enrollmentId: enrollment._id,
		paymentId: paymentId || null,
		source: 'course_enrollment_requests',
	});

	return enrollment;
};