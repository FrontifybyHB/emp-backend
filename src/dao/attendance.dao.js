import Attendance from "../models/attendance.model.js";
import { findEmployeeByUserId, findEmployeeById } from "./employee.dao.js";

export const createClockIn = async (userId) => {
    try {
        // Verify employee exists
        const employee = await findEmployeeByUserId(userId, { populate: false });
        if (!employee) {
            throw new Error('Employee profile not found');
        }

        const today = new Date();
        const timeString = today.toLocaleTimeString("en-GB", { hour12: false });
        const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Check if already clocked in today
        const existingAttendance = await Attendance.findOne({
            employee: employee._id,
            date: dateOnly
        });

        if (existingAttendance) {
            if (existingAttendance.clockIn?.time) {
                throw new Error('Already clocked in today');
            }
        }

        // Create or update attendance record
        const attendance = await Attendance.findOneAndUpdate(
            { employee: employee._id, date: dateOnly },
            { 
                $set: { 
                    clockIn: { time: timeString },
                    employee: employee._id,
                    date: dateOnly
                }
            },
            { upsert: true, new: true }
        ).populate('employee', 'firstName lastName department');

        return attendance;
    } catch (error) {
        throw new Error(`Clock in failed: ${error.message}`);
    }
};

export const updateClockOut = async (userId) => {
    try {
        // Verify employee exists
        const employee = await findEmployeeByUserId(userId, { populate: false });
        if (!employee) {
            throw new Error('Employee profile not found');
        }

        const today = new Date();
        const timeString = today.toLocaleTimeString("en-GB", { hour12: false });
        const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Find today's attendance record
        const attendance = await Attendance.findOne({
            employee: employee._id,
            date: dateOnly
        });

        if (!attendance) {
            throw new Error('No clock-in record found for today');
        }

        if (!attendance.clockIn?.time) {
            throw new Error('Must clock in before clocking out');
        }

        if (attendance.clockOut?.time) {
            throw new Error('Already clocked out today');
        }

        // Update with clock out time
        const updatedAttendance = await Attendance.findByIdAndUpdate(
            attendance._id,
            { $set: { clockOut: { time: timeString } } },
            { new: true }
        ).populate('employee', 'firstName lastName department');

        return updatedAttendance;
    } catch (error) {
        throw new Error(`Clock out failed: ${error.message}`);
    }
};

export const getSummary = async (userId, options = {}) => {
    try {
        const { 
            startDate, 
            endDate, 
            page = 1, 
            limit = 30,
            sort = { date: -1 }
        } = options;

        // Verify employee exists
        const employee = await findEmployeeByUserId(userId, { populate: false });
        if (!employee) {
            throw new Error('Employee profile not found');
        }

        // Build date filter
        const dateFilter = { employee: employee._id };
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) dateFilter.date.$gte = new Date(startDate);
            if (endDate) dateFilter.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const attendance = await Attendance.find(dateFilter)
            .populate('employee', 'firstName lastName department')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Attendance.countDocuments(dateFilter);

        return {
            attendance,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching attendance summary: ${error.message}`);
    }
};

export const getAllEmployeesSummary = async (requestingUser, options = {}) => {
    try {
        const { 
            employeeId,
            department,
            startDate, 
            endDate, 
            page = 1, 
            limit = 50,
            sort = { date: -1 }
        } = options;

        // Build filter based on permissions and parameters
        const filter = await buildAttendanceFilter(requestingUser, {
            employeeId,
            department,
            startDate,
            endDate
        });

        const skip = (page - 1) * limit;

        const attendance = await Attendance.find(filter)
            .populate('employee', 'firstName lastName department role')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Attendance.countDocuments(filter);

        return {
            attendance,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching all employees attendance: ${error.message}`);
    }
};

export const getTodayAttendance = async (userId) => {
    try {
        const employee = await findEmployeeByUserId(userId, { populate: false });
        if (!employee) {
            throw new Error('Employee profile not found');
        }

        const today = new Date();
        const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const attendance = await Attendance.findOne({
            employee: employee._id,
            date: dateOnly
        }).populate('employee', 'firstName lastName department');

        return attendance;
    } catch (error) {
        throw new Error(`Error fetching today's attendance: ${error.message}`);
    }
};


// Helper function to build attendance filter based on user permissions
const buildAttendanceFilter = async (requestingUser, params) => {
    const filter = {};

    // Apply date filters
    if (params.startDate || params.endDate) {
        filter.date = {};
        if (params.startDate) filter.date.$gte = new Date(params.startDate);
        if (params.endDate) filter.date.$lte = new Date(params.endDate);
    }

    // Apply employee filter
    if (params.employeeId) {
        filter.employee = params.employeeId;
    }

    // Apply department filter for managers
    if (params.department) {
        // Get employees from specific department
        const employees = await findEmployeesByDepartment(params.department, { 
            select: '_id',
            populate: false 
        });
        filter.employee = { $in: employees.employees.map(emp => emp._id) };
    }

    return filter;
};