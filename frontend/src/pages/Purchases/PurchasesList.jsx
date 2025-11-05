import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import CreatePurchase from "./CreatePurchase";

const PurchasesList = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/purchases");
      const list = Array.isArray(res.data)
        ? res.data
        : res.data.data || res.data.purchases || [];
      setPurchases(list);
    } catch (err) {
      console.error("Failed to load purchases:", err);
      Swal.fire("Error", "Failed to load purchases", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the purchase record and rollback stock.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/purchases/${id}`);
      Swal.fire({
        icon: "success",
        title: "Purchase deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      load();
    } catch (err) {
      console.error("Failed to delete purchase:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to delete purchase", "error");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-primary mb-4">🧾 Purchases</h2>

      {/* ✅ Always show Purchase Form */}
      <CreatePurchase onSaved={load} />

      {/* ✅ Purchases List */}
      {loading ? (
        <div className="text-center mt-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : purchases.length === 0 ? (
        <p className="mt-4 text-muted text-center">No purchases found.</p>
      ) : (
        purchases.map((p) => {
          const master = p.master || {};
          const details = p.details || [];
          const supplierName =
            master.supplierName || master.supplier_name || "N/A";
          const date = master.date
            ? new Date(master.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : "N/A";
          const amount = Number(master.totalAmount || master.amount || 0);

          return (
            <div key={master._id || Math.random()} className="card mb-4 shadow-sm">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">{supplierName}</h5>
                  <small className="text-muted">
                    Bill No: {master.billNo || "N/A"} | Date: {date}
                  </small>
                </div>
                <div>
                  <span className="badge bg-success fs-6 me-3">
                    Total: ₹{amount.toFixed(2)}
                  </span>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => remove(master._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="card-body p-0">
                <table className="table table-hover table-striped mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-3">
                          No products in this purchase
                        </td>
                      </tr>
                    ) : (
                      details.map((d) => (
                        <tr key={d._id || Math.random()}>
                          <td>{d.product?.name || d.productName || "-"}</td>
                          <td>{d.quantity ?? 0}</td>
                          <td>₹{Number(d.rate || 0).toFixed(2)}</td>
                          <td>₹{Number(d.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PurchasesList;