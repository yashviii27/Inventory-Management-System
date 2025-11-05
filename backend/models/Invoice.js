const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    sales_master: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesMaster",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    client_name: {
      type: String,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    gstRate: {
      type: Number,
      default: 18, // Default 18% GST
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Generated", "Paid", "Pending", "Cancelled"],
      default: "Generated",
    },
    customerEmail: String,
    customerPhone: String,
    customerAddress: String,
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "bank-transfer"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "partial"],
      default: "pending",
    },
    discount: {
      type: Number,
      default: 0,
    },
    dueDate: Date,
    notes: String,
    terms: String,
  },
  { timestamps: true }
);

// ✅ Auto-generate invoice number before saving
InvoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    try {
      const lastInvoice = await this.constructor
        .findOne()
        .sort({ createdAt: -1 })
        .lean();

      let nextNumber = 1;
      if (lastInvoice?.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      this.invoiceNumber = `INV-${String(nextNumber).padStart(7, "0")}`;
    } catch (err) {
      return next(err);
    }
  }

  // ✅ Auto-calculate GST and total if not provided
  if (this.subtotal && !this.gstAmount) {
    this.gstAmount = (this.subtotal * this.gstRate) / 100;
  }

  if (this.subtotal && !this.total_amount) {
    this.total_amount = this.subtotal + this.gstAmount - this.discount;
  }

  next();
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
