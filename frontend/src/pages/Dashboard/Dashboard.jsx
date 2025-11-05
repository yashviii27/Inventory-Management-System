import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Package,
  ShoppingCart,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Loader2,
  DollarSign
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stockOverview, setStockOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Color schemes
//   const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  const STOCK_COLORS = {
    highStock: "#10b981",
    mediumStock: "#3b82f6",
    lowStock: "#f59e0b",
    outOfStock: "#ef4444"
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendRes, productsRes, stockRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/sales-trend?days=7"),
        api.get("/dashboard/top-products?limit=5"),
        api.get("/dashboard/stock-overview")
      ]);

      setStats(statsRes.data.data);
      setSalesTrend(trendRes.data.data);
      setTopProducts(productsRes.data.data);
      setStockOverview(stockRes.data.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <Loader2 size={48} className="text-primary mb-3" style={{ animation: "spin 1s linear infinite" }} />
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare pie chart data for stock
  const stockPieData = stockOverview ? [
    { name: "High Stock (>20)", value: stockOverview.highStock, color: STOCK_COLORS.highStock },
    { name: "Medium Stock (10-20)", value: stockOverview.mediumStock, color: STOCK_COLORS.mediumStock },
    { name: "Low Stock (<10)", value: stockOverview.lowStock, color: STOCK_COLORS.lowStock },
    { name: "Out of Stock", value: stockOverview.outOfStock, color: STOCK_COLORS.outOfStock }
  ] : [];

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4 fw-bold text-primary">📊 Dashboard</h2>

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        {/* Total Products */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="mb-1 opacity-75">Total Products</p>
                  <h3 className="fw-bold mb-0">{stats?.products?.total || 0}</h3>
                  <small className="opacity-75">
                    <AlertTriangle size={14} className="me-1" />
                    {stats?.products?.lowStock || 0} low stock
                  </small>
                </div>
                <Package size={48} className="opacity-75" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="mb-1 opacity-75">Total Sales</p>
                  <h3 className="fw-bold mb-0">{stats?.sales?.count || 0}</h3>
                  <small className="opacity-75">
                    <DollarSign size={14} className="me-1" />
                    ₹{(stats?.sales?.amount || 0).toFixed(2)}
                  </small>
                </div>
                <ShoppingCart size={48} className="opacity-75" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100" style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="mb-1 opacity-75">Total Purchases</p>
                  <h3 className="fw-bold mb-0">{stats?.purchases?.count || 0}</h3>
                  <small className="opacity-75">
                    <DollarSign size={14} className="me-1" />
                    ₹{(stats?.purchases?.amount || 0).toFixed(2)}
                  </small>
                </div>
                <ShoppingBag size={48} className="opacity-75" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100" style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="mb-1 opacity-75">Closing Stock</p>
                  <h3 className="fw-bold mb-0">{stats?.stock?.totalClosingStock || 0}</h3>
                  <small className="opacity-75">
                    <TrendingUp size={14} className="me-1" />
                    Profit: ₹{(stats?.profit || 0).toFixed(2)}
                  </small>
                </div>
                <Package size={48} className="opacity-75" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        {/* Sales Trend Chart */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0 fw-semibold">📈 Sales Trend (Last 7 Days)</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} name="Amount (₹)" />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} name="Count" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stock Distribution */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0 fw-semibold">📦 Stock Distribution</h5>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Stock Summary */}
      <div className="row g-4">
        {/* Top Selling Products */}
        <div className="col-md-7">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0 fw-semibold">🏆 Top Selling Products</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalQuantity" fill="#8884d8" name="Quantity Sold" />
                  <Bar dataKey="totalAmount" fill="#82ca9d" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stock Summary */}
        <div className="col-md-5">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0 fw-semibold">📊 Stock Summary</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center p-3 mb-3 rounded" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="fw-semibold">Opening Stock</span>
                <span className="badge bg-secondary fs-6">{stats?.stock?.totalOpeningStock || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 mb-3 rounded" style={{ backgroundColor: "#d1fae5" }}>
                <span className="fw-semibold text-success">Total Inward</span>
                <span className="badge bg-success fs-6">+{stats?.stock?.totalInward || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 mb-3 rounded" style={{ backgroundColor: "#fee2e2" }}>
                <span className="fw-semibold text-danger">Total Outward</span>
                <span className="badge bg-danger fs-6">-{stats?.stock?.totalOutward || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: "#dbeafe" }}>
                <span className="fw-semibold text-primary">Closing Stock</span>
                <span className="badge bg-primary fs-6">{stats?.stock?.totalClosingStock || 0}</span>
              </div>

              <hr className="my-4" />

              <div className="d-flex justify-content-between align-items-center p-3 mb-2 rounded" style={{ backgroundColor: "#fef3c7" }}>
                <span className="fw-semibold">
                  <AlertTriangle size={18} className="me-2 text-warning" />
                  Low Stock Items
                </span>
                <span className="badge bg-warning fs-6">{stats?.products?.lowStock || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: "#fee2e2" }}>
                <span className="fw-semibold">
                  <XCircle size={18} className="me-2 text-danger" />
                  Out of Stock
                </span>
                <span className="badge bg-danger fs-6">{stats?.products?.outOfStock || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

// Note: Make sure to also update InvoiceView.jsx to handle invoice response correctly