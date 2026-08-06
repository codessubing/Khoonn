// frontend/src/pages/hospital/CampCheckInScanner.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import QrScanner from "react-qr-scanner";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Camera, CheckCircle2, XCircle, Loader2, ArrowLeft, Users, Download } from "lucide-react";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.PROD 
  ? "https://khoonn-backend.onrender.com" 
  : "http://localhost:5000";

export default function CampCheckInScanner() {
  const { campId } = useParams();
  const navigate = useNavigate();
  
  const [camp, setCamp] = useState(null);
  const [lastScannedToken, setLastScannedToken] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  // ✅ UPDATED: Error state now supports both string and object types
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  const socketRef = useRef(null);

  // Fetch camp details on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchCamp = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/camps/${campId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          setCamp(res.data.camps || res.data.data);
        }
      } catch {
        if (isMounted) {
          setError("Unable to load camp details");
        }
      }
    };
    
    fetchCamp();
    return () => { isMounted = false; };
  }, [campId]);

  // Real-time sync via Socket.IO
  useEffect(() => {
    if (!campId) return;

    let isMounted = true;
    
    const socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000
    });

    socket.emit("join-camp", campId);
    socketRef.current = socket;

    socket.on("check-in-update", (data) => {
      if (!isMounted) return;
      
      setCamp(prev => ({
        ...prev,
        actualDonors: data.totalCheckedIn,
        expectedDonors: data.expectedDonors
      }));

      if (data.donor?.fullName) {
        toast.success(`${data.donor.fullName} checked in remotely`, {
          icon: '',
          duration: 3000
        });
      }
    });

    // ✅ Delayed cleanup to survive React 18 Strict Mode double-invocation
    return () => {
      isMounted = false;
      const currentSocket = socket;
      
      const delay = import.meta.env.DEV ? 100 : 0;
      setTimeout(() => {
        if (socketRef.current === currentSocket) {
          currentSocket.disconnect();
          socketRef.current = null;
        }
      }, delay);
    };
  }, [campId]);

  // ✅ FIXED: react-qr-scanner v1.x passes decoded text as a plain string
  const handleScan = async (result) => {
    if (!result || checkingIn) return;
    
    // Result is now a string, not an object with .text property
    const scannedText = typeof result === "string" ? result : result?.text;
    if (!scannedText || scannedText === lastScannedToken) return;
    
    setLastScannedToken(scannedText);
    setCheckingIn(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/camps/${campId}/checkin`,
        { qrToken: scannedText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(res.data.data);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const responseData = err.response?.data;
      
      // ✅ NEW: Handle structured eligibility errors with deferral info
      if (responseData?.data?.daysUntilEligible !== undefined) {
        setError({
          message: responseData.message || "Check-in blocked",
          daysUntilEligible: responseData.data.daysUntilEligible
        });
        setTimeout(() => setError(null), 8000); // Longer display for actionable info
      } else {
        // Generic error fallback
        setError(responseData?.message || "Check-in failed");
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleError = (err) => {
    console.error("Camera error:", err);
    setCameraError("Camera access denied or unavailable. Please allow camera permissions.");
  };

  // Function to generate PDF report
  const generatePDFReport = async () => {
    setGeneratingReport(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/camps/${campId}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const reportData = response.data.data;

      // Create PDF
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text('Blood Camp Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 20, 30);

      // Camp Information
      doc.setFontSize(14);
      doc.text('Camp Information', 20, 45);
      doc.setFontSize(10);
      doc.text(`Title: ${reportData.camp.title}`, 20, 55);
      doc.text(`Date: ${new Date(reportData.camp.date).toLocaleDateString()}`, 20, 60);
      doc.text(`Location: ${reportData.camp.location.venue}, ${reportData.camp.location.city}`, 20, 65);
      doc.text(`Organizer: ${reportData.hospital.name}`, 20, 70);

      // Statistics Section
      let yPos = 85;
      doc.setFontSize(14);
      doc.text('Statistics', 20, yPos);
      doc.setFontSize(10);
      yPos += 10;
      doc.text(`Total Registrations: ${reportData.statistics.totalRegistrations}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Check-ins: ${reportData.statistics.totalCheckIns}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Donations: ${reportData.statistics.totalDonations}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Units Collected: ${reportData.statistics.totalUnitsCollected}`, 20, yPos);
      yPos += 5;
      doc.text(`Goal Achievement: ${reportData.statistics.percentageAchieved}%`, 20, yPos);

      // Blood Type Distribution Table
      yPos += 15;
      doc.setFontSize(14);
      doc.text('Blood Type Distribution', 20, yPos);
      
      const bloodTypeRows = Object.entries(reportData.bloodTypeDistribution).map(([type, data]) => [
        type,
        data.count.toString(),
        data.units.toString()
      ]);

      doc.autoTable({
        startY: yPos + 5,
        head: [['Blood Type', 'Donors', 'Units']],
        body: bloodTypeRows,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 163, 74] }
      });

      // Donor List Table
      const tableY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('Donor List', 20, tableY);

      const donorRows = reportData.donorList.map(donor => [
        donor.name,
        donor.bloodGroup,
        donor.checkInTime ? new Date(donor.checkInTime).toLocaleTimeString() : '-',
        donor.unitsDonated.toString()
      ]);

      doc.autoTable({
        startY: tableY + 5,
        head: [['Name', 'Blood Group', 'Check-in Time', 'Units Donated']],
        body: donorRows,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] }
      });

      // Footer
      const footerY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(8);
      doc.text('Generated by Khoonn Blood Bank Management System', 20, footerY);
      doc.text('For official use only. Requires hospital administrator approval.', 20, footerY + 5);

      // Signature area
      doc.setFontSize(10);
      const signatureY = doc.internal.pageSize.height - 40;
      doc.text('Staff Signature: ________________________', 20, signatureY);
      doc.text('Admin Approval: ________________________', 120, signatureY);

      // Save the PDF
      const fileName = `BloodCamp_Report_${reportData.camp.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success('Report generated successfully!');
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate report: ' + (err.response?.data?.message || err.message));
    } finally {
      setGeneratingReport(false);
    }
  };

  if (!camp && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Camp Check-In</h1>
              <p className="text-sm text-gray-600">{camp?.title}</p>
            </div>
          </div>
          
          {/* PDF Export Button */}
          <button
            onClick={generatePDFReport}
            disabled={generatingReport}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {generatingReport ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Report
          </button>
        </div>

        {/* Attendance Counter - LIVE SYNCED */}
        {camp && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-700">Checked In</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">{camp.actualDonors || 0}</span>
              <span className="text-sm text-gray-500 ml-1">/ {camp.expectedDonors || 0}</span>
            </div>
          </div>
        )}

        {/* Scanner Area */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {cameraError ? (
            <div className="p-8 text-center space-y-3">
              <Camera className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="text-red-600 font-medium">{cameraError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="btn-advanced text-sm"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <div className="relative aspect-square bg-black">
              {/* ✅ FIXED: Use onDecode instead of onResult, removed unsupported delayMs */}
              <QrScanner
                onDecode={(result) => handleScan(result)}
                onError={handleError}
                constraints={{ video: { facingMode: "environment" } }}
                className="w-full h-full object-cover"
                style={{ width: "100%" }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 -mb-1 -mr-1" />
                </div>
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm pointer-events-none">
                Point camera at donor's QR code
              </p>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-800 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Check-In Successful!
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Donor:</strong> {success.donor?.fullName || "N/A"}</p>
              <p><strong>Blood Group:</strong> {success.donor?.bloodGroup || "N/A"}</p>
              <p><strong>Phone:</strong> {success.donor?.phone || "N/A"}</p>
            </div>
          </div>
        )}

        {/* ✅ UPDATED: Enhanced Error Display with Eligibility Deferral Info */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 text-sm font-medium">
                {typeof error === "string" ? error : error.message}
              </p>
              {typeof error !== "string" && error.daysUntilEligible && (
                <p className="text-red-600 text-xs mt-1.5 font-medium">
                  ⏳ Eligible again in {error.daysUntilEligible} day{error.daysUntilEligible !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Manual Entry Fallback */}
        <details className="bg-white rounded-xl border border-gray-200">
          <summary className="p-4 cursor-pointer text-sm font-medium text-gray-700 select-none">
            Can't scan? Enter token manually
          </summary>
          <div className="p-4 pt-0 space-y-3">
            <input
              type="text"
              placeholder="Paste QR token here..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleScan(e.target.value);
                  e.target.value = "";
                }
              }}
            />
            <p className="text-xs text-gray-500">Press Enter to submit</p>
          </div>
        </details>
      </div>
    </div>
  );
}