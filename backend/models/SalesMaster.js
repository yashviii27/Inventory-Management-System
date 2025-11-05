// models/SalesMaster.js
const mongoose = require("mongoose");

const SalesMasterSchema = new mongoose.Schema({
  bill_no: {
    type: String,
    unique: true,
  },
  client_name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
  },
});

// ✅ Auto-generate Bill No before saving
SalesMasterSchema.pre("save", async function (next) {
  if (this.bill_no) return next(); // Skip if already exists

  try {
    const lastSale = await this.constructor.findOne().sort({ _id: -1 });
    const lastNumber = lastSale
      ? parseInt(lastSale.bill_no?.replace("BILL", "")) || 0
      : 0;

    this.bill_no = "BILL" + String(lastNumber + 1).padStart(4, "0");
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("SalesMaster", SalesMasterSchema);

// const mongoose = require("mongoose");

// const SalesMasterSchema = new mongoose.Schema(
//   {
//     date: { type: Date, default: Date.now },
//     client_name: { type: String, required: true },
//     amount: { type: Number, default: 0 },
//     invoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Invoice",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("SalesMaster", SalesMasterSchema);
