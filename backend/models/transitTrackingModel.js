import mongoose from "mongoose";

const transitTrackingSchema = new mongoose.Schema({
  donor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Donor", 
    required: true,
    index: true
  },
  camp: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "BloodCamp", 
    required: true,
    index: true
  },
  location: {
    type: { 
      type: String, 
      enum: ["Point"], 
      default: "Point" 
    },
    coordinates: { 
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: (v) => v.length === 2 && 
          v[0] >= -180 && v[0] <= 180 && 
          v[1] >= -90 && v[1] <= 90,
        message: 'Coordinates must be valid [lng, lat]'
      }
    }
  },
  batteryLevel: { 
    type: Number, 
    min: 0, 
    max: 100,
    default: null
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2-hour TTL
    index: true
  }
}, { 
  timestamps: true,
  toJSON: { transform: (_, ret) => { delete ret.__v; return ret; } }
});

// Auto-delete expired tracking records
transitTrackingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Geospatial index for nearby queries
transitTrackingSchema.index({ location: "2dsphere" });
// Compound index for active tracking by camp
transitTrackingSchema.index({ camp: 1, isActive: 1, expiresAt: 1 });

export default mongoose.model("TransitTracking", transitTrackingSchema);