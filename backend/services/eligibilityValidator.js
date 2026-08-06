// backend/services/eligibilityValidator.js
import Donor from "../models/donorModel.js";

/**
 * Validate donor eligibility against current health criteria
 * @param {string} donorId - MongoDB ObjectId of the donor
 * @returns {object} { isEligible, reason, daysUntilEligible }
 */
export async function validateDonorEligibility(donorId) {
  const donor = await Donor.findById(donorId).select(
    "lastDonationDate age gender healthInfo.weight eligibleToDonate"
  );

  if (!donor) {
    return { isEligible: false, reason: "Donor not found in system" };
  }

  // Check explicit medical deferral flag
  if (donor.eligibleToDonate === false) {
    return { 
      isEligible: false, 
      reason: "Temporarily deferred by medical staff" 
    };
  }

  // Age validation (18-65)
  if (donor.age < 18 || donor.age > 65) {
    return { 
      isEligible: false, 
      reason: `Age ${donor.age} outside valid donation range (18-65 years)` 
    };
  }

  // Weight validation (minimum 45kg)
  if (donor.healthInfo?.weight && donor.healthInfo.weight < 45) {
    return { 
      isEligible: false, 
      reason: `Weight ${donor.healthInfo.weight}kg below minimum requirement of 45kg` 
    };
  }

  // 90-day inter-donation interval check
  if (donor.lastDonationDate) {
    const lastDonation = new Date(donor.lastDonationDate);
    const now = new Date();
    const daysSince = Math.floor((now - lastDonation) / (1000 * 60 * 60 * 24));
    
    if (daysSince < 90) {
      return { 
        isEligible: false, 
        reason: `Last donation was ${daysSince} days ago. Minimum 90-day interval required.`,
        daysUntilEligible: 90 - daysSince
      };
    }
  }

  return { isEligible: true, reason: "All eligibility criteria met" };
}