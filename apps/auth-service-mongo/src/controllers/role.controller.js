import { AuthUser } from '../models/auth-user.model.js';
import { ALLOWED_ROLES } from '../constants/auth.constants.js';

const createRoleController = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'name is required' });
    }

    const normalizedRole = String(name).toLowerCase().trim();
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
        return res.status(400).json({ message: 'Invalid role name' });
    }

    return res.status(200).json({
        message: 'Role is available',
        role: { name: normalizedRole }
    });
};

const assignRoleController = async (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ message: 'userId and role are required' });
        }

        const normalizedRole = String(role).toLowerCase().trim();
        if (!ALLOWED_ROLES.includes(normalizedRole)) {
            return res.status(400).json({ message: 'Invalid role name' });
        }

        const user = await AuthUser.findByIdAndUpdate(
            userId,
            { $addToSet: { roles: normalizedRole } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Role assigned successfully',
            user: {
                id: user._id,
                email: user.email,
                roles: user.roles
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to assign role', error: error.message });
    }
};

const removeRoleController = async (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ message: 'userId and role are required' });
        }

        const normalizedRole = String(role).toLowerCase().trim();
        if (!ALLOWED_ROLES.includes(normalizedRole)) {
            return res.status(400).json({ message: 'Invalid role name' });
        }

        const user = await AuthUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedRoles = user.roles.filter((item) => item !== normalizedRole);
        if (!updatedRoles.length) {
            return res.status(400).json({ message: 'User must have at least one role' });
        }

        user.roles = updatedRoles;
        await user.save();

        return res.status(200).json({
            message: 'Role removed successfully',
            user: {
                id: user._id,
                email: user.email,
                roles: user.roles
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to remove role', error: error.message });
    }
};

export { createRoleController, assignRoleController, removeRoleController };
