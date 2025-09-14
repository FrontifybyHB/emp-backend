import { 
    requestLeave as requestLeaveDAO, 
    updateLeaveStatus, 
    getLeaveRequests,
    getMyLeaveRequests,
    getLeaveById,
    cancelLeaveRequest,
} from "../dao/leave.dao.js";
import { sanitizeLeave, sanitizeLeaveList } from "../utils/sanitizer.js";

export const requestLeaveController = async (req, res, next) => {
    try {
        const { startDate, endDate, reason } = req.body;
        
        const leave = await requestLeaveDAO(req.user.id, {
            startDate,
            endDate,
            reason
        });
        
        res.status(201).json({ 
            success: true, 
            message: 'Leave request submitted successfully',
            data: sanitizeLeave(leave, req.user)
        });
    } catch (error) {
        if (error.message.includes('not found') || 
            error.message.includes('past') ||
            error.message.includes('before') ||
            error.message.includes('overlapping')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

export const getAllLeavesController = async (req, res, next) => {
    try {
        const { 
            employeeId,
            status,
            department,
            startDate,
            endDate,
            page = 1, 
            limit = 20,
            sort = 'createdAt',
            order = 'desc'
        } = req.query;

        // Check department access permissions
        if (department && !canAccessDepartment(req.user, department)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied for this department'
            });
        }

        const sortObj = { [sort]: order === 'desc' ? -1 : 1 };

        const options = {
            employeeId,
            status,
            department,
            startDate,
            endDate,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50), // Max 50 items per page
            sort: sortObj
        };

        const result = await getLeaveRequests(req.user, options);
        
        res.status(200).json({ 
            success: true, 
            message: 'Leave requests retrieved successfully',
            data: {
                leaves: sanitizeLeaveList(result.leaves, req.user),
                pagination: result.pagination
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getMyLeavesController = async (req, res, next) => {
    try {
        const { 
            status,
            startDate,
            endDate,
            page = 1, 
            limit = 20 
        } = req.query;

        const options = {
            status,
            startDate,
            endDate,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50)
        };

        const result = await getMyLeaveRequests(req.user.id, options);
        
        res.status(200).json({ 
            success: true, 
            message: 'Your leave requests retrieved successfully',
            data: {
                leaves: sanitizeLeaveList(result.leaves, req.user),
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

export const approveLeaveController = async (req, res, next) => {
    try {
        const { leaveId } = req.params;
        const { status, rejectionReason } = req.body;

        // Validate input
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Approved or Rejected'
            });
        }

        const leave = await updateLeaveStatus(leaveId, status, req.user.id, rejectionReason);
        
        res.status(200).json({ 
            success: true, 
            message: `Leave request ${status.toLowerCase()} successfully`,
            data: sanitizeLeave(leave, req.user)
        });
    } catch (error) {
        if (error.message.includes('not found') || 
            error.message.includes('already') ||
            error.message.includes('past') ||
            error.message.includes('Invalid status') ||
            error.message.includes('required')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

export const getLeaveByIdController = async (req, res, next) => {
    try {
        const { leaveId } = req.params;
        
        const leave = await getLeaveById(leaveId, req.user);
        
        res.status(200).json({ 
            success: true, 
            message: 'Leave request retrieved successfully',
            data: sanitizeLeave(leave, req.user)
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }
        if (error.message.includes('Access denied')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        next(error);
    }
};

export const cancelLeaveController = async (req, res, next) => {
    try {
        const { leaveId } = req.params;
        
        const result = await cancelLeaveRequest(leaveId, req.user.id);
        
        res.status(200).json({ 
            success: true, 
            message: result.message
        });
    } catch (error) {
        if (error.message.includes('not found') || 
            error.message.includes('Cannot cancel') ||
            error.message.includes('access denied') ||
            error.message.includes('started')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
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
        return true; // Add department-specific logic here
    }
    
    return false;
};