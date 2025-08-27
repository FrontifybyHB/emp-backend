import { 
    createClockIn, 
    updateClockOut, 
    getSummary, 
    getAllEmployeesSummary,
    getTodayAttendance,
} from "../dao/attendance.dao.js";
import { sanitizeAttendance, sanitizeAttendanceList } from "../utils/sanitizer.js";

export const clockInController = async (req, res, next) => {
    try {
        const attendance = await createClockIn(req.user.id);
        
        res.status(201).json({ 
            success: true, 
            message: 'Clocked in successfully',
            data: sanitizeAttendance(attendance, req.user)
        });
    } catch (error) {
        if (error.message.includes('Already clocked in') || 
            error.message.includes('not found')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

export const clockOutController = async (req, res, next) => {
    try {
        const attendance = await updateClockOut(req.user.id);
        
        res.status(200).json({ 
            success: true, 
            message: 'Clocked out successfully',
            data: sanitizeAttendance(attendance, req.user)
        });
    } catch (error) {
        if (error.message.includes('No clock-in') || 
            error.message.includes('Must clock in') ||
            error.message.includes('Already clocked out') ||
            error.message.includes('not found')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

export const summaryController = async (req, res, next) => {
    try {
        const { 
            startDate, 
            endDate, 
            page = 1, 
            limit = 30 
        } = req.query;

        const options = {
            startDate,
            endDate,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100) // Max 100 records
        };

        const result = await getSummary(req.user.id, options);
        
        res.status(200).json({ 
            success: true, 
            message: 'Attendance summary retrieved successfully',
            data: {
                attendance: sanitizeAttendanceList(result.attendance, req.user),
                pagination: result.pagination
            }
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }
        next(error);
    }
};

export const allEmployeesSummaryController = async (req, res, next) => {
    try {
        const { 
            employeeId,
            department,
            startDate, 
            endDate, 
            page = 1, 
            limit = 50 
        } = req.query;

        // Check permissions for department access
        if (department && !canAccessDepartment(req.user, department)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied for this department'
            });
        }

        const options = {
            employeeId,
            department,
            startDate,
            endDate,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100)
        };

        const result = await getAllEmployeesSummary(req.user, options);
        
        res.status(200).json({ 
            success: true, 
            message: 'All employees attendance retrieved successfully',
            data: {
                attendance: sanitizeAttendanceList(result.attendance, req.user),
                pagination: result.pagination
            }
        });
    } catch (error) {
        next(error);
    }
};

export const todayAttendanceController = async (req, res, next) => {
    try {
        const attendance = await getTodayAttendance(req.user.id);
        
        res.status(200).json({ 
            success: true, 
            message: "Today's attendance retrieved successfully",
            data: attendance ? sanitizeAttendance(attendance, req.user) : null
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }
        next(error);
    }
};


export const employeeAttendanceController = async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate, page = 1, limit = 30 } = req.query;

        // Check if user can access this employee's attendance
        if (!canAccessEmployeeAttendance(req.user, employeeId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const options = {
            employeeId,
            startDate,
            endDate,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100)
        };

        const result = await getAllEmployeesSummary(req.user, options);
        
        res.status(200).json({ 
            success: true, 
            message: 'Employee attendance retrieved successfully',
            data: {
                attendance: sanitizeAttendanceList(result.attendance, req.user),
                pagination: result.pagination
            }
        });
    } catch (error) {
        next(error);
    }
};

// Helper functions for security and permissions
const canAccessDepartment = (user, department) => {
    // Admin and HR can access all departments
    if (user.isAdmin || user.role === 'admin' || user.role === 'hr') {
        return true;
    }
    
    // Managers can access their own department
    if (user.role === 'manager') {
        // Add department-specific logic here
        return true;
    }
    
    return false;
};

const canAccessEmployeeAttendance = (user, employeeId) => {
    // Admin and HR can access all employee attendance
    if (user.isAdmin || user.role === 'admin' || user.role === 'hr') {
        return true;
    }
    
    // Managers can access their department employees
    if (user.role === 'manager') {
        return true; // Add department-specific logic here
    }
    
    return false;
};