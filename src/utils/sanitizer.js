export const sanitizeUsers = (users) => {
    if (!Array.isArray(users)) return [];
    return users.map(user => sanitizeUser(user));
};

export const sanitizeUser = (user) => {
    if (!user) return null;
    
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
};

export const sanitizeEmployee = (employee, requestingUser) => {
    if (!employee) return null;
    
    const sanitized = {
        id: employee._id,
        user: employee.user,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        role: employee.role,
        joiningDate: employee.joiningDate,
        documents: employee.documents,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
    };
    
    // Only HR, admin, and the employee themselves can see salary
    if (canViewSalary(requestingUser, employee)) {
        sanitized.salary = employee.salary;
    }
    
    return sanitized;
};

export const sanitizeEmployeeList = (employees, requestingUser) => {
    if (!employees || !Array.isArray(employees)) return [];
    
    return employees.map(employee => sanitizeEmployee(employee, requestingUser));
};


const canViewSalary = (requestingUser, employee) => {
    // Safety check for requestingUser
    if (!requestingUser) return false;
    
    // Admin and HR can always view salary
    if (requestingUser.isAdmin || requestingUser.role === 'admin' || requestingUser.role === 'hr') {
        return true;
    }
    
    // Employee can view their own salary
    if (employee.user && employee.user._id && employee.user._id.toString() === requestingUser.id) {
        return true;
    }
    
    return false;
};