import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const Customers = () => {
  const [list, setList] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
  });
  const [editing, setEditing] = useState(null);

  // Load customers
  const load = async () => {
    try {
      const res = await api.get("/customers");
      setList(res.data.data || []);
    } catch (err) {
      console.error("Error loading customers:", err);
      Swal.fire("Error", "Failed to load customers", "error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit form (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/customers/${editing._id}`, formData);
        Swal.fire({
          icon: "success",
          title: "Customer updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditing(null);
      } else {
        await api.post("/customers", formData);
        Swal.fire({
          icon: "success",
          title: "Customer added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setFormData({ name: "", email: "", contact: "", address: "" });
      load();
    } catch (err) {
      console.error("Error saving customer:", err);
      Swal.fire("Error", err.response?.data?.message || "Error saving customer", "error");
    }
  };

  // Edit button
  const handleEdit = (customer) => {
    setEditing(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      contact: customer.contact || "",
      address: customer.address || "",
    });

    Swal.fire({
      icon: "info",
      title: "Editing Customer",
      text: `You are editing ${customer.name}`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Delete customer
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the customer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/customers/${id}`);
      Swal.fire({
        icon: "success",
        title: "Customer deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      load();
    } catch (err) {
      console.error("Error deleting customer:", err);
      Swal.fire("Error", "Failed to delete customer", "error");
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow p-4">
        <h3 className="mb-3 text-center">👥 Customers</h3>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-3 row g-2">
          <div className="col-md-3">
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              name="contact"
              placeholder="Contact"
              className="form-control"
              value={formData.contact}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              name="address"
              placeholder="Address"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-12 mt-2 text-center">
            <button type="submit" className="btn btn-primary">
              {editing ? "Update Customer" : "Add Customer"}
            </button>
          </div>
        </form>

        {/* Customers Table */}
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr className="text-center">
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Address</th>
              <th style={{ width: "160px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length > 0 ? (
              list.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.email || "-"}</td>
                  <td>{c.contact || "-"}</td>
                  <td>{c.address || "-"}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-secondary me-2"
                      onClick={() => handleEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(c._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
