// backend/services/campReportService.js
import BloodCamp from '../models/bloodCampModel.js';
import Donor from '../models/donorModel.js';
import Facility from '../models/facilityModel.js';

export const generateCampReportData = async (campId) => {
  try {
    const camp = await BloodCamp.findById(campId)
      .populate('hospital', 'name address.phone address.email')
      .populate({
        path: 'registeredDonors.donor',
        select: 'fullName bloodGroup lastDonationDate eligibleToDonate'
      });

    if (!camp) {
      throw new Error('Camp not found');
    }

    // Calculate camp statistics
    const checkedInDonors = camp.registeredDonors.filter(reg => reg.checkedIn);
    const donationCompletedDonors = camp.registeredDonors.filter(reg => reg.donationRecorded);
    
    // Blood type distribution
    const bloodTypeDistribution = {};
    donationCompletedDonors.forEach(reg => {
      const bloodType = reg.donor.bloodGroup;
      const units = reg.unitsDonated || 1;
      
      if (!bloodTypeDistribution[bloodType]) {
        bloodTypeDistribution[bloodType] = { count: 0, units: 0 };
      }
      bloodTypeDistribution[bloodType].count++;
      bloodTypeDistribution[bloodType].units += units;
    });

    // Summary data
    const reportData = {
      camp: {
        id: camp._id,
        title: camp.title,
        date: camp.date,
        time: camp.time,
        location: camp.location,
        status: camp.status,
        expectedDonors: camp.expectedDonors,
        actualDonors: camp.actualDonors
      },
      hospital: {
        name: camp.hospital.name,
        contact: camp.hospital.address?.phone,
        email: camp.hospital.address?.email
      },
      statistics: {
        totalRegistrations: camp.registeredDonors.length,
        totalCheckIns: checkedInDonors.length,
        totalDonations: donationCompletedDonors.length,
        totalUnitsCollected: donationCompletedDonors.reduce((sum, reg) => sum + (reg.unitsDonated || 1), 0),
        percentageAchieved: camp.expectedDonors > 0 ? Math.round((donationCompletedDonors.length / camp.expectedDonors) * 100) : 0
      },
      bloodTypeDistribution: bloodTypeDistribution,
      donorList: donationCompletedDonors.map(reg => ({
        name: reg.donor.fullName,
        bloodGroup: reg.donor.bloodGroup,
        checkInTime: reg.checkInTime,
        donationTime: reg.donationRecordedAt,
        unitsDonated: reg.unitsDonated || 1
      })),
      summary: {
        reportGeneratedAt: new Date(),
        staffSignature: null,
        adminApproval: null
      }
    };

    return reportData;

  } catch (error) {
    console.error('Error generating camp report:', error);
    throw error;
  }
};