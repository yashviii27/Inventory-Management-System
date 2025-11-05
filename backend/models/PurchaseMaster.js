const mongoose = require("mongoose");

const PurchaseMasterSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true },
    date: { type: Date, required: true },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    supplierName: { type: String, required: true },
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseMaster", PurchaseMasterSchema);
