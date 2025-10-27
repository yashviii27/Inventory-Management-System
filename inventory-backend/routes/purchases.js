const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const PurchaseMaster = require("../models/PurchaseMaster");
const PurchaseDetail = require("../models/PurchaseDetail");
const Stock = require("../models/Stock");
const Product = require("../models/Product");

// Get all purchases with details
router.get("/", auth, async (req, res, next) => {
  try {
    const masters = await PurchaseMaster.find().sort({ date: -1 }).lean();
    const results = [];
    for (const m of masters) {
      const details = await PurchaseDetail.find({ purchase_master: m._id })
        .populate("product")
        .lean();
      results.push({ master: m, details });
    }
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

// Create purchase with details
router.post("/", auth, async (req, res, next) => {
  try {
    const { client_name, details } = req.body;
    if (!client_name || !details || !details.length)
      return res.status(400).json({ success: false, message: "Missing data" });

    const amount = details.reduce((sum, d) => sum + d.quantity * d.rate, 0);

    const master = await PurchaseMaster.create({ client_name, amount });

    for (const d of details) {
      const product = await Product.findById(d.product);
      if (!product)
        return res
          .status(400)
          .json({ success: false, message: "Invalid product" });

      await PurchaseDetail.create({
        purchase_master: master._id,
        sr_no: d.sr_no,
        product: d.product,
        quantity: d.quantity,
        rate: d.rate,
        amount: d.quantity * d.rate,
      });

      // Update stock
      await Stock.findOneAndUpdate(
        { product: d.product },
        { $inc: { quantity: d.quantity } },
        { upsert: true }
      );
    }

    res.status(201).json({ success: true, data: master });
  } catch (err) {
    next(err);
  }
});

// Update purchase (master + details)
router.put("/:id", auth, async (req, res, next) => {
  try {
    const { client_name, details } = req.body;
    const master = await PurchaseMaster.findById(req.params.id);
    if (!master)
      return res.status(404).json({ success: false, message: "Not found" });

    // First, revert stock for old details
    const oldDetails = await PurchaseDetail.find({
      purchase_master: master._id,
    });
    for (const d of oldDetails) {
      await Stock.findOneAndUpdate(
        { product: d.product },
        { $inc: { quantity: -d.quantity } }
      );
    }

    // Delete old details
    await PurchaseDetail.deleteMany({ purchase_master: master._id });

    // Save new details
    let totalAmount = 0;
    for (const d of details) {
      totalAmount += d.quantity * d.rate;
      await PurchaseDetail.create({
        purchase_master: master._id,
        sr_no: d.sr_no,
        product: d.product,
        quantity: d.quantity,
        rate: d.rate,
        amount: d.quantity * d.rate,
      });

      await Stock.findOneAndUpdate(
        { product: d.product },
        { $inc: { quantity: d.quantity } },
        { upsert: true }
      );
    }

    // Update master
    master.client_name = client_name;
    master.amount = totalAmount;
    await master.save();

    res.json({ success: true, data: master });
  } catch (err) {
    next(err);
  }
});

// Delete purchase
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const master = await PurchaseMaster.findById(req.params.id);
    if (!master)
      return res.status(404).json({ success: false, message: "Not found" });

    const details = await PurchaseDetail.find({ purchase_master: master._id });
    for (const d of details) {
      await Stock.findOneAndUpdate(
        { product: d.product },
        { $inc: { quantity: -d.quantity } }
      );
    }

    await PurchaseDetail.deleteMany({ purchase_master: master._id });
    await master.deleteOne();

    res.json({ success: true, message: "Purchase deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
