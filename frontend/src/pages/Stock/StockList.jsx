import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Layers,
  Loader2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from "lucide-react";

const StockList = () => {
  const [stockList, setStockList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Load Stock
  const loadStock = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stock");
      const data = res.data.data || [];
      setStockList(data);
      setFiltered(data);
    } catch (err) {
      console.error("Failed to load stock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  // ✅ Search filter
  useEffect(() => {
    const f = stockList.filter((s) =>
      s.productName?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(f);
  }, [search, stockList]);

  // ✅ Get stock status
  const getStockStatus = (qty) => {
    if (qty === 0)
      return {
        label: "Out of Stock",
        className: "bg-danger text-white",
        icon: <XCircle size={16} className="me-1" />,
      };
    if (qty <= 10)
      return {
        label: "Low Stock",
        className: "bg-warning text-dark",
        icon: <AlertTriangle size={16} className="me-1" />,
      };
    return {
      label: "In Stock",
      className: "bg-success text-white",
      icon: <CheckCircle2 size={16} className="me-1" />,
    };
  };

  return (
    <div className="d-flex justify-content-center mt-5">
      <div
        className="card shadow-lg border-0 fade-in"
        style={{
          borderRadius: "18px",
          width: "90%",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Header */}
        <div
          className="card-header text-white d-flex justify-content-between align-items-center"
          style={{
            background: "linear-gradient(90deg, #007bff, #0056b3)",
            borderTopLeftRadius: "18px",
            borderTopRightRadius: "18px",
            padding: "1.25rem 2rem",
          }}
        >
          <h3 className="mb-0 fw-semibold">
            <Layers size={26} className="me-2 mb-1" />
            Stock Overview
          </h3>
          <input
            type="text"
            placeholder="🔍 Search product..."
            className="form-control w-25 shadow-sm border-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderRadius: "25px" }}
          />
        </div>

        {/* Body */}
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5">
              <Loader2 size={40} className="text-primary mb-3 spin" />
              <p className="mt-2 text-muted fs-5">Loading stock data...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="table-responsive">
              <table
                className="table table-hover align-middle mb-0"
                style={{ fontSize: "1.05rem" }}
              >
                <thead className="table-light">
                  <tr>
                    <th>Product Name</th>
                    <th>Description</th>
                    <th>Opening Stock</th>
                    <th>Inward</th>
                    <th>Outward</th>
                    <th>Closing Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const status = getStockStatus(s.closingStock);
                    return (
                      <tr key={s._id}>
                        <td className="fw-semibold">{s.productName}</td>
                        <td>{s.description || "-"}</td>

                        <td>
                          <span className="badge bg-secondary px-3 py-2">
                            {s.openingStock}
                          </span>
                        </td>

                        <td>
                          <span className="badge bg-success px-3 py-2">
                            <ArrowDownCircle size={16} className="me-1" />
                            {s.inward}
                          </span>
                        </td>

                        <td>
                          <span className="badge bg-danger px-3 py-2">
                            <ArrowUpCircle size={16} className="me-1" />
                            {s.outward}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge px-3 py-2 ${
                              s.closingStock > 20
                                ? "bg-success"
                                : s.closingStock > 0
                                ? "bg-warning text-dark"
                                : "bg-danger"
                            }`}
                          >
                            {s.closingStock}
                          </span>
                        </td>

                        <td>
                          <span className={`badge ${status.className} px-3 py-2`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-box-seam display-6 d-block mb-3"></i>
              <p className="fs-5">No stock items found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Animations & Styling */}
      <style>{`
        .fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StockList;
