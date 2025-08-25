import Leave from "../models/leave.model.js";

export const requestLeave = async (employeeId, startDate, endDate, reason) => {
    return await Leave.create({
        employee: employeeId,
        startDate,
        endDate,
        reason
    });
};

export const updateLeaveStatus = async (leaveId, status) => {
    return await Leave.findByIdAndUpdate(
        leaveId,
        { $set: { status } },
        { new: true }
    );
};

export const getFindAllLeaves = async () => {
    return await Leave.find().populate("employee");
};
