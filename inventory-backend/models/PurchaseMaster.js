const mongoose = require("mongoose");

const PurchaseMasterSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    client_name: { type: String, required: true },
    amount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseMaster", PurchaseMasterSchema);
