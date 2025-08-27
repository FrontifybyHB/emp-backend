export const sanitizeUser = (user) => {
    if (!user) return null;
    
    const sanitized = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };

    return sanitized;
};

export const sanitizeUsers = (users) => {
    if (!Array.isArray(users)) return [];
    return users.map(user => sanitizeUser(user));
};