const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    openingStock: { type: Number, default: 0 },
    inward: { type: Number, default: 0 },
    outward: { type: Number, default: 0 },
    closingStock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", StockSchema);
