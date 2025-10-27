const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Stock = require("../models/Stock");
const Product = require("../models/Product");

// Get all stock
router.get("/", auth, async (req, res, next) => {
  try {
    const stock = await Stock.find().populate("product").lean();
    res.json({ success: true, data: stock });
  } catch (err) {
    next(err);
  }
});

// Get stock by product ID
router.get("/:productId", auth, async (req, res, next) => {
  try {
    const s = await Stock.findOne({ product: req.params.productId })
      .populate("product")
      .lean();
    if (!s)
      return res
        .status(404)
        .json({ success: false, message: "Stock not found" });
    res.json({ success: true, data: s });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
