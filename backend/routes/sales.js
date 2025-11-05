// routes/sales.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const SalesMaster = require("../models/SalesMaster");
const SalesDetail = require("../models/SalesDetail");
const Product = require("../models/Product");
const Stock = require("../models/Stock");

// ✅ CREATE SALE (with Bill No auto-generation, stock validation, and date)
router.post("/", auth, async (req, res) => {
  try {
    const { client_name, details, date } = req.body;

    if (!client_name || !details || details.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid sale data" });
    }

    // ✅ STEP 1: Validate stock for each product
    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      const product = await Product.findById(d.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found for item ${i + 1}`,
        });
      }

      const stock = await Stock.findOne({ product: d.product });
      const availableQty = stock?.closingStock ?? 0;

      if (availableQty < d.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${availableQty}, Required: ${d.quantity}`,
        });
      }
    }

    // ✅ STEP 2: Create master sale (Bill No will be auto-generated)
    const totalAmount = details.reduce(
      (sum, d) => sum + d.quantity * d.rate,
      0
    );

    const master = await SalesMaster.create({
      client_name,
      date: date ? new Date(date) : new Date(),
      amount: totalAmount,
    });

    // ✅ STEP 3: Create details & update stock
    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      const product = await Product.findById(d.product);

      await SalesDetail.create({
        sales_master: master._id,
        sr_no: i + 1,
        product: product._id,
        quantity: d.quantity,
        rate: d.rate,
        amount: d.quantity * d.rate,
      });

      // ✅ Update stock (reduce outward)
      let stock = await Stock.findOne({ product: product._id });
      if (stock) {
        stock.outward += d.quantity;
        stock.closingStock = stock.openingStock + stock.inward - stock.outward;
        await stock.save();
      } else {
        await Stock.create({
          product: product._id,
          productName: product.name,
          description: product.description || "",
          openingStock: 0,
          inward: 0,
          outward: d.quantity,
          closingStock: -d.quantity,
        });
      }

      // ✅ Update product stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -d.quantity },
      });
    }

    // ✅ Return Bill No to frontend
    res.json({
      success: true,
      message: "Sale recorded successfully!",
      bill_no: master.bill_no,
    });
  } catch (err) {
    console.error("🔥 Error creating sale:", err);
    res.status(500).json({
      success: false,
      message: "Failed to record sale",
      error: err.message,
    });
  }
});

// ✅ GET ALL SALES (with details & Bill No)
router.get("/", auth, async (req, res) => {
  try {
    const sales = await SalesMaster.find()
      .populate("invoice")
      .sort({ date: -1 })
      .lean();

    const salesWithDetails = await Promise.all(
      sales.map(async (s) => {
        const details = await SalesDetail.find({ sales_master: s._id })
          .populate("product", "name")
          .lean();
        return { ...s, details };
      })
    );

    res.json({ success: true, data: salesWithDetails });
  } catch (err) {
    console.error("🔥 Error fetching sales:", err);
    res.status(500).json({ success: false, message: "Failed to load sales" });
  }
});

// ✅ UPDATE SALE (with stock rollback and reapply)
router.put("/:id", auth, async (req, res) => {
  try {
    const { client_name, details, date } = req.body;
    const saleId = req.params.id;

    const sale = await SalesMaster.findById(saleId);
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    // Rollback old stock
    const oldDetails = await SalesDetail.find({ sales_master: saleId });
    for (const d of oldDetails) {
      const stock = await Stock.findOne({ product: d.product });
      const product = await Product.findById(d.product);

      if (stock) {
        stock.outward = Math.max(0, stock.outward - d.quantity);
        stock.closingStock = stock.openingStock + stock.inward - stock.outward;
        await stock.save();
      }

      if (product) {
        await Product.findByIdAndUpdate(product._id, {
          $inc: { stock: d.quantity },
        });
      }
    }

    // Validate new stock
    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      const product = await Product.findById(d.product);
      const stock = await Stock.findOne({ product: d.product });
      const availableQty = stock?.closingStock ?? 0;

      if (availableQty < d.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${availableQty}, Required: ${d.quantity}`,
        });
      }
    }

    // Update master
    const totalAmount = details.reduce(
      (sum, d) => sum + d.quantity * d.rate,
      0
    );
    sale.client_name = client_name;
    sale.date = date ? new Date(date) : sale.date;
    sale.amount = totalAmount;
    await sale.save();

    // Replace details
    await SalesDetail.deleteMany({ sales_master: saleId });

    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      const product = await Product.findById(d.product);

      await SalesDetail.create({
        sales_master: saleId,
        sr_no: i + 1,
        product: product._id,
        quantity: d.quantity,
        rate: d.rate,
        amount: d.quantity * d.rate,
      });

      // Update stock again
      let stock = await Stock.findOne({ product: product._id });
      if (stock) {
        stock.outward += d.quantity;
        stock.closingStock = stock.openingStock + stock.inward - stock.outward;
        await stock.save();
      }

      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -d.quantity },
      });
    }

    res.json({
      success: true,
      message: "Sale updated successfully!",
      bill_no: sale.bill_no,
    });
  } catch (err) {
    console.error("🔥 Error updating sale:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update sale",
      error: err.message,
    });
  }
});

// ✅ DELETE SALE (rollback stock + remove details)
router.delete("/:id", auth, async (req, res) => {
  try {
    const sale = await SalesMaster.findById(req.params.id);
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    const details = await SalesDetail.find({ sales_master: sale._id });

    for (const d of details) {
      const stock = await Stock.findOne({ product: d.product });
      const product = await Product.findById(d.product);

      if (stock) {
        stock.outward = Math.max(0, stock.outward - d.quantity);
        stock.closingStock = stock.openingStock + stock.inward - stock.outward;
        await stock.save();
      }

      if (product) {
        await Product.findByIdAndUpdate(product._id, {
          $inc: { stock: d.quantity },
        });
      }
    }

    await SalesDetail.deleteMany({ sales_master: sale._id });
    await sale.deleteOne();

    res.json({ success: true, message: "Sale deleted successfully!" });
  } catch (err) {
    console.error("🔥 Error deleting sale:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete sale",
      error: err.message,
    });
  }
});

module.exports = router;
