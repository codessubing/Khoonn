// backend/routes/liveTrackingRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import Donor from '../models/donorModel.js';
import BloodCamp from '../models/bloodCampModel.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ✅ NEW: Update donor's live location (called periodically by frontend)
router.post('/update-location', protect, authorize('donor'), async (req, res) => {
  try {
    const { lng, lat, status = 'en_route', campId } = req.body;
    
    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const donorId = req.user._id;

    // Validate camp exists if provided
    let camp = null;
    if (campId) {
      camp = await BloodCamp.findById(campId);
      if (!camp) {
        return res.status(404).json({
          success: false,
          message: 'Camp not found'
        });
      }
    }

    // Update donor's live location
    const updatedDonor = await Donor.findByIdAndUpdate(
      donorId,
      {
        $set: {
          'liveLocation.type': 'Point',
          'liveLocation.coordinates': [parseFloat(lng), parseFloat(lat)],
          'liveLocation.updatedAt': new Date(),
          liveStatus: status,
          currentCampId: campId || null,
          lastLocationUpdate: new Date()
        }
      },
      { new: true }
    );

    if (!updatedDonor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Emit real-time update to relevant camp room
    if (campId && global.io) {
      global.io.to(`camp_${campId}`).emit('donor_live_update', {
        donorId: updatedDonor._id,
        fullName: updatedDonor.fullName,
        bloodGroup: updatedDonor.bloodGroup,
        liveStatus: status,
        location: {
          lng: parseFloat(lng),
          lat: parseFloat(lat)
        },
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        donor: {
          id: updatedDonor._id,
          fullName: updatedDonor.fullName,
          liveStatus: updatedDonor.liveStatus,
          currentCampId: updatedDonor.currentCampId
        }
      }
    });

  } catch (error) {
    console.error('Error updating live location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update live location',
      error: error.message
    });
  }
});

// ✅ NEW: Get all donors currently en_route to a specific camp
router.get('/camp/:campId/en-route', protect, authorize('hospital', 'admin'), async (req, res) => {
  try {
    const { campId } = req.params;

    const camp = await BloodCamp.findById(campId);
    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found'
      });
    }

    // Find donors en_route to this camp
    const enRouteDonors = await Donor.find({
      currentCampId: campId,
      liveStatus: { $in: ['en_route', 'arriving'] },
      'liveLocation.coordinates': { $exists: true }
    }).select('_id fullName bloodGroup liveStatus liveLocation.lastLocationUpdate');

    res.json({
      success: true,
      data: enRouteDonors,
      count: enRouteDonors.length
    });

  } catch (error) {
    console.error('Error fetching en-route donors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch en-route donors',
      error: error.message
    });
  }
});

// ✅ NEW: Mark donor as arrived at camp
router.post('/mark-arrival', protect, authorize('donor'), async (req, res) => {
  try {
    const { campId } = req.body;
    
    if (!campId) {
      return res.status(400).json({
        success: false,
        message: 'Camp ID is required'
      });
    }

    const donorId = req.user._id;

    // Update donor status to 'at_camp'
    const updatedDonor = await Donor.findByIdAndUpdate(
      donorId,
      {
        $set: {
          liveStatus: 'at_camp',
          currentCampId: campId,
          lastLocationUpdate: new Date()
        }
      },
      { new: true }
    );

    if (!updatedDonor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Emit arrival notification to camp
    if (global.io) {
      global.io.to(`camp_${campId}`).emit('donor_arrived', {
        donorId: updatedDonor._id,
        fullName: updatedDonor.fullName,
        bloodGroup: updatedDonor.bloodGroup,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Arrival marked successfully',
      data: {
        donor: {
          id: updatedDonor._id,
          fullName: updatedDonor.fullName,
          liveStatus: updatedDonor.liveStatus
        }
      }
    });

  } catch (error) {
    console.error('Error marking arrival:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark arrival',
      error: error.message
    });
  }
});

export default router;