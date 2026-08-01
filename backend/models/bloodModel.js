import mongoose from "mongoose";

const bloodSchema = new mongoose.Schema({
  bloodGroup: { 
    type: String, 
    required: [true, "Blood group is required"],
    enum: {
      values: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      message: "{VALUE} is not a valid blood group"
    }
  },
  quantity: { 
    type: Number, 
    required: [true, "Quantity is required"],
    min: [0, "Quantity cannot be negative"],
    default: 0 
  },
  expiryDate: { 
    type: Date, 
    required: [true, "Expiry date is required"]
  },
  // ✅ REMOVED manual createdAt. { timestamps: true } handles this automatically 
  // and prevents schema conflicts.
  bloodLab: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Facility",
    default: null
  },
  hospital: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Facility",
    default: null
  },
}, { 
  timestamps: true // Automatically manages createdAt and updatedAt
});

// ✅ Validate that exactly ONE owner (bloodLab OR hospital) is assigned
bloodSchema.pre('save', function(next) {
  if (!this.bloodLab && !this.hospital) {
    return next(new Error('Either bloodLab or hospital must be provided'));
  }
  if (this.bloodLab && this.hospital) {
    return next(new Error('A blood unit cannot belong to both a bloodLab and a hospital simultaneously'));
  }
  next();
});

// ✅ Compound indexes for optimal query performance in controllers
// Speeds up: Blood.find({ bloodLab: labId, bloodGroup: type })
bloodSchema.index({ bloodLab: 1, bloodGroup: 1 });

// Speeds up: Blood.find({ hospital: hospitalId, bloodGroup: type })
bloodSchema.index({ hospital: 1, bloodGroup: 1 });

// ✅ Bonus: Speeds up dashboard queries that check for expiring stock
bloodSchema.index({ expiryDate: 1 });

export default mongoose.model("Blood", bloodSchema);