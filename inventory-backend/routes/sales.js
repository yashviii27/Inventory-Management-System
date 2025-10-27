const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const SalesMaster = require("../models/SalesMaster");
const SalesDetail = require("../models/SalesDetail");
const Stock = require("../models/Stock");

// ==================== CREATE SALE ====================
router.post("/", auth, async (req, res, next) => {
  try {
    const { client_name, details } = req.body;
    if (!client_name || !Array.isArray(details) || details.length === 0)
      return res.status(400).json({ success: false, message: "Invalid data" });

    // Calculate total
    const total = details.reduce(
      (sum, d) => sum + Number(d.quantity) * Number(d.rate),
      0
    );

    // Create master record
    const master = await SalesMaster.create({
      date: new Date(),
      client_name,
      amount: total,
    });

    // Create detail records and update stock
    let sr_no = 1;
    for (const d of details) {
      const amount = Number(d.quantity) * Number(d.rate);

      await SalesDetail.create({
        sales_master: master._id,
        sr_no: sr_no++,
        product: d.product,
        quantity: Number(d.quantity),
        rate: Number(d.rate),
        amount,
      });

      // Decrease stock
      await Stock.findOneAndUpdate(
        { product: d.product },
        { $inc: { quantity: -Number(d.quantity) } },
        { upsert: true }
      );
    }

    res.json({ success: true, data: master });
  } catch (err) {
    next(err);
  }
});

// ==================== LIST SALES WITH DETAILS ====================
router.get("/", auth, async (req, res, next) => {
  try {
    const sales = await SalesMaster.find().sort({ date: -1 }).lean();

    const salesWithDetails = await Promise.all(
      sales.map(async (master) => {
        const details = await SalesDetail.find({ sales_master: master._id })
          .populate("product")
          .lean();
        return { ...master, details };
      })
    );

    res.json({ success: true, data: salesWithDetails });
  } catch (err) {
    next(err);
  }
});

// ==================== GET SALE DETAILS ====================
router.get("/:id/details", auth, async (req, res, next) => {
  try {
    const details = await SalesDetail.find({ sales_master: req.params.id })
      .populate("product")
      .lean();
    res.json({ success: true, data: details });
  } catch (err) {
    next(err);
  }
});

// ==================== UPDATE SALE ====================
router.put("/:id", auth, async (req, res, next) => {
  try {
    const { client_name, details } = req.body;

    const master = await SalesMaster.findById(req.params.id);
    if (!master)
      return res.status(404).json({ success: false, message: "Not found" });

    // Restore stock from old details
    const oldDetails = await SalesDetail.find({ sales_master: master._id });
    for (const d of oldDetails) {
      await Stock.findOneAndUpdate(
        { product: d.product },
        { $inc: { quantity: d.quantity } }
      );
    }

    // Remove old details
    await SalesDetail.deleteMany({ sales_master: master._id });

    // Insert new details and deduct stock
    let sr_no = 1;
    let total = 0;
    for (const d of details) {
      const amount = Number(d.quantity) * Number(d.rate);
      total += amount;

      await SalesDetail.create({
        sales_master: master._id,
        sr_no: sr_no++,
        product: d.product,
        quantity: Number(d.quantity),
        rate: Number(d.rate),
        amount,
      });

      await Stock.findOneAndUpdate(
        { product: d.product },
        { $inc: { quantity: -Number(d.quantity) } }
      );
    }

    master.client_name = client_name;
    master.amount = total;
    await master.save();

    res.json({ success: true, data: master });
  } catch (err) {
    next(err);
  }
});

// ==================== DELETE SALE ====================
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const master = await SalesMaster.findById(req.params.id);
    if (!master)
      return res.status(404).json({ success: false, message: "Not found" });

    const details = await SalesDetail.find({ sales_master: master._id });

    // Restore stock
    for (const d of details) {
      await Stock.findOneAndUpdate(
        { product: d.product },
        { $inc: { quantity: d.quantity } }
      );
    }

    // Delete details and master
    await SalesDetail.deleteMany({ sales_master: master._id });
    await master.deleteOne();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
