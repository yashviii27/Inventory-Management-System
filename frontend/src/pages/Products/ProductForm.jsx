import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const ProductForm = ({ onSaved, editing, setEditing }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  useEffect(() => {
    if (editing) {
      setFormData({
        name: editing?.name || "",
        description: editing?.description || "",
        price: editing?.price || "",
        stock: editing?.stock || 0,
      });
    } else {
      setFormData({ name: "", description: "", price: "", stock: "" });
    }
  }, [editing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.put(`/products/${editing._id}`, formData);
        Swal.fire({
          icon: "success",
          title: "Product updated successfully!",
          confirmButtonColor: "#3085d6",
        });
        setEditing(null);
      } else {
        await api.post("/products", {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          initialStock: formData.stock,
        });
        Swal.fire({
          icon: "success",
          title: "Product added successfully!",
          confirmButtonColor: "#3085d6",
        });
      }

      onSaved();
      setFormData({ name: "", description: "", price: "", stock: "" });
    } catch (err) {
      console.error("Error saving product:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to save product",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-3 mb-3 shadow-sm">
      <div className="row g-2 align-items-center">
        <div className="col-md-3">
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-3">
          <input
            type="text"
            name="description"
            placeholder="Description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-2">
          <input
            type="number"
            name="price"
            placeholder="Price"
            className="form-control"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-2">
          <input
            type="number"
            name="stock"
            placeholder="Opening Stock"
            className="form-control"
            value={formData.stock}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-2">
          <button type="submit" className="btn btn-primary w-100">
            {editing ? "Update Product" : "Add Product"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
