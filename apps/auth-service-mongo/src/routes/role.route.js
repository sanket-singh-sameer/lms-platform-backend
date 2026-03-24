import express from 'express';
import { assignRoleController, createRoleController, removeRoleController } from '../controllers/role.controller.js';

const roleRoutes = express.Router();

roleRoutes.post('/', createRoleController);
roleRoutes.post('/assign', assignRoleController);
roleRoutes.post('/remove', removeRoleController);

export default roleRoutes;
