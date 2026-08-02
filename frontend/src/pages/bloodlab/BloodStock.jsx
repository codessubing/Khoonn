import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Droplets, PlusCircle, MinusCircle, RefreshCw, AlertTriangle,
  Beaker, TrendingDown, Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const BloodStock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState("add");
  const [form, setForm] = useState({ bloodType: "", quantity: "" });

  const token = localStorage.getItem("token");
  // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
  const API_URL = `${API_BASE_URL}/api/blood-lab`;

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const fetchStock = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/blood/stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (data.success) {
        setStock(data.data || []);
      } else {
        toast.error("Failed to load blood stock");
      }
    } catch (error) {
      console.error("Fetch Stock Error:", error);
      toast.error(error.response?.data?.message || "Failed to load blood stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.bloodType || !form.quantity) {
      toast.error("Please fill all fields");
      return;
    }

    if (form.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = action === "add" ? "/blood/add" : "/blood/remove";
      const { data } = await axios.post(`${API_URL}${endpoint}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(data.message);
        setForm({ bloodType: "", quantity: "" });
        fetchStock();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Stock Update Error:", error);
      toast.error(
        error.response?.data?.message ||
          `Error ${action === "add" ? "adding" : "removing"} blood stock`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockItems = stock.filter((item) => item.quantity < 10);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Droplets className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Blood Stock Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your blood inventory and track stock levels
              </p>
            </div>
          </div>

          <button
            onClick={fetchStock}
            disabled={loading}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh Stock"}
          </button>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300">Low Stock Alert</p>
              <p className="text-amber-700/80 dark:text-amber-400/80 text-sm">
                {lowStockItems.length} blood type{lowStockItems.length > 1 ? "s" : ""} have low inventory
              </p>
            </div>
          </div>
        )}

        {/* Stock Management Form */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-primary" />
            {action === "add" ? "Add Blood Stock" : "Remove Blood Stock"}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Blood Type
              </label>
              <select
                value={form.bloodType}
                onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                className="input-minimal"
                required
              >
                <option value="">Select Blood Type</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Quantity (Units)
              </label>
              <input
                type="number"
                min="1"
                placeholder="0"
                className="input-minimal"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="input-minimal"
              >
                <option value="add">Add Stock</option>
                <option value="remove">Remove Stock</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius)] font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                  action === "remove"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : action === "add" ? (
                  <PlusCircle className="w-4 h-4" />
                ) : (
                  <MinusCircle className="w-4 h-4" />
                )}
                {submitting
                  ? "Processing..."
                  : action === "add"
                  ? "Add Units"
                  : "Remove Units"}
              </button>
            </div>
          </form>
        </div>

        {/* Blood Stock Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary" />
              Current Blood Inventory
            </h2>
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{stock.reduce((sum, item) => sum + item.quantity, 0)}</span> units
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Loading blood stock...</p>
            </div>
          ) : stock.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Droplets className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium">No blood stock available.</p>
              <p className="text-sm mt-1">Start by adding some blood units to your inventory.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Blood Type
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stock.map((item) => {
                    const isLowStock = item.quantity < 10;
                    const isCritical = item.quantity < 5;

                    return (
                      <tr key={item._id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <span className="font-semibold text-foreground">{item.bloodGroup}</span>
                        </td>
                        <td className="p-4">
                          <span className={`font-bold ${isCritical ? "text-destructive" : isLowStock ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                            {item.quantity} units
                          </span>
                        </td>
                        <td className="p-4">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                              <TrendingDown className="w-3 h-3" />
                              Critical
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                              Adequate
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(item.expiryDate).toLocaleDateString()}
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
      </div>
    </div>
  );
};

export default BloodStock;