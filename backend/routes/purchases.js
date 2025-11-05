const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const PurchaseMaster = require("../models/PurchaseMaster");
const PurchaseDetail = require("../models/PurchaseDetail");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Stock = require("../models/Stock");

// ✅ GET all bill numbers for a specific supplier
router.get("/supplier-bills/:supplierId", auth, async (req, res) => {
  try {
    const supplierId = req.params.supplierId;

    const bills = await PurchaseMaster.find({ supplier: supplierId })
      .select("billNo date")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      bills: bills.map((b) => ({
        billNo: b.billNo,
        date: b.date,
      })),
    });
  } catch (err) {
    console.error("Error fetching supplier bills:", err);
    res.status(500).json({ message: "Failed to fetch supplier bills" });
  }
});

// ✅ GET next bill number
router.get("/next-bill-no", auth, async (req, res) => {
  try {
    const lastBill = await PurchaseMaster.findOne()
      .sort({ createdAt: -1 })
      .lean();
    let nextNumber = 1;

    if (lastBill?.billNo) {
      const match = lastBill.billNo.match(/BILL-(\d+)/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }

    const nextBillNo = `BILL-${String(nextNumber).padStart(7, "0")}`;
    res.json({ billNo: nextBillNo });
  } catch (err) {
    console.error("Bill No Error:", err);
    res.status(500).json({ message: "Failed to get next bill number" });
  }
});

// ✅ GET all purchases
router.get("/", auth, async (req, res) => {
  try {
    const masters = await PurchaseMaster.find().sort({ createdAt: -1 }).lean();

    const purchases = await Promise.all(
      masters.map(async (m) => {
        const supplier = await Supplier.findById(m.supplier).lean();
        const details = await PurchaseDetail.find({ purchaseMaster: m._id })
          .populate("product", "name")
          .lean();

        return {
          master: {
            ...m,
            supplierName: supplier
              ? supplier.name
              : m.supplierName || "Unknown Supplier",
            supplier: supplier ? supplier._id : m.supplier,
          },
          details,
        };
      })
    );

    res.json(purchases);
  } catch (err) {
    console.error("Failed to load purchases:", err);
    res.status(500).json({ message: "Failed to load purchases" });
  }
});

// ✅ CREATE purchase (same supplier can reuse billNo, but globally unique)
router.post("/", auth, async (req, res) => {
  try {
    const { supplier, supplierName, billNo, date, items } = req.body;

    if (!supplier || !supplierName || !billNo || !date || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(400).json({ message: "Invalid supplier" });
    }

    // ✅ Check if the same billNo exists for a *different supplier*
    const existingBill = await PurchaseMaster.findOne({
      billNo,
      supplier: { $ne: supplier },
    });

    if (existingBill) {
      return res.status(400).json({
        message: `Bill number ${billNo} already exists for another supplier.`,
      });
    }

    const totalAmount = items.reduce(
      (sum, i) => sum + Number(i.price) * Number(i.quantity),
      0
    );

    // ✅ Create PurchaseMaster
    const master = await PurchaseMaster.create({
      supplier,
      supplierName,
      billNo,
      date,
      totalAmount,
    });

    // ✅ Create PurchaseDetail for each item and update stock
    for (const i of items) {
      const quantity = Number(i.quantity);

      await PurchaseDetail.create({
        purchaseMaster: master._id,
        product: i.productId,
        productName: i.name,
        quantity,
        rate: i.price,
        amount: quantity * i.price,
      });

      // Update Product stock
      await Product.findByIdAndUpdate(i.productId, {
        $inc: { stock: quantity },
      });

      // Update Stock
      const stockRecord = await Stock.findOne({ product: i.productId });
      if (stockRecord) {
        stockRecord.inward += quantity;
        stockRecord.closingStock += quantity;
        await stockRecord.save();
      } else {
        await Stock.create({
          product: i.productId,
          openingStock: 0,
          inward: quantity,
          outward: 0,
          closingStock: quantity,
        });
      }
    }

    res.json({
      success: true,
      message: "Purchase created successfully",
      master,
    });
  } catch (err) {
    console.error("❌ Create purchase error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to create purchase" });
  }
});

// ✅ DELETE purchase (rollback product + stock)
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const details = await PurchaseDetail.find({ purchaseMaster: id }).lean();

    for (const d of details) {
      const quantity = Number(d.quantity);

      await Product.findByIdAndUpdate(d.product, {
        $inc: { stock: -quantity },
      });

      const stockRecord = await Stock.findOne({ product: d.product });
      if (stockRecord) {
        stockRecord.inward -= quantity;
        stockRecord.closingStock -= quantity;
        await stockRecord.save();
      }
    }

    await PurchaseDetail.deleteMany({ purchaseMaster: id });
    await PurchaseMaster.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Purchase deleted and stock rolled back",
    });
  } catch (err) {
    console.error("Delete purchase error:", err);
    res.status(500).json({ message: "Failed to delete purchase" });
  }
});

module.exports = router;
