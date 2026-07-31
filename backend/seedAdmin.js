import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/adminModel.js"; 

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  family: 4,
})
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => {
    console.error("MongoDB connection failed ❌", err.message);
    process.exit(1);
  });

const seedAdmin = async () => {
  try {
    const adminEmail = "kyuu@admin.com";
    const plainPassword = "kyuu1234"; 

    // 1. Remove existing admin
    await Admin.deleteMany({ email: adminEmail });
    console.log("Cleared existing admin data.");

    // 2. Create new admin with PLAIN TEXT password
    // The pre('save') hook in your model will automatically hash it
    const admin = new Admin({
      name: "Kyuu Admin",
      email: adminEmail,
      password: plainPassword, // 👈 PASS PLAIN TEXT HERE
      role: "admin",
    });

    await admin.save();
    
    console.log("🎉 Admin seeded successfully ✅");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${plainPassword} (Hashed automatically by model)`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();