import Leave from "../models/leave.model.js";
import { findEmployeeByUserId, findEmployeeById } from "./employee.dao.js";

export const requestLeave = async (userId, leaveData) => {
    try {
        const { startDate, endDate, reason } = leaveData;
        
        // Verify employee exists
        const employee = await findEmployeeByUserId(userId, { populate: false });
        if (!employee) {
            throw new Error('Employee profile not found');
        }

        // Validate date logic
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            throw new Error('Leave start date cannot be in the past');
        }

        if (end < start) {
            throw new Error('Leave end date cannot be before start date');
        }

        // Check for overlapping leave requests
        const overlappingLeave = await Leave.findOne({
            employee: employee._id,
            status: { $in: ['Pending', 'Approved'] },
            $or: [
                {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                }
            ]
        });

        if (overlappingLeave) {
            throw new Error('You already have a leave request for overlapping dates');
        }

        // Create leave request
        const leave = await Leave.create({
            employee: employee._id,
            startDate: start,
            endDate: end,
            reason: reason || ''
        });

        return await Leave.findById(leave._id).populate('employee', 'firstName lastName department');
    } catch (error) {
        throw new Error(`Leave request failed: ${error.message}`);
    }
};

export const updateLeaveStatus = async (leaveId, status, updatedBy, rejectionReason = null) => {
    try {
        // Validate status
        if (!['Approved', 'Rejected'].includes(status)) {
            throw new Error('Invalid status. Must be Approved or Rejected');
        }

        // Find the leave request
        const leave = await Leave.findById(leaveId).populate('employee', 'firstName lastName department');
        if (!leave) {
            throw new Error('Leave request not found');
        }

        // Check if leave is still pending
        if (leave.status !== 'Pending') {
            throw new Error(`Leave request is already ${leave.status.toLowerCase()}`);
        }

        // Check if leave dates haven't passed
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (leave.startDate < today) {
            throw new Error('Cannot update status for past leave requests');
        }

        // Validate rejection reason
        if (status === 'Rejected' && (!rejectionReason || rejectionReason.trim().length === 0)) {
            throw new Error('Rejection reason is required when rejecting leave');
        }

        // Update leave status
        const updateData = { status };
        if (status === 'Rejected' && rejectionReason) {
            updateData.rejectionReason = rejectionReason.trim();
        }

        const updatedLeave = await Leave.findByIdAndUpdate(
            leaveId,
            updateData,
            { new: true, runValidators: true }
        ).populate('employee', 'firstName lastName department');

        return updatedLeave;
    } catch (error) {
        throw new Error(`Status update failed: ${error.message}`);
    }
};

export const getLeaveRequests = async (requestingUser, options = {}) => {
    try {
        const {
            employeeId,
            status,
            department,
            startDate,
            endDate,
            page = 1,
            limit = 20,
            sort = { createdAt: -1 }
        } = options;

        // Build filter based on user permissions
        const filter = await buildLeaveFilter(requestingUser, {
            employeeId,
            status,
            department,
            startDate,
            endDate
        });

        const skip = (page - 1) * limit;

        const leaves = await Leave.find(filter)
            .populate('employee', 'firstName lastName department role')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Leave.countDocuments(filter);

        return {
            leaves,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching leave requests: ${error.message}`);
    }
};

export const getMyLeaveRequests = async (userId, options = {}) => {
    try {
        const {
            status,
            startDate,
            endDate,
            page = 1,
            limit = 20,
            sort = { createdAt: -1 }
        } = options;

        // Verify employee exists
        const employee = await findEmployeeByUserId(userId, { populate: false });
        if (!employee) {
            throw new Error('Employee profile not found');
        }

        // Build filter
        const filter = { employee: employee._id };
        
        if (status) {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.startDate = {};
            if (startDate) filter.startDate.$gte = new Date(startDate);
            if (endDate) filter.startDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const leaves = await Leave.find(filter)
            .populate('employee', 'firstName lastName department')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Leave.countDocuments(filter);

        return {
            leaves,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching your leave requests: ${error.message}`);
    }
};

export const getLeaveById = async (leaveId, requestingUser) => {
    try {
        const leave = await Leave.findById(leaveId)
            .populate('employee', 'firstName lastName department role')
            .lean();

        if (!leave) {
            throw new Error('Leave request not found');
        }

        // Check if user can access this leave request
        if (!canAccessLeave(requestingUser, leave)) {
            throw new Error('Access denied');
        }

        return leave;
    } catch (error) {
        throw new Error(`Error fetching leave request: ${error.message}`);
    }
};

export const cancelLeaveRequest = async (leaveId, userId) => {
    try {
        // Verify employee exists
        const employee = await findEmployeeByUserId(userId, { populate: false });
        if (!employee) {
            throw new Error('Employee profile not found');
        }

        // Find the leave request
        const leave = await Leave.findOne({
            _id: leaveId,
            employee: employee._id
        });

        if (!leave) {
            throw new Error('Leave request not found or access denied');
        }

        // Check if leave can be cancelled
        if (leave.status !== 'Pending') {
            throw new Error(`Cannot cancel ${leave.status.toLowerCase()} leave request`);
        }

        // Check if leave hasn't started yet
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (leave.startDate <= today) {
            throw new Error('Cannot cancel leave request that has already started');
        }

        // Delete the leave request
        await Leave.findByIdAndDelete(leaveId);

        return { message: 'Leave request cancelled successfully' };
    } catch (error) {
        throw new Error(`Cancellation failed: ${error.message}`);
    }
};


// Helper functions
const buildLeaveFilter = async (requestingUser, params) => {
    const filter = {};

    // Apply status filter
    if (params.status) {
        filter.status = params.status;
    }

    // Apply date filters
    if (params.startDate || params.endDate) {
        filter.startDate = {};
        if (params.startDate) filter.startDate.$gte = new Date(params.startDate);
        if (params.endDate) filter.startDate.$lte = new Date(params.endDate);
    }

    // Apply employee filter
    if (params.employeeId) {
        filter.employee = params.employeeId;
    }

    // Apply department filter for managers
    if (params.department) {
        const employees = await findEmployeesByDepartment(params.department, { 
            select: '_id',
            populate: false 
        });
        filter.employee = { $in: employees.employees.map(emp => emp._id) };
    }

    // Role-based filtering
    if (requestingUser.role === 'employee') {
        const employee = await findEmployeeByUserId(requestingUser.id, { populate: false });
        if (employee) {
            filter.employee = employee._id;
        }
    }

    return filter;
};

const canAccessLeave = (requestingUser, leave) => {
    // Admin and HR can access all leave requests
    if (requestingUser.isAdmin || requestingUser.role === 'admin' || requestingUser.role === 'hr') {
        return true;
    }

    // Managers can access their department's leave requests
    if (requestingUser.role === 'manager') {
        return true; // Add department-specific logic here
    }

    // Employees can only access their own leave requests
    if (requestingUser.role === 'employee' && leave.employee && leave.employee._id) {
        return leave.employee._id.toString() === requestingUser.id;
    }

    return false;
};