import React, { useState } from "react";
import api from "../../api/axios";
import { FileDown, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const Reports = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSales = async () => {
    if (!from || !to)
      return Swal.fire("Missing Dates", "Please select both From and To dates", "warning");

    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reports/sales?from=${from}&to=${to}`);
      if (res.data.success) {
        setSales(res.data.data || []);
        Swal.fire("Success!", "Sales data loaded successfully!", "success");
      } else {
        setError("Failed to load sales data");
        Swal.fire("Error!", "Failed to load sales data!", "error");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      Swal.fire("Error!", "Something went wrong while loading sales data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    if (!from || !to)
      return Swal.fire("Missing Dates", "Please select both From and To dates", "warning");

    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reports/purchases?from=${from}&to=${to}`);
      if (res.data.success) {
        setPurchases(res.data.data || []);
        Swal.fire("Success!", "Purchase data loaded successfully!", "success");
      } else {
        setError("Failed to load purchase data");
        Swal.fire("Error!", "Failed to load purchase data!", "error");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      Swal.fire("Error!", "Something went wrong while loading purchase data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async (type) => {
    if (!from || !to)
      return Swal.fire("Missing Dates", "Please select both From and To dates", "warning");

    Swal.fire({
      title: "Exporting...",
      text: `Generating ${type} report CSV...`,
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await api.get(`/reports/export?type=${type}&from=${from}&to=${to}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      Swal.fire("Success!", `${type} report downloaded successfully.`, "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to export CSV.", "error");
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow p-4">
        <h3 className="mb-3 text-center">📊 Reports</h3>

        {/* Date Filter */}
        <div className="d-flex gap-2 mb-4">From Date:
          <input
            type="date"
            className="form-control"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />To Date:
          <input 
            type="date"
            className="form-control"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="btn-group mb-3 w-100">
          <button
            className={`btn ${activeTab === "sales" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveTab("sales")}
          >
            Sales Reports
          </button>
          <button
            className={`btn ${activeTab === "purchases" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveTab("purchases")}
          >
            Purchase Reports
          </button>
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 justify-content-center mb-4">
          {activeTab === "sales" ? (
            <>
              <button className="btn btn-success" onClick={loadSales} disabled={loading}>
                {loading ? <Loader2 className="spin" size={16} /> : "Load Sales"}
              </button>
              <button
                className="btn btn-outline-success"
                onClick={() => exportCSV("sales")}
              >
                <FileDown size={16} /> Export Sales CSV
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-info" onClick={loadPurchases} disabled={loading}>
                {loading ? <Loader2 className="spin" size={16} /> : "Load Purchases"}
              </button>
              <button
                className="btn btn-outline-info"
                onClick={() => exportCSV("purchases")}
              >
                <FileDown size={16} /> Export Purchases CSV
              </button>
            </>
          )}
        </div>

        {error && <div className="alert alert-danger text-center">{error}</div>}

        {/* Report Table */}
        <div>
          {activeTab === "sales" && (
            <>
              {sales.length === 0 && !loading ? (
                <p className="text-center text-muted">No sales data found</p>
              ) : (
                sales.map((row) => (
                  <div key={row.master._id} className="card mb-3 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="fw-bold">
                        {row.master.client_name} —{" "}
                        {new Date(row.master.date).toLocaleString()} — ₹{row.master.amount}
                      </div>
                      <ul className="mt-2">
                        {row.details.map((d) => (
                          <li key={d._id}>
                            {d.product?.name || "Unknown"} — Qty: {d.quantity} — ₹{d.amount}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "purchases" && (
            <>
              {purchases.length === 0 && !loading ? (
                <p className="text-center text-muted">No purchase data found</p>
              ) : (
                purchases.map((row) => (
                  <div key={row.master._id} className="card mb-3 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="fw-bold">
                        {row.master.supplier_name} —{" "}
                        {new Date(row.master.date).toLocaleString()} — ₹{row.master.amount}
                      </div>
                      <ul className="mt-2">
                        {row.details.map((d) => (
                          <li key={d._id}>
                            {d.product?.name || "Unknown"} — Qty: {d.quantity} — ₹{d.amount}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Small CSS tweak */}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Reports;
