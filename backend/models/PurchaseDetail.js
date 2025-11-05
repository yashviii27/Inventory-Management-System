const mongoose = require("mongoose");

const PurchaseDetailSchema = new mongoose.Schema(
  {
    purchaseMaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseMaster",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseDetail", PurchaseDetailSchema);

// const mongoose = require("mongoose");

// const PurchaseDetailSchema = new mongoose.Schema(
//   {
//     purchaseMaster: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "PurchaseMaster",
//       required: true,
//     },
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },
//     quantity: { type: Number, required: true },
//     rate: { type: Number, required: true },
//     amount: { type: Number, required: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("PurchaseDetail", PurchaseDetailSchema);
