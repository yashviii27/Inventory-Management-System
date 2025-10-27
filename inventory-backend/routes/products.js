const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Stock = require("../models/Stock");

// Create product
router.post("/", auth, async (req, res, next) => {
  try {
    const { name, description, price, initialStock } = req.body;
    if (!name || price == null)
      return res
        .status(400)
        .json({ success: false, message: "Missing name or price" });

    const product = new Product({ name, description, price });
    await product.save();

    const stock = new Stock({
      product: product._id,
      quantity: initialStock || 0,
    });
    await stock.save();

    res.json({ success: true, product, stock });
  } catch (err) {
    next(err);
  }
});

// Get all products with stock
router.get("/", auth, async (req, res, next) => {
  try {
    const products = await Product.find().lean();
    const stocks = await Stock.find().lean();
    const stockMap = Object.fromEntries(
      stocks.map((s) => [s.product.toString(), s.quantity])
    );
    const list = products.map((p) => ({
      ...p,
      stock: stockMap[p._id.toString()] ?? 0,
    }));
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// Update product (including stock)
router.put("/:id", auth, async (req, res, next) => {
  try {
    const { name, description, price, stock } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price },
      { new: true }
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (stock != null) {
      const stockDoc = await Stock.findOne({ product: req.params.id });
      if (stockDoc) {
        stockDoc.quantity = stock;
        await stockDoc.save();
      } else {
        await Stock.create({ product: req.params.id, quantity: stock });
      }
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// Delete product (and its stock)
router.delete("/:id", auth, async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await Stock.findOneAndDelete({ product: req.params.id });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
