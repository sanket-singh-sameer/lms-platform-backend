import express from 'express';
import { deleteSessionController, listSessionsController } from '../controllers/session.controller.js';

const sessionRoutes = express.Router();

sessionRoutes.get('/', listSessionsController);
sessionRoutes.delete('/:sessionId', deleteSessionController);

export default sessionRoutes;
