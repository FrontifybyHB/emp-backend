import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        department: {
            type: String,
            required: true,
            index: true,
        },
        role: {
            type: String,
            required: true,
            index: true,
        },
        joiningDate: {
            type: Date,
            default: Date.now
        },
        documents: [
            {
                name: String,
                url: String
            }
        ],
        salary: {
            base: Number,
            allowance: Number,
            deductions: Number
        },
    },
    { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
