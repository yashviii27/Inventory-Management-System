import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import CreateSale from "./CreateSale";
import InvoiceView from "../../components/Invoice/InvoiceView";
import { invoiceService } from "../../services/invoiceService";

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [editing, setEditing] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const fetchSales = async () => {
    try {
      const res = await api.get("/sales");
      setSales(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching sales:", err);
      Swal.fire("Error!", "Failed to load sales!", "error");
      setSales([]);
    }
  };

  const deleteSale = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This sale record will be permanently deleted and stock will be restored!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/sales/${id}`);
        Swal.fire({
          icon: "success",
          title: "Sale deleted successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        fetchSales();
      } catch (err) {
        console.error("Delete failed:", err);
        Swal.fire("Error!", "Failed to delete sale!", "error");
      }
    }
  };

  const handleViewInvoice = async (sale) => {
    try {
      setSelectedSale(sale);

      if (sale.invoice) {
        console.log("📄 Existing invoice ID:", sale.invoice);
        setSelectedInvoice(sale.invoice);
        setShowInvoiceModal(true);
      } else {
        setPaymentStatus("pending");
        setPaymentMethod("cash");
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error("Error handling invoice:", err);
      Swal.fire("Error!", "Failed to load invoice!", "error");
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      if (!selectedSale) return;

      const res = await invoiceService.generateInvoice(selectedSale._id, {
        paymentStatus,
        paymentMethod,
      });

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Invoice Generated!",
          text: "Invoice has been generated successfully!",
          showConfirmButton: false,
          timer: 1500,
        });

        const newInvoiceId =
          res.data.invoiceId || res.data.data?._id || res.data.data?.invoiceId;

        const invoiceIdString = String(newInvoiceId).trim();
        if (
          !invoiceIdString ||
          invoiceIdString === "undefined" ||
          invoiceIdString === "null"
        ) {
          throw new Error("Invalid invoice ID received from server");
        }

        setSelectedInvoice(invoiceIdString);
        setShowPaymentModal(false);
        setShowInvoiceModal(true);
        fetchSales();
      }
    } catch (err) {
      console.error("Error generating invoice:", err);
      Swal.fire("Error!", "Failed to generate invoice!", "error");
    }
  };

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
    setSelectedSale(null);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedSale(null);
  };

  const getCurrentInvoiceId = () => {
    if (selectedSale?.invoice) {
      console.log(
        "🔍 Using invoice ID from selectedSale:",
        selectedSale.invoice
      );
      return selectedSale.invoice;
    }

    if (selectedInvoice) {
      console.log("🔍 Using invoice ID from selectedInvoice:", selectedInvoice);
      return selectedInvoice;
    }

    console.log("❌ No valid invoice ID found");
    return null;
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <div className="container py-4">
      <CreateSale
        onSaved={fetchSales}
        editing={editing}
        setEditing={setEditing}
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal fade show d-block custom-modal-bg" tabIndex="-1">
          <div className="modal-dialog modal-md">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Set Payment Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleClosePaymentModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Payment Status
                  </label>
                  <select
                    className="form-select"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Payment Method
                  </label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank-transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="alert alert-info">
                  <small>
                    <i className="bi bi-info-circle me-2"></i>
                    These details will be included in the generated invoice and
                    can be updated later.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClosePaymentModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGenerateInvoice}
                >
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="modal fade show d-block custom-modal-bg" tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  Invoice{" "}
                  {selectedSale?.bill_no
                    ? `- Bill No: ${selectedSale.bill_no}`
                    : ""}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseInvoiceModal}
                ></button>
              </div>
              <div className="modal-body">
                <InvoiceView
                  invoiceId={getCurrentInvoiceId()}
                  onClose={handleCloseInvoiceModal}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales List Table */}
      <div className="card mt-4 shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Sales List</h5>
          <span className="badge bg-light text-dark">{sales.length} sales</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle table-bordered mb-0 sales-table">
            <thead className="table-light">
              <tr>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th className="text-end">Total (₹)</th>
                <th>Invoice</th>
                <th className="text-center" width="220px">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale._id}>
                    <td className="fw-bold">{sale.bill_no || "N/A"}</td>
                    <td>
                      {new Date(sale.date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>{sale.client_name || "Unknown Customer"}</td>
                    <td>
                      {Array.isArray(sale.details) &&
                      sale.details.length > 0 ? (
                        sale.details.map((d, i) => (
                          <div key={i} className="small text-muted">
                            {d.product?.name || "Unnamed"} × {d.quantity} = ₹
                            {(d.quantity * d.rate).toFixed(2)}
                          </div>
                        ))
                      ) : (
                        <em>No items</em>
                      )}
                    </td>
                    <td className="fw-semibold text-end">
                      {Array.isArray(sale.details)
                        ? sale.details
                            .reduce(
                              (sum, d) =>
                                sum + (d.quantity || 0) * (d.rate || 0),
                              0
                            )
                            .toFixed(2)
                        : "0.00"}
                    </td>
                    <td>
                      {sale.invoice ? (
                        <span className="badge bg-success">Generated</span>
                      ) : (
                        <span className="badge bg-secondary">Pending</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="action-buttons d-flex justify-content-center gap-2">
                        <button
                          className="action-btn view"
                          onClick={() => handleViewInvoice(sale)}
                          title="View Invoice"
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => setEditing(sale)}
                          title="Edit Sale"
                        >
                          <i className="bi bi-pencil-square"></i> Edit
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => deleteSale(sale._id)}
                          title="Delete Sale"
                        >
                          <i className="bi bi-trash3"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-3">
                    No sales found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal CSS Styles */}
      <style>{`
        .sales-table th,
        .sales-table td {
          vertical-align: middle !important;
          padding: 12px 14px;
        }

        .sales-table th {
          background-color: #f8f9fa;
          font-weight: 600;
        }

        .sales-table tbody tr:hover {
          background-color: #f3f7ff;
          transition: 0.2s;
        }

        .sales-table .badge {
          font-size: 0.8rem;
          padding: 6px 10px;
        }

        .custom-modal-bg {
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(2px);
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .action-btn {
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          color: #fff;
        }

        .action-btn i {
          font-size: 1rem;
        }

        .action-btn.view {
          background: linear-gradient(135deg, #0dcaf0, #0d6efd);
        }

        .action-btn.view:hover {
          background: linear-gradient(135deg, #0d6efd, #0a58ca);
          transform: translateY(-2px);
        }

        .action-btn.edit {
          background: linear-gradient(135deg, #ffc107, #ffcd39);
          color: #000;
        }

        .action-btn.edit:hover {
          background: linear-gradient(135deg, #ffca2c, #ffb300);
          transform: translateY(-2px);
        }

        .action-btn.delete {
          background: linear-gradient(135deg, #dc3545, #b02a37);
        }

        .action-btn.delete:hover {
          background: linear-gradient(135deg, #b02a37, #a71d2a);
          transform: translateY(-2px);
        }

        .fw-semibold {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default SalesList;
