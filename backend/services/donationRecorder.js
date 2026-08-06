// backend/services/donationRecorder.js
import mongoose from "mongoose";
import Donor from "../models/donorModel.js";
import BloodCamp from "../models/bloodCampModel.js";
import Facility from "../models/facilityModel.js"; // Hospital/Lab model

/**
 * Record a completed donation after successful check-in
 * @param {string} campId - Blood camp ID
 * @param {string} donorId - Donor who was checked in
 * @param {number} unitsDonated - Number of units (default 1)
 * @returns {object} { success, message, data }
 */
export async function recordDonation(campId, donorId, unitsDonated = 1) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get camp details with populated hospital reference
    const camp = await BloodCamp.findById(campId)
      .populate("hospital", "_id name facilityType")
      .session(session);

    if (!camp) throw new Error("Camp not found");

    // 2. Update donor's last donation date and add to history
    const donorUpdate = await Donor.findByIdAndUpdate(
      donorId,
      {
        $set: {
          lastDonationDate: new Date(),
          eligibleToDonate: false // Auto-defer until 90 days pass
        },
        $push: {
          donationHistory: {
            donationDate: new Date(),
            facility: camp.hospital._id,
            bloodGroup: camp.registeredDonors.find(
              r => r.donor.toString() === donorId
            )?.donor?.bloodGroup || "Unknown",
            quantity: unitsDonated,
            remarks: `Donated at ${camp.title} on ${new Date().toLocaleDateString()}`,
            verified: true
          }
        }
      },
      { session, new: true }
    ).select("fullName bloodGroup lastDonationDate donationHistory");

    if (!donorUpdate) throw new Error("Donor not found");

    // 3. Increment hospital's blood stock for this blood group
    const hospitalId = camp.hospital._id;
    const bloodGroup = donorUpdate.bloodGroup;

    await Facility.findOneAndUpdate(
      { _id: hospitalId, "bloodStock.bloodGroup": bloodGroup },
      {
        $inc: { "bloodStock.$.quantity": unitsDonated },
        $set: { "bloodStock.$.lastUpdated": new Date() }
      },
      { session, upsert: false }
    );

    // If no existing stock entry exists for this blood group, create one
    const stockExists = await Facility.exists({
      _id: hospitalId,
      "bloodStock.bloodGroup": bloodGroup
    });

    if (!stockExists) {
      await Facility.findByIdAndUpdate(hospitalId, {
        $push: {
          bloodStock: {
            bloodGroup,
            quantity: unitsDonated,
            expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), // 42-day shelf life
            lastUpdated: new Date()
          }
        }
      }, { session });
    }

    await session.commitTransaction();

    return {
      success: true,
      message: "Donation recorded successfully",
      data: {
        donorName: donorUpdate.fullName,
        bloodGroup,
        unitsDonated,
        lastDonationDate: donorUpdate.lastDonationDate,
        nextEligibleDate: new Date(
          new Date(donorUpdate.lastDonationDate).getTime() + 90 * 24 * 60 * 60 * 1000
        ).toISOString().split("T")[0]
      }
    };
  } catch (err) {
    await session.abortTransaction();
    console.error("Record donation error:", err);
    throw err;
  } finally {
    session.endSession();
  }
}