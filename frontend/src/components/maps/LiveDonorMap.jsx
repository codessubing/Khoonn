// frontend/src/components/maps/LiveDonorMap.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateIcon, Clock, User, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for live donors
const liveDonorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const enRouteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const arrivingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const atCampIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ onLocationFound }) {
  const [position, setPosition] = useState(null);
  const map = useMapEvents({
    locationfound: (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 13);
      onLocationFound(e.latlng);
    },
  });

  useEffect(() => {
    map.locate().on('locationerror', (e) => {
      console.error('Location error:', e.message);
      toast.error('Unable to get your location. Please enable location services.');
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position} icon={new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

// FIX 1: Removed unused `showAllDonors` from props
export default function LiveDonorMap({ campId }) {
  const [userLocation, setUserLocation] = useState(null);
  const [liveDonors, setLiveDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState('idle');
  const [currentCampId, setCurrentCampId] = useState(campId);
  const intervalRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setCurrentCampId(profile.currentCampId || campId);
    }
  }, [campId]);

  // FIX 2: Wrapped in useCallback to prevent infinite loops in useEffect
  const fetchLiveDonors = useCallback(async () => {
    if (!currentCampId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/live/camp/${currentCampId}/en-route`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();
      if (response.ok) {
        setLiveDonors(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch live donors');
      }
    } catch (error) {
      console.error('Error fetching live donors:', error);
      toast.error(error.message || 'Failed to fetch live donors');
    } finally {
      setLoading(false);
    }
  }, [currentCampId]); // Added dependency

  const startTracking = async () => {
    if (!userLocation) {
      toast.error('Please enable location first');
      return;
    }

    setTrackingStatus('tracking');
    await updateLocation(userLocation.lng, userLocation.lat, 'en_route', currentCampId);
    
    intervalRef.current = setInterval(async () => {
      if (userLocation && trackingStatus === 'tracking') {
        await updateLocation(userLocation.lng, userLocation.lat, 'en_route', currentCampId);
      }
    }, 15000);
  };

  const stopTracking = () => {
    setTrackingStatus('idle');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    updateLocation(userLocation?.lng, userLocation?.lat, 'idle', null);
  };

  const updateLocation = async (lng, lat, status, campId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/live/update-location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lng,
          lat,
          status,
          campId
        })
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleLocationFound = (latlng) => {
    setUserLocation({
      lat: latlng.lat,
      lng: latlng.lng
    });
    toast.success('Location detected successfully!');
  };

  useEffect(() => {
    fetchLiveDonors();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentCampId, fetchLiveDonors]); 

  useEffect(() => {
    const initSocket = async () => {
      if (typeof window !== 'undefined' && window.io && currentCampId) {
        const socket = window.io(`${import.meta.env.VITE_BACKEND_URL}`);
        socketRef.current = socket;
        
        socket.emit('join-camp', currentCampId);
        
        socket.on('donor_live_update', (data) => {
          setLiveDonors(prev => {
            const existingIndex = prev.findIndex(d => d._id.toString() === data.donorId.toString());
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                liveStatus: data.liveStatus,
                liveLocation: {
                  coordinates: [data.location.lng, data.location.lat]
                },
                lastLocationUpdate: data.timestamp
              };
              return updated;
            } else {
              return [...prev, {
                _id: data.donorId,
                fullName: data.fullName,
                bloodGroup: data.bloodGroup,
                liveStatus: data.liveStatus,
                liveLocation: {
                  coordinates: [data.location.lng, data.location.lat]
                },
                lastLocationUpdate: data.timestamp
              }];
            }
          });
        });

        socket.on('donor_arrived', (data) => {
          setLiveDonors(prev => 
            prev.map(d => 
              d._id.toString() === data.donorId.toString() 
                ? { ...d, liveStatus: 'at_camp' } 
                : d
            )
          );
        });

        return () => {
          socket.off('donor_live_update');
          socket.off('donor_arrived');
          socket.disconnect();
        };
      }
    };

    initSocket();
  }, [currentCampId]);

  const getDonorIcon = (status) => {
    switch (status) {
      case 'en_route': return enRouteIcon;
      case 'arriving': return arrivingIcon;
      case 'at_camp': return atCampIcon;
      default: return liveDonorIcon;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Live Donor Tracking</h1>
              <p className="text-gray-600">Real-time donor locations heading to camps</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {trackingStatus === 'idle' ? (
                <button
                  onClick={startTracking}
                  disabled={!userLocation}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LocateIcon className="w-4 h-4" />
                  Start Tracking
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Stop Tracking
                </button>
              )}
              
              <button
                onClick={fetchLiveDonors}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Refresh
              </button>
            </div>
          </div>

          <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
            <MapContainer
              center={[27.7172, 85.324]} // Default to Nepal coordinates
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {userLocation && (
                <LocationMarker onLocationFound={handleLocationFound} />
              )}
              
              {liveDonors.map(donor => (
                <Marker
                  key={donor._id}
                  position={[
                    donor.liveLocation?.coordinates?.[1] || 0,
                    donor.liveLocation?.coordinates?.[0] || 0
                  ]}
                  icon={getDonorIcon(donor.liveStatus)}
                  eventHandlers={{
                    click: () => {
                      toast.success(`${donor.fullName} (${donor.bloodGroup}) - ${donor.liveStatus}`);
                    }
                  }}
                >
                  <Popup>
                    <div className="font-semibold">{donor.fullName}</div>
                    <div className="text-sm text-red-600">{donor.bloodGroup}</div>
                    <div className="text-xs mt-1 capitalize">{donor.liveStatus.replace('_', ' ')}</div>
                    {donor.lastLocationUpdate && (
                      <div className="text-xs text-gray-600 mt-1">
                        Updated: {new Date(donor.lastLocationUpdate).toLocaleTimeString()}
                      </div>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              Live Donors ({liveDonors.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveDonors.map(donor => (
                <div key={donor._id} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      donor.liveStatus === 'en_route' ? 'bg-orange-500' :
                      donor.liveStatus === 'arriving' ? 'bg-yellow-500' :
                      donor.liveStatus === 'at_camp' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">{donor.fullName}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div><User className="w-3 h-3 inline mr-1" /> {donor.bloodGroup}</div>
                    <div><MapPin className="w-3 h-3 inline mr-1" /> {donor.liveStatus.replace('_', ' ')}</div>
                    {donor.lastLocationUpdate && (
                      <div className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(donor.lastLocationUpdate).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {liveDonors.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No donors currently en route to this camp</p>
                  <p className="text-sm mt-1">Start tracking to see live locations</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}