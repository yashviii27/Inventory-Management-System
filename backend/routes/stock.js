const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Stock = require("../models/Stock");

// ✅ Get all stock records
router.get("/", auth, async (req, res, next) => {
  try {
    const stock = await Stock.find().populate("product").lean();

    const formatted = stock.map((s) => ({
      _id: s._id,
      productId: s.product?._id || s.productId,
      productName: s.product?.name || "Unknown",
      description: s.product?.description || "",
      openingStock: s.openingStock || 0,
      inward: s.inward || 0,
      outward: s.outward || 0,
      closingStock: s.closingStock || 0,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// ✅ Get available stock for a specific product (for sale form)
router.get("/product/:productId", auth, async (req, res, next) => {
  try {
    const stock = await Stock.findOne({ product: req.params.productId }).lean();

    if (!stock) {
      console.warn("⚠️ No stock found for product:", req.params.productId);
      return res.json({ success: true, available: 0 });
    }

    res.json({
      success: true,
      available: stock.closingStock ?? 0,
    });
  } catch (err) {
    console.error("🔥 Error fetching stock:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock",
      error: err.message,
    });
  }
});

module.exports = router;
