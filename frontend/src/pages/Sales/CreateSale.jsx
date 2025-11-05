import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";

const CreateSale = ({ onSaved, editing, setEditing }) => {
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // Default to today
  const [details, setDetails] = useState([
    { product: "", quantity: 1, rate: 0, available: 0 },
  ]);

  // ✅ Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        if (res.data.success) setProducts(res.data.data);
      } catch (err) {
        console.error("Error fetching products:", err);
        Swal.fire("Error!", "Failed to load products!", "error");
      }
    };
    fetchProducts();
  }, []);

  // ✅ Prefill form when editing
  useEffect(() => {
    if (editing) {
      setCustomer(editing.client_name || "");
      setSaleDate(
        editing.date
          ? new Date(editing.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setDetails(
        editing.details.map((d) => ({
          product: d.product?._id || "",
          quantity: d.quantity,
          rate: d.rate,
          available: 0,
        }))
      );
    }
  }, [editing]);

  // ✅ Fetch available stock when product changes
  const handleProductChange = async (index, productId) => {
    const updated = [...details];
    updated[index].product = productId;

    const selected = products.find((p) => p._id === productId);
    updated[index].rate = selected ? selected.price : 0;

    try {
      const res = await api.get(`/stock/product/${productId}`);
      updated[index].available = res.data.available ?? 0;
    } catch (err) {
      console.error("Error fetching available stock:", err);
      updated[index].available = 0;
    }

    setDetails(updated);
  };

  // ✅ Handle quantity & rate
  const handleDetailChange = (index, field, value) => {
    const updated = [...details];
    updated[index][field] = field === "quantity" ? Number(value) : value;
    setDetails(updated);
  };

  // ✅ Add / remove row
  const addRow = () =>
    setDetails([
      ...details,
      { product: "", quantity: 1, rate: 0, available: 0 },
    ]);
  const removeRow = (i) => setDetails(details.filter((_, idx) => idx !== i));

  // ✅ Submit Sale (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer.trim()) {
      Swal.fire("Error!", "Please enter a customer name.", "error");
      return;
    }

    if (!saleDate) {
      Swal.fire("Error!", "Please select a date.", "error");
      return;
    }

    if (details.some((d) => !d.product || d.quantity <= 0)) {
      Swal.fire(
        "Error!",
        "Please select valid products and quantities.",
        "error"
      );
      return;
    }

    // 🚫 Prevent overselling
    for (const d of details) {
      if (d.quantity > d.available) {
        const product = products.find((p) => p._id === d.product);
        Swal.fire(
          "Warning",
          `Not enough stock for "${product?.name || "Product"}" (Available: ${
            d.available
          })`,
          "warning"
        );
        return;
      }
    }

    const saleData = {
      date: saleDate,
      client_name: customer,
      details: details.map((d) => ({
        product: d.product,
        quantity: d.quantity,
        rate: d.rate,
      })),
    };

    try {
      if (editing) {
        await api.put(`/sales/${editing._id}`, saleData);
        Swal.fire({
          icon: "success",
          title: "Sale updated successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        setEditing(null);
      } else {
        await api.post("/sales", saleData);
        Swal.fire({
          icon: "success",
          title: "Sale created successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
      }

      setCustomer("");
      setSaleDate(new Date().toISOString().split("T")[0]);
      setDetails([{ product: "", quantity: 1, rate: 0, available: 0 }]);
      if (onSaved) onSaved();
    } catch (err) {
      console.error("Error saving sale:", err);
      const msg =
        err.response?.data?.message ||
        "Something went wrong while saving sale!";
      Swal.fire("Error!", msg, "error");
    }
  };

  const cancelEdit = async () => {
    const confirm = await Swal.fire({
      title: "Cancel editing?",
      text: "Unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel",
    });

    if (confirm.isConfirmed) {
      setEditing(null);
      setCustomer("");
      setSaleDate(new Date().toISOString().split("T")[0]);
      setDetails([{ product: "", quantity: 1, rate: 0, available: 0 }]);
    }
  };

  const totalAmount = details.reduce((sum, d) => sum + d.quantity * d.rate, 0);

  return (
    <div className="card p-3 shadow-sm mb-4">
      <h5>{editing ? "Edit Sale" : "Create Sale"}</h5>
      <form onSubmit={handleSubmit}>
        <div className="row mb-3">
          {/* Customer */}
          <div className="col-md-6">
            <label>Customer *</label>
            <input
              type="text"
              className="form-control"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
            />
          </div>

          {/* Sale Date */}
          <div className="col-md-6">
            <label>Sale Date *</label>
            <input
              type="date"
              className="form-control"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Product Table */}
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th>Available</th>
              <th width="120px">Quantity</th>
              <th width="120px">Rate</th>
              <th width="120px">Amount</th>
              <th width="80px">Action</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d, i) => (
              <tr key={i}>
                <td>
                  <select
                    className="form-select"
                    value={d.product}
                    onChange={(e) => handleProductChange(i, e.target.value)}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className="badge bg-info">{d.available ?? 0}</span>
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    value={d.quantity}
                    min="1"
                    onChange={(e) =>
                      handleDetailChange(i, "quantity", e.target.value)
                    }
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    value={d.rate}
                    readOnly
                  />
                </td>
                <td>₹{(d.quantity * d.rate).toFixed(2)}</td>
                <td>
                  {details.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeRow(i)}
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={addRow}
          >
            + Add Item
          </button>
          <h6>Total: ₹{totalAmount.toFixed(2)}</h6>
          <div>
            {editing && (
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-success">
              {editing ? "Update Sale" : "Save Sale"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateSale;
