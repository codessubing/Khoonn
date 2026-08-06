// frontend/src/hooks/useTransitTracking.js
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.PROD 
  ? "https://khoonn-backend.onrender.com" 
  : "http://localhost:5000";

export function useTransitTracking(campId) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Battery-aware update interval (ms)
  const getUpdateInterval = useCallback(() => {
    if (batteryLevel > 80) return 5000;   // High battery: 5s
    if (batteryLevel > 50) return 15000;  // Medium: 15s
    if (batteryLevel > 20) return 30000;  // Low: 30s
    return 60000;                         // Critical: 60s
  }, [batteryLevel]);

  // Start sharing location
  const startTracking = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");
      
      // Get initial position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      const coordinates = [position.coords.longitude, position.coords.latitude];
      
      // Register with backend
      await axios.post(
        `${API_BASE_URL}/api/transit/start`,
        { campId, coordinates, batteryLevel },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsActive(true);
      lastUpdateRef.current = Date.now();

      // Connect to Socket.IO for real-time feedback
      socketRef.current = io(API_BASE_URL, { transports: ["websocket", "polling"] });
      socketRef.current.emit("join-camp", campId);

      // Start watching position with dynamic interval
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const now = Date.now();
          const interval = getUpdateInterval();
          
          if (now - lastUpdateRef.current < interval) return;
          
          lastUpdateRef.current = now;
          const coords = [pos.coords.longitude, pos.coords.latitude];
          
          try {
            await axios.patch(
              `${API_BASE_URL}/api/transit/update`,
              { coordinates: coords, batteryLevel },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch {
            // Intentionally ignoring individual update failures to prevent UI disruption
            console.error("Location update failed silently");
          }
        },
        (err) => {
          setError(`Location error: ${err.message}`);
          stopTracking();
        },
        { enableHighAccuracy: true, maximumAge: 30000 }
      );

      // Monitor battery level changes
      if ("getBattery" in navigator) {
        const battery = await navigator.getBattery();
        setBatteryLevel(battery.level * 100);
        
        const handleBatteryChange = () => setBatteryLevel(battery.level * 100);
        battery.addEventListener("levelchange", handleBatteryChange);
        
        // Cleanup listener on unmount
        return () => battery.removeEventListener("levelchange", handleBatteryChange);
      }
    } catch {
      // ✅ FIXED: Removed unused 'err' parameter
      setError("Failed to start tracking");
      setIsActive(false);
    }
  };

  // Stop sharing location
  const stopTracking = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/transit/stop`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (socketRef.current) socketRef.current.disconnect();
      
      setIsActive(false);
      setError(null);
    } catch {
      // ✅ FIXED: Removed unused 'err' parameter here too for consistency
      setError("Failed to stop tracking");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  return { isActive, error, batteryLevel, startTracking, stopTracking };
}