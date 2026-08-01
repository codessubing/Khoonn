import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema({
  hospitalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Facility", 
    required: [true, "Requesting hospital is required"]
  },
  labId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Facility", 
    required: [true, "Target blood lab is required"]
  },
  bloodType: { 
    type: String, 
    required: [true, "Blood type is required"],
    trim: true,
    enum: {
      values: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      message: "{VALUE} is not a valid blood type"
    }
  },
  units: { 
    type: Number, 
    required: [true, "Number of units is required"], 
    min: [1, "Units requested must be at least 1"]
  },
  status: { 
    type: String, 
    enum: {
      values: ["pending", "accepted", "rejected"],
      message: "{VALUE} is not a valid request status"
    }, 
    default: "pending",
    index: true // ✅ Index for fast filtering by status
  },
  processedAt: { 
    type: Date, 
    default: null 
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, "Notes cannot exceed 500 characters"]
  }
}, { 
  timestamps: true 
});

// ✅ Compound indexes for blazing-fast query performance in controllers
// Speeds up: BloodRequest.find({ hospitalId }).sort({ createdAt: -1 })
bloodRequestSchema.index({ hospitalId: 1, createdAt: -1 });

// Speeds up: BloodRequest.find({ labId, status: "pending" })
bloodRequestSchema.index({ labId: 1, status: 1 });

export default mongoose.model("BloodRequest", bloodRequestSchema);