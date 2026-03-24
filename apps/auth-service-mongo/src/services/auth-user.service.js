const normalizeRoles = ({ role, roles, allowedRoles }) => {
    const requestedRoles = Array.isArray(roles)
        ? roles
        : role
            ? [role]
            : ['student'];

    const normalizedRoles = [...new Set(requestedRoles.map((item) => String(item).toLowerCase().trim()))];

    if (!normalizedRoles.length || normalizedRoles.some((item) => !allowedRoles.includes(item))) {
        return {
            isValid: false,
            roles: [],
            message: 'role must be student, instructor, or admin'
        };
    }

    return {
        isValid: true,
        roles: normalizedRoles,
        message: null
    };
};

export { normalizeRoles };