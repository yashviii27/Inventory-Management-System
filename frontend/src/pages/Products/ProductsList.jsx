import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import ProductForm from "./ProductForm";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Error loading products:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load products",
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the product.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/products/${id}`);
      Swal.fire({
        icon: "success",
        title: "Product deleted successfully!",
        confirmButtonColor: "#3085d6",
      });
      load();
    } catch (err) {
      console.error("Error deleting product:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete product",
      });
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-primary">📦 Products</h2>

      <ProductForm onSaved={load} editing={editing} setEditing={setEditing} />

      <div className="card shadow-sm mt-4">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price (₹)</th>
              <th>Available Stock</th>
              <th style={{ width: "180px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.description || "-"}</td>
                  <td>{p.price}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary me-2"
                      onClick={() => setEditing(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => remove(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsList;
