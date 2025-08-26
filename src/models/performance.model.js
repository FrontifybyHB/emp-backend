import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema({
    employee: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Employee", 
        required: true 
    },
    goals: [{
        title: String,
        description: String,
        targetDate: Date,
        status: {
            type: String,
            enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
            default: "PENDING"
        }
    }]
}, { 
    timestamps: true 
});

export default mongoose.model("Performance", performanceSchema);
