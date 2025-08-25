import Attendance from "../models/attendance.model.js";

export const createClockIn = async (employeeId) => {
    const today = new Date();
    const timeString = today.toLocaleTimeString("en-GB", { hour12: false });
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return await Attendance.create({
        employee: employeeId,
        date: dateOnly,
        clockIn: { time: timeString }
    });
};

export const updateClockOut = async (employeeId) => {
    const today = new Date();
    const timeString = today.toLocaleTimeString("en-GB", { hour12: false });
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return await Attendance.findOneAndUpdate(
        { employee: employeeId, date: dateOnly },
        { $set: { clockOut: { time: timeString } } },
        { new: true }
    );
};

export const getSummary = async (employeeId) => {
    return await Attendance.find({ employee: employeeId }).populate("employee");
};

export const getAllEmployeesSummary = async () => {
    return await Attendance.find().populate("employee");
};
