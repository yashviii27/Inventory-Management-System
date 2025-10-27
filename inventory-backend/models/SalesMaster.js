const mongoose = require("mongoose");

const SalesMasterSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    client_name: { type: String, required: true },
    amount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesMaster", SalesMasterSchema);
// const mongoose = require("mongoose");

// const SalesMasterSchema = new mongoose.Schema(
//   {
//     date: { type: Date, default: Date.now },
//     client_name: { type: String, required: true },
//     amount: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("SalesMaster", SalesMasterSchema);

// const mongoose = require("mongoose");

// const saleSchema = new mongoose.Schema({
//   date: Date,
//   client_name: String,
//   details: [
//     {
//       product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//       quantity: Number,
//       rate: Number,
//       amount: Number,
//     },
//   ],
// });

// module.exports = mongoose.model("Sales", saleSchema);
