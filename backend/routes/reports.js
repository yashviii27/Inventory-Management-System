const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const SalesMaster = require("../models/SalesMaster");
const SalesDetail = require("../models/SalesDetail");
const PurchaseMaster = require("../models/PurchaseMaster");
const PurchaseDetail = require("../models/PurchaseDetail");
const { Parser } = require("json2csv");

/**
 * 🧾 SALES REPORT
 * GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
router.get("/sales", auth, async (req, res, next) => {
  try {
    const from = req.query.from
      ? new Date(req.query.from)
      : new Date("1970-01-01");
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);

    const masters = await SalesMaster.find({
      date: { $gte: from, $lte: to },
    }).lean();
    const results = [];

    for (const m of masters) {
      const details = await SalesDetail.find({ sales_master: m._id })
        .populate("product")
        .lean();

      results.push({
        master: {
          _id: m._id,
          client_name: m.client_name || "Unknown Client",
          date: m.date,
          amount: m.amount || 0,
          billNo: m.billNo || "",
        },
        details,
      });
    }

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

/**
 * 🧾 PURCHASE REPORT
 * GET /api/reports/purchases?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
router.get("/purchases", auth, async (req, res, next) => {
  try {
    const from = req.query.from
      ? new Date(req.query.from)
      : new Date("1970-01-01");
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);

    const masters = await PurchaseMaster.find({
      date: { $gte: from, $lte: to },
    }).lean();
    const results = [];

    for (const m of masters) {
      const details = await PurchaseDetail.find({ purchase_master: m._id })
        .populate("product")
        .lean();

      results.push({
        master: {
          _id: m._id,
          supplier_name: m.supplierName || "Unknown Supplier",
          date: m.date,
          amount: m.totalAmount || 0,
          billNo: m.billNo || "",
        },
        details,
      });
    }

    console.log("🧾 Purchase Reports Found:", results.length);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

/**
 * 📦 EXPORT REPORT (Sales or Purchases)
 * GET /api/reports/export?type=sales|purchases&from=&to=
 */
router.get("/export", auth, async (req, res, next) => {
  try {
    const type = req.query.type;
    const from = req.query.from
      ? new Date(req.query.from)
      : new Date("1970-01-01");
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);

    let masters = [];
    let detailsModel;
    let fileName;
    let masterIdField;

    // 🧾 Identify which model to use based on the type
    if (type === "sales") {
      masters = await SalesMaster.find({
        date: { $gte: from, $lte: to },
      }).lean();
      detailsModel = SalesDetail;
      fileName = "sales_report.csv";
      masterIdField = "sales_master"; // ✅ Field name in SalesDetail schema
    } else if (type === "purchases") {
      masters = await PurchaseMaster.find({
        date: { $gte: from, $lte: to },
      }).lean();
      detailsModel = PurchaseDetail;
      fileName = "purchase_report.csv";
      masterIdField = "purchaseMaster"; // ✅ Correct field name in PurchaseDetail schema
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid report type" });
    }

    const rows = [];

    // 🔄 Loop through each master record (Sale or Purchase)
    for (const m of masters) {
      const filter = {};
      filter[masterIdField] = m._id;

      // Populate product details
      const details = await detailsModel
        .find(filter)
        .populate("product")
        .lean();

      // 🧮 Combine master & detail data into CSV rows
      for (const d of details) {
        rows.push({
          ID: m._id.toString(),
          Date: m.date ? new Date(m.date).toISOString().split("T")[0] : "N/A",
          BillNo: m.billNo || "N/A",
          Party: m.client_name || m.supplierName || "N/A",
          Product: d.product?.name || d.productName || "Unknown",
          Quantity: d.quantity ?? 0,
          Rate: d.rate ?? 0,
          LineAmount: d.amount ?? 0,
          TotalAmount: m.amount || m.totalAmount || 0,
        });
      }
    }

    // 🚨 If no data found
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found for the selected date range.",
      });
    }

    // 🧾 Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(rows);

    // 📦 Send CSV file as response
    res.header("Content-Type", "text/csv");
    res.attachment(fileName);
    res.send(csv);
  } catch (err) {
    console.error("❌ CSV Export Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to export CSV.",
      error: err.message,
    });
  }
});

module.exports = router;
