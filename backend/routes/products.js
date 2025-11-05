const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Stock = require("../models/Stock");

// ✅ GET all products (joined with stock)
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();

    const stockData = await Stock.find().lean();
    const productsWithStock = products.map((p) => {
      const stockItem = stockData.find(
        (s) => s.product.toString() === p._id.toString()
      );
      return {
        ...p,
        stock: stockItem ? stockItem.closingStock : p.stock || 0,
      };
    });

    res.json({ success: true, data: productsWithStock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ ADD new product (and auto-create stock record)
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, price, initialStock } = req.body;

    if (!name || !price) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // prevent duplicate names (case-insensitive)
    const existing = await Product.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Product already exists" });
    }

    const openingStock = Number(initialStock) || 0;

    // Create product
    const product = await Product.create({
      name,
      description,
      price,
      stock: openingStock,
    });

    // ✅ Create stock entry with opening stock
    await Stock.create({
      product: product._id,
      openingStock: openingStock,
      inward: 0,
      outward: 0,
      closingStock: openingStock,
    });

    res.json({ success: true, data: product });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ UPDATE product (sync with stock table)
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    const updatedStock = Number(stock) || 0;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, stock: updatedStock },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // ✅ Sync with Stock table
    const existingStock = await Stock.findOne({ product: req.params.id });
    if (existingStock) {
      // Calculate the difference
      const difference = updatedStock - existingStock.closingStock;

      existingStock.closingStock = updatedStock;

      // If manually adjusting stock, update opening stock too
      existingStock.openingStock =
        updatedStock - existingStock.inward + existingStock.outward;

      await existingStock.save();
    } else {
      // Create stock record if doesn't exist
      await Stock.create({
        product: req.params.id,
        openingStock: updatedStock,
        inward: 0,
        outward: 0,
        closingStock: updatedStock,
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ DELETE product
router.delete("/:id", auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await Stock.deleteOne({ product: req.params.id }); // clean up stock too
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
