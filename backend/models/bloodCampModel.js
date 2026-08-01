import mongoose from "mongoose";

const bloodCampSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Organizing facility is required"],
      index: true, // ✅ Index for faster queries when fetching camps by facility
    },
    title: {
      type: String,
      required: [true, "Camp title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    date: {
      type: Date,
      required: [true, "Camp date is required"],
      index: true, // ✅ Index for faster sorting/filtering by date
    },
    time: {
      start: { type: String, required: [true, "Start time is required"] },
      end: { type: String, required: [true, "End time is required"] },
    },
    location: {
      venue: { type: String, required: [true, "Venue name is required"], trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
      state: { type: String, required: [true, "Province/State is required"], trim: true },
      pincode: {
        type: String,
        // ✅ FIXED: Updated to 5-digit regex for Nepal postal codes (e.g., 32900)
        match: [/^[0-9]{5}$/, "Please enter a valid 5-digit postal code"],
        trim: true,
      },
    },
    expectedDonors: { 
      type: Number, 
      default: 0,
      min: [0, "Expected donors cannot be negative"] 
    },
    actualDonors: { 
      type: Number, 
      default: 0,
      min: [0, "Actual donors cannot be negative"] 
    },
    status: {
      type: String,
      enum: {
        values: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
        message: "{VALUE} is not a valid camp status"
      },
      default: "Upcoming",
      index: true, // ✅ Index for faster filtering by status
    },
  },
  { 
    timestamps: true,
    // ✅ SECURITY & CLEANLINESS: Automatically strip __v from JSON responses
    toJSON: { 
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Optional: Add a pre-save hook to ensure end time is after start time (if stored as comparable strings like "09:00")
bloodCampSchema.pre("save", function(next) {
  if (this.time && this.time.start && this.time.end) {
    if (this.time.start >= this.time.end) {
      return next(new Error("End time must be strictly after start time"));
    }
  }
  next();
});

export default mongoose.model("BloodCamp", bloodCampSchema);