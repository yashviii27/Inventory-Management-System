const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Stock = require("../models/Stock");
const SalesMaster = require("../models/SalesMaster");
const SalesDetail = require("../models/SalesDetail");
const PurchaseMaster = require("../models/PurchaseMaster");
const PurchaseDetail = require("../models/PurchaseDetail");

// ✅ DASHBOARD STATS
router.get("/stats", auth, async (req, res) => {
  try {
    // 🔹 Products
    const totalProducts = await Product.countDocuments();
    const lowStockCount = await Stock.countDocuments({
      closingStock: { $lte: 10, $gt: 0 },
    });
    const outOfStockCount = await Stock.countDocuments({
      closingStock: { $lte: 0 },
    });

    // 🔹 Sales (count + total amount)
    const salesCount = await SalesMaster.countDocuments();
    const salesAgg = await SalesMaster.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);
    const totalSalesAmount = salesAgg[0]?.totalAmount || 0;

    // 🔹 Purchases (count + total amount)
    const purchaseCount = await PurchaseMaster.countDocuments();
    const purchaseAgg = await PurchaseMaster.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);
    const totalPurchaseAmount = purchaseAgg[0]?.totalAmount || 0;

    // 🔹 Stock Summary
    const stockAgg = await Stock.aggregate([
      {
        $group: {
          _id: null,
          totalOpeningStock: { $sum: "$openingStock" },
          totalInward: { $sum: "$inward" },
          totalOutward: { $sum: "$outward" },
          totalClosingStock: { $sum: "$closingStock" },
        },
      },
    ]);

    const stockSummary = stockAgg[0] || {
      totalOpeningStock: 0,
      totalInward: 0,
      totalOutward: 0,
      totalClosingStock: 0,
    };

    // 🔹 Profit/Loss
    const profit = totalSalesAmount - totalPurchaseAmount;

    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
        },
        sales: {
          count: salesCount,
          amount: totalSalesAmount,
        },
        purchases: {
          count: purchaseCount,
          amount: totalPurchaseAmount,
        },
        stock: stockSummary,
        profit,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
});

// ✅ SALES TREND (Last N Days)
router.get("/sales-trend", auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const salesTrend = await SalesMaster.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: salesTrend.map((s) => ({
        date: s._id,
        count: s.count,
        amount: s.amount,
      })),
    });
  } catch (error) {
    console.error("Sales trend error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch sales trend" });
  }
});

// ✅ TOP SELLING PRODUCTS
router.get("/top-products", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topProducts = await SalesDetail.aggregate([
      {
        $group: {
          _id: "$product",
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          productName: "$productInfo.name",
          totalQuantity: 1,
          totalAmount: 1,
        },
      },
    ]);

    res.json({ success: true, data: topProducts });
  } catch (error) {
    console.error("Top products error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch top products" });
  }
});

// ✅ STOCK OVERVIEW (Pie Chart)
router.get("/stock-overview", auth, async (req, res) => {
  try {
    const allStock = await Stock.find().lean();

    let highStock = 0,
      mediumStock = 0,
      lowStock = 0,
      outOfStock = 0;

    for (const s of allStock) {
      if (s.closingStock > 20) highStock++;
      else if (s.closingStock >= 10) mediumStock++;
      else if (s.closingStock > 0) lowStock++;
      else outOfStock++;
    }

    res.json({
      success: true,
      data: { highStock, mediumStock, lowStock, outOfStock },
    });
  } catch (error) {
    console.error("Stock overview error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch stock overview" });
  }
});

module.exports = router;
