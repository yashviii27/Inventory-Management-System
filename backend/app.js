require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const invoiceRoutes = require("./routes/invoices");

const app = express();

// ✅ Prevent Mongoose from re-indexing on every startup
mongoose.set("autoIndex", false);

// ✅ Connect to MongoDB
connectDB();

// ✅ Import Product model
const Product = require("./models/Product");

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// ✅ One-time Index Check (safe + idempotent)
mongoose.connection.once("open", async () => {
  try {
    console.log("🔍 Checking Product indexes...");

    const indexes = await Product.collection.indexes();
    const hasNameIndex = indexes.find((idx) => idx.name === "name_1");

    if (hasNameIndex) {
      console.log("⚠️ Existing 'name_1' index found. Dropping...");
      await Product.collection.dropIndex("name_1");
    }

    // ✅ Only create if it doesn't already exist
    const hasCustomIndex = indexes.find(
      (idx) => idx.name === "product_name_unique"
    );
    if (!hasCustomIndex) {
      console.log("✅ Creating case-insensitive unique index on 'name'...");
      await Product.collection.createIndex(
        { name: 1 },
        {
          unique: true,
          name: "product_name_unique",
          collation: { locale: "en", strength: 2 },
        }
      );
      console.log("🎉 Product index created successfully!");
    } else {
      console.log("✅ 'product_name_unique' index already exists. Skipping...");
    }
  } catch (err) {
    console.error("❌ Error syncing Product indexes:", err.message);
  }
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/stock", require("./routes/stock"));
app.use("/api/purchases", require("./routes/purchases"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/suppliers", require("./routes/suppliers"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/invoices", invoiceRoutes);
app.use("/api/dashboard", require("./routes/dashboard"));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Server Error" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
