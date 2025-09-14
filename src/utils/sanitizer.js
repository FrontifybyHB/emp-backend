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

export const sanitizeAttendance = (attendance, requestingUser) => {
    if (!attendance) return null;
    
    const sanitized = {
        id: attendance._id,
        employee: attendance.employee,
        date: attendance.date,
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt
    };
    
    // Additional employee details only for authorized users
    if (canViewEmployeeDetails(requestingUser, attendance)) {
        sanitized.employeeDetails = attendance.employee;
    }
    
    return sanitized;
};

export const sanitizeAttendanceList = (attendanceList, requestingUser) => {
    if (!attendanceList || !Array.isArray(attendanceList)) return [];
    
    return attendanceList.map(attendance => sanitizeAttendance(attendance, requestingUser));
};

const canViewEmployeeDetails = (requestingUser, attendance) => {
    if (!requestingUser) return false;
    
    // Admin and HR can view all employee details
    if (requestingUser.isAdmin || requestingUser.role === 'admin' || requestingUser.role === 'hr') {
        return true;
    }
    
    // Managers can view their department employees
    if (requestingUser.role === 'manager') {
        return true; // Add department-specific logic here
    }
    
    // Employees can view their own details
    if (attendance.employee && attendance.employee._id && 
        attendance.employee._id.toString() === requestingUser.id) {
        return true;
    }
    
    return false;
};

export const sanitizeLeave = (leave, requestingUser) => {
    if (!leave) return null;
    
    const sanitized = {
        id: leave._id,
        employee: leave.employee,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        status: leave.status,
        createdAt: leave.createdAt,
        updatedAt: leave.updatedAt
    };
    
    // Calculate leave duration
    if (leave.startDate && leave.endDate) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        sanitized.duration = diffDays;
    }
    
    // Show rejection reason only if rejected and user has permission
    if (leave.status === 'Rejected' && leave.rejectionReason && 
        canViewRejectionReason(requestingUser, leave)) {
        sanitized.rejectionReason = leave.rejectionReason;
    }
    
    // Additional employee details only for authorized users
    if (canViewEmployeeDetails(requestingUser, leave)) {
        sanitized.employeeDetails = leave.employee;
    }
    
    return sanitized;
};

export const sanitizeLeaveList = (leaveList, requestingUser) => {
    if (!leaveList || !Array.isArray(leaveList)) return [];
    
    return leaveList.map(leave => sanitizeLeave(leave, requestingUser));
};

const canViewRejectionReason = (requestingUser, leave) => {
    if (!requestingUser) return false;
    
    // Admin and HR can view all rejection reasons
    if (requestingUser.isAdmin || requestingUser.role === 'admin' || requestingUser.role === 'hr') {
        return true;
    }
    
    // Managers can view their department's rejection reasons
    if (requestingUser.role === 'manager') {
        return true; // Add department-specific logic here
    }
    
    // Employees can view their own rejection reasons
    if (leave.employee && leave.employee._id && 
        leave.employee._id.toString() === requestingUser.id) {
        return true;
    }
    
    return false;
};

export const sanitizePayroll = (payroll, requestingUser) => {
    if (!payroll) return null;
    
    const sanitized = {
        id: payroll._id,
        employee: payroll.employee,
        month: payroll.month,
        year: payroll.year,
        paidOn: payroll.paidOn,
        createdAt: payroll.createdAt,
        updatedAt: payroll.updatedAt
    };
    
    // Show salary details only to authorized users
    if (canViewSalaryDetails(requestingUser, payroll)) {
        sanitized.basic = payroll.basic;
        sanitized.allowance = payroll.allowance;
        sanitized.deductions = payroll.deductions;
        sanitized.tax = payroll.tax;
        sanitized.netSalary = payroll.netSalary;
    }
    
    // Show payslip URL only to authorized users
    if (canViewPayslip(requestingUser, payroll)) {
        sanitized.payslipUrl = payroll.payslipUrl;
    }
    
    // Additional employee details only for authorized users
    if (canViewEmployeeDetails(requestingUser, payroll)) {
        sanitized.employeeDetails = payroll.employee;
    }
    
    return sanitized;
};

export const sanitizePayrollList = (payrollList, requestingUser) => {
    if (!payrollList || !Array.isArray(payrollList)) return [];
    
    return payrollList.map(payroll => sanitizePayroll(payroll, requestingUser));
};

const canViewSalaryDetails = (requestingUser, payroll) => {
    if (!requestingUser) return false;
    
    // Admin and HR can view all salary details
    if (requestingUser.isAdmin || requestingUser.role === 'admin' || requestingUser.role === 'hr') {
        return true;
    }
    
    // Managers can view their department's salary details
    if (requestingUser.role === 'manager') {
        return true; // Add department-specific logic here
    }
    
    // Employees can view their own salary details
    if (payroll.employee && payroll.employee._id && 
        payroll.employee._id.toString() === requestingUser.id) {
        return true;
    }
    
    return false;
};

const canViewPayslip = (requestingUser, payroll) => {
    if (!requestingUser) return false;
    
    // Admin and HR can view all payslips
    if (requestingUser.isAdmin || requestingUser.role === 'admin' || requestingUser.role === 'hr') {
        return true;
    }
    
    // Managers can view their department's payslips
    if (requestingUser.role === 'manager') {
        return true; // Add department-specific logic here
    }
    
    // Employees can view their own payslips
    if (payroll.employee && payroll.employee._id && 
        payroll.employee._id.toString() === requestingUser.id) {
        return true;
    }
    
    return false;
};

