import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";

const Suppliers = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
  });
  const [editingId, setEditingId] = useState(null);

  // Load suppliers
  const load = async () => {
    try {
      const res = await api.get("/suppliers");
      setList(res.data.data || []);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
      Swal.fire("Error!", "Failed to load suppliers!", "error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Add / Update Supplier
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, form);
        Swal.fire({
          icon: "success",
          title: "Supplier updated successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        await api.post("/suppliers", form);
        Swal.fire({
          icon: "success",
          title: "Supplier added successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
      }
      setForm({ name: "", contact: "", email: "", address: "" });
      setEditingId(null);
      load();
    } catch (err) {
      console.error("Failed to save supplier:", err);
      Swal.fire("Error!", "Something went wrong while saving supplier!", "error");
    }
  };

  // Edit Supplier
  const handleEdit = (s) => {
    setForm({
      name: s.name,
      contact: s.contact,
      email: s.email,
      address: s.address,
    });
    setEditingId(s._id);
  };

  // Delete Supplier (with confirmation)
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/suppliers/${id}`);
        Swal.fire({
          icon: "success",
          title: "Supplier deleted successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        load();
      } catch (err) {
        console.error("Failed to delete supplier:", err);
        Swal.fire("Error!", "Failed to delete supplier!", "error");
      }
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", contact: "", email: "", address: "" });
  };

  return (
    <div className="container mt-3">
      <h2>Suppliers</h2>

      {/* Add / Edit Supplier Form */}
      <form onSubmit={submit} className="mb-3 row g-2">
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Contact"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div className="col-12 mt-2">
          <button className="btn btn-primary me-2" type="submit">
            {editingId ? "Update Supplier" : "Add Supplier"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Supplier List Table */}
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Address</th>
            <th style={{ width: "150px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.length > 0 ? (
            list.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.contact || "-"}</td>
                <td>{s.email || "-"}</td>
                <td>{s.address || "-"}</td>
                <td>

                  
                  <button
                    className="btn btn-sm btn-secondary me-2"
                    onClick={() => handleEdit(s)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(s._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                No suppliers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Suppliers;
