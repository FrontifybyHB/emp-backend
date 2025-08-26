import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema({
    employee: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Employee", 
        required: true 
    },
    month: { 
        type: Number, 
        required: true 
    }, 
    year: { 
        type: Number, 
        required: true 
    },
    basic: Number,
    allowance: Number,
    deductions: Number,
    tax: Number,
    netSalary: Number,
    paidOn: Date,
    payslipUrl: String,
}, 
{ timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);
