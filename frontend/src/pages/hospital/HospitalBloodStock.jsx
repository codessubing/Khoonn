import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Droplet, Plus, Minus, AlertTriangle, CheckCircle, Calendar, 
  RefreshCw, Loader2 
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const HospitalBloodStock = () => {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: 0,
    lowStock: 0,
    expiringSoon: 0,
    bloodTypes: 0
  });

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of relative paths
  const API_URL = `${API_BASE_URL}/api/hospital`;

  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const loadStock = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // ✅ FIXED: Absolute URL pointing to Render backend
      const res = await axios.get(`${API_URL}/blood/stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const stockData = res.data.data || [];
      setStock(stockData);
      calculateStats(stockData);
    } catch (err) {
      console.error("Load stock error:", err);
      toast.error(err.response?.data?.message || "Failed to load blood stock");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (stockData) => {
    const totalUnits = stockData.reduce((sum, item) => sum + item.quantity, 0);
    const lowStock = stockData.filter(item => item.quantity < 10).length;
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const expiringSoon = stockData.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= nextWeek && expiryDate > today;
    }).length;

    setStats({
      totalUnits,
      lowStock,
      expiringSoon,
      bloodTypes: stockData.length
    });
  };

  useEffect(() => {
    loadStock();
  }, []);

  const getBloodTypeColor = (bloodType) => {
    const map = {
      "O-": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      "O+": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      "A-": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      "A+": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      "B-": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
      "B+": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
      "AB-": "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
      "AB+": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
    };
    return map[bloodType] || "bg-muted text-muted-foreground border-border";
  };

  const getStockStatus = (quantity, expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    
    if (expiry <= today) {
      return { status: "Expired", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle };
    }
    
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 3) {
      return { status: "Critical", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle };
    } else if (daysUntilExpiry <= 7) {
      return { status: "Warning", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: AlertTriangle };
    } else if (quantity < 5) {
      return { status: "Low", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: AlertTriangle };
    } else {
      return { status: "Good", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", icon: CheckCircle };
    }
  };

  const getStockForType = (bloodType) => {
    return stock.find(item => item.bloodGroup === bloodType) || {
      bloodGroup: bloodType,
      quantity: 0,
      expiryDate: null
    };
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) <= new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading blood stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Droplet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Blood Stock Inventory
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and monitor your hospital's blood supply
              </p>
            </div>
          </div>
          <button onClick={loadStock} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Droplet className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total Units</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.totalUnits}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Blood Types</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.bloodTypes}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Low Stock</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.lowStock}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Calendar className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Expiring Soon</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.expiringSoon}</div>
          </div>
        </div>

        {/* Blood Type Grid */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Blood Type Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {bloodTypes.map((bloodType) => {
              const stockItem = getStockForType(bloodType);
              const status = getStockStatus(stockItem.quantity, stockItem.expiryDate);
              const StatusIcon = status.icon;
              const isExpiredItem = isExpired(stockItem.expiryDate);

              return (
                <div
                  key={bloodType}
                  className={`bg-card border border-border rounded-xl p-4 text-center transition-all hover:shadow-sm flex flex-col items-center justify-center ${
                    isExpiredItem ? 'opacity-60' : ''
                  }`}
                >
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border mb-3 ${getBloodTypeColor(bloodType)}`}>
                    {bloodType}
                  </span>
                  <div className="text-2xl font-bold tracking-tight text-foreground mb-2">
                    {stockItem.quantity}
                  </div>
                  <div className={`flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${status.color}`}>
                    <StatusIcon size={12} />
                    <span>{status.status}</span>
                  </div>
                  {stockItem.expiryDate && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {isExpiredItem ? 'Expired' : 'Expires'} {new Date(stockItem.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Stock Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Droplet className="w-5 h-5 text-primary" />
              Detailed Inventory
            </h2>
          </div>

          {stock.length === 0 ? (
            <div className="text-center py-12">
              <Droplet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No blood stock available</h3>
              <p className="text-sm text-muted-foreground mb-6">Request blood from blood labs to build your inventory</p>
              <button onClick={() => navigate('/hospital/request-blood')} className="btn-advanced">
                Request Blood
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blood Type</th>
                    <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                    <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiry Date</th>
                    <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Days Left</th>
                    <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stock.map((item) => {
                    const status = getStockStatus(item.quantity, item.expiryDate);
                    const StatusIcon = status.icon;
                    const today = new Date();
                    const expiryDate = new Date(item.expiryDate);
                    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    const isExpiredItem = isExpired(item.expiryDate);

                    return (
                      <tr 
                        key={item._id} 
                        className={`hover:bg-muted/50 transition-colors ${isExpiredItem ? 'bg-destructive/5' : ''}`}
                      >
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getBloodTypeColor(item.bloodGroup)}`}>
                            {item.bloodGroup}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-foreground">{item.quantity}</span>
                            <span className="text-xs text-muted-foreground">units</span>
                            {item.quantity < 5 && <Minus size={14} className="text-destructive" />}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${status.color}`}>
                            <StatusIcon size={12} />
                            {status.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-muted-foreground shrink-0" />
                            <span className={`text-sm ${isExpiredItem ? 'text-destructive font-medium' : 'text-foreground'}`}>
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-sm font-medium ${
                            daysLeft <= 0 ? 'text-destructive' :
                            daysLeft <= 3 ? 'text-destructive' :
                            daysLeft <= 7 ? 'text-amber-600 dark:text-amber-400' :
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} days`}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts Section */}
        {stock.some(item => {
          const status = getStockStatus(item.quantity, item.expiryDate);
          return status.status === 'Critical' || status.status === 'Expired' || item.quantity < 3;
        }) && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              Important Alerts
            </h3>
            <div className="space-y-3">
              {stock.map((item) => {
                const status = getStockStatus(item.quantity, item.expiryDate);
                const isExpiredItem = isExpired(item.expiryDate);
                
                if (status.status === 'Critical' || status.status === 'Expired' || item.quantity < 3) {
                  return (
                    <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card rounded-lg border border-destructive/20 gap-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={16} className="text-destructive shrink-0" />
                        <span className="font-medium text-foreground">{item.bloodGroup}</span>
                        <span className="text-sm text-muted-foreground">
                          {isExpiredItem ? 'Blood units have expired' :
                           status.status === 'Critical' ? 'Blood expiring within 3 days' :
                           'Very low stock level'}
                        </span>
                      </div>
                      <div className="text-sm text-destructive font-medium shrink-0">
                        {item.quantity} units • Expires {new Date(item.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Quick Actions & Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/hospital/request-blood')}
                className="btn-advanced w-full justify-center gap-2"
              >
                <Plus size={18} />
                Request More Blood
              </button>
              <button
                onClick={loadStock}
                className="btn-ghost w-full justify-center gap-2"
              >
                <RefreshCw size={18} />
                Refresh Inventory
              </button>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Stock Status Guide</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                <span className="text-foreground">Good: Adequate stock, not expiring soon</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-foreground">Low: Less than 5 units available</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-foreground">Warning: Expiring within 7 days</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-destructive shrink-0" />
                <span className="text-foreground">Critical: Expiring within 3 days</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-destructive shrink-0" />
                <span className="text-foreground">Expired: Blood units have expired</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalBloodStock;