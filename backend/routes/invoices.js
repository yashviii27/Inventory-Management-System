const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Invoice = require("../models/Invoice");
const SalesMaster = require("../models/SalesMaster");
const SalesDetail = require("../models/SalesDetail");
const mongoose = require("mongoose");

// ✅ GET ALL INVOICES
router.get("/", auth, async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("sales_master")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: invoices,
    });
  } catch (err) {
    console.error("❌ Error fetching invoices:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching invoices",
      error: err.message,
    });
  }
});

// ✅ GET INVOICE BY ID (with linked sale + details) - ENHANCED
router.get("/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    console.log("🔍 Fetching invoice ID:", id);

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn("⚠️ Invalid invoice ID format:", id);
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID format",
      });
    }

    // Find invoice
    const invoice = await Invoice.findById(id).lean();
    console.log("📄 Invoice found:", invoice ? "Yes" : "No");

    if (!invoice) {
      console.warn("⚠️ Invoice not found for ID:", id);
      return res.status(404).json({
        success: false,
        message: "Invoice not found!",
      });
    }

    // Fetch linked sale
    const sale = await SalesMaster.findById(invoice.sales_master).lean();
    console.log("💰 Linked sale found:", sale ? "Yes" : "No");

    if (!sale) {
      console.warn("⚠️ Sale not found for invoice ID:", id);
      return res.status(404).json({
        success: false,
        message: "Linked sale not found!",
      });
    }

    // Fetch sale details
    const details = await SalesDetail.find({ sales_master: sale._id })
      .populate("product")
      .lean();

    console.log("📦 Sale details found:", details.length);

    console.log("✅ Invoice fetched successfully:", {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.client_name,
      itemsCount: details.length,
    });

    // ✅ Send complete invoice data with GST
    res.json({
      success: true,
      invoice: {
        ...invoice,
        // Ensure all required fields are present
        subtotal: invoice.subtotal || sale.amount || 0,
        gstRate: invoice.gstRate || 18,
        gstAmount: invoice.gstAmount || 0,
        total_amount: invoice.total_amount || sale.amount || 0,
      },
      sale,
      details,
    });
  } catch (err) {
    console.error("❌ Invoice fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching invoice",
      error: err.message,
    });
  }
});

// ✅ GENERATE INVOICE FOR SALE (WITH GST CALCULATION & PAYMENT DETAILS) - UPDATED
router.post("/generate/:saleId", auth, async (req, res) => {
  try {
    const saleId = req.params.saleId;
    const { paymentStatus, paymentMethod } = req.body; // ✅ Get payment details from request body

    console.log("📝 Generating invoice for sale:", saleId);
    console.log("💰 Payment details:", { paymentStatus, paymentMethod });

    // Validate saleId format
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID format",
      });
    }

    // Validate payment status
    if (
      paymentStatus &&
      !["paid", "pending", "partial"].includes(paymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    // Validate payment method
    if (
      paymentMethod &&
      !["cash", "card", "upi", "bank-transfer"].includes(paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Find the sale with details to calculate subtotal properly
    const sale = await SalesMaster.findById(saleId).lean();

    if (!sale) {
      console.warn("⚠️ Sale not found:", saleId);
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // Fetch sale details to calculate actual subtotal
    const saleDetails = await SalesDetail.find({ sales_master: saleId })
      .populate("product")
      .lean();

    // Calculate subtotal from sale details
    const subtotal = saleDetails.reduce((total, detail) => {
      return total + (detail.amount || detail.quantity * detail.rate || 0);
    }, 0);

    // Calculate GST (18%)
    const gstRate = 18;
    const gstAmount = (subtotal * gstRate) / 100;
    const totalAmount = subtotal + gstAmount;

    console.log("💰 Invoice calculations:", {
      subtotal,
      gstRate,
      gstAmount,
      totalAmount,
    });

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({
      sales_master: saleId,
    }).lean();

    if (existingInvoice) {
      console.warn("⚠️ Invoice already exists for sale:", saleId);
      return res.status(400).json({
        success: false,
        message: "Invoice already exists for this sale.",
        data: existingInvoice,
        invoiceId: existingInvoice._id.toString(),
      });
    }

    // ✅ Use provided payment status/method or default values
    const finalPaymentStatus = paymentStatus || "pending";
    const finalPaymentMethod = paymentMethod || "cash";

    // Create new invoice with GST and payment details
    const newInvoice = new Invoice({
      sales_master: saleId,
      date: sale.date || new Date(),
      client_name: sale.client_name || "Unknown Customer",
      subtotal: subtotal,
      gstRate: gstRate,
      gstAmount: gstAmount,
      total_amount: totalAmount,
      status: "Generated",
      paymentStatus: finalPaymentStatus, // ✅ Use selected payment status
      customerEmail: sale.client_email,
      customerPhone: sale.client_phone,
      customerAddress: sale.client_address,
      paymentMethod: finalPaymentMethod, // ✅ Use selected payment method
    });

    await newInvoice.save();

    // Link invoice back to sale
    await SalesMaster.findByIdAndUpdate(saleId, {
      invoice: newInvoice._id,
    });

    console.log("✅ Invoice generated successfully:", {
      invoiceId: newInvoice._id,
      invoiceNumber: newInvoice.invoiceNumber,
      subtotal: subtotal,
      gstAmount: gstAmount,
      totalAmount: totalAmount,
      paymentStatus: finalPaymentStatus,
      paymentMethod: finalPaymentMethod,
    });

    // ✅ Return consistent response with invoice ID
    res.json({
      success: true,
      message: "Invoice generated successfully",
      data: newInvoice,
      invoiceId: newInvoice._id.toString(), // ✅ Explicitly return as string
    });
  } catch (err) {
    console.error("❌ Invoice generation error:", err);
    res.status(500).json({
      success: false,
      message: "Error generating invoice",
      error: err.message,
    });
  }
});

// ✅ UPDATE PAYMENT STATUS
router.patch("/:id/payment-status", auth, async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!["paid", "pending", "partial"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, status: paymentStatus === "paid" ? "Paid" : "Pending" },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({
      success: true,
      message: "Payment status updated",
      data: invoice,
    });
  } catch (err) {
    console.error("❌ Payment status update error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: err.message,
    });
  }
});

// ✅ DELETE INVOICE
router.delete("/:id", auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Remove invoice reference from sale
    await SalesMaster.findByIdAndUpdate(invoice.sales_master, {
      $unset: { invoice: "" },
    });

    await invoice.deleteOne();

    res.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (err) {
    console.error("❌ Invoice deletion error:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting invoice",
      error: err.message,
    });
  }
});

module.exports = router;
