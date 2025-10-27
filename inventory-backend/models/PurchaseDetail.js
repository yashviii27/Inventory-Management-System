const mongoose = require("mongoose");

const PurchaseDetailSchema = new mongoose.Schema(
  {
    purchase_master: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseMaster",
      required: true,
    },
    sr_no: { type: Number },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseDetail", PurchaseDetailSchema);
