import { Router } from 'express';
import {
  createCourseController,
  deleteCourseController,
  enrollInCourseController,
  getCourseByIdController,
  getMyCourseProgressController,
  listCoursesController,
  listMyCoursesController,
  listMyEnrollmentsController,
  publishCourseController,
  updateCourseController,
  updateMyCourseProgressController,
} from '../controllers/course.controller.js';

const router = Router();

router.get('/', listCoursesController);
router.post('/', createCourseController);

router.get('/mine', listMyCoursesController);
router.get('/enrollments/me', listMyEnrollmentsController);

router.get('/:courseId', getCourseByIdController);
router.patch('/:courseId', updateCourseController);
router.delete('/:courseId', deleteCourseController);
router.post('/:courseId/publish', publishCourseController);

router.post('/:courseId/enroll', enrollInCourseController);
router.get('/:courseId/progress/me', getMyCourseProgressController);
router.patch('/:courseId/progress/me', updateMyCourseProgressController);

export default router;