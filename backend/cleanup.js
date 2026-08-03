// cleanup.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Donor from "./models/donorModel.js"; // Update this path if needed

dotenv.config();

const cleanUpBadGeoData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Connected to Database...");

    // Find broken location objects and delete them
    const result = await Donor.updateMany(
      { "location.type": "Point", "location.coordinates": { $exists: false } },
      { $unset: { location: "", lastLocationUpdate: "" } }
    );

    console.log(`✅ Successfully cleaned up ${result.modifiedCount} broken donor records!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
};

cleanUpBadGeoData();