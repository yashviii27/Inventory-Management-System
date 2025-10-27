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
      results.push({ master: m, details });
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
      results.push({ master: m, details });
    }

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

    if (type === "sales") {
      masters = await SalesMaster.find({
        date: { $gte: from, $lte: to },
      }).lean();
      detailsModel = SalesDetail;
      fileName = "sales_report.csv";
    } else if (type === "purchases") {
      masters = await PurchaseMaster.find({
        date: { $gte: from, $lte: to },
      }).lean();
      detailsModel = PurchaseDetail;
      fileName = "purchase_report.csv";
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    const rows = [];

    for (const m of masters) {
      const details = await detailsModel
        .find(
          type === "sales"
            ? { sales_master: m._id }
            : { purchase_master: m._id }
        )
        .populate("product")
        .lean();

      for (const d of details) {
        rows.push({
          ID: m._id.toString(),
          Date: m.date.toISOString(),
          Party: m.client_name || m.supplier_name || "N/A",
          TotalAmount: m.amount || 0,
          Product: d.product?.name || "Unknown",
          Quantity: d.quantity,
          Rate: d.rate,
          LineAmount: d.amount,
        });
      }
    }

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(fileName);
    res.send(csv);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({
      success: false,
      message: "Export failed",
      error: err.message,
    });
  }
});

module.exports = router;
