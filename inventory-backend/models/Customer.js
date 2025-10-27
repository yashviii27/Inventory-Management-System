const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: String,
    email: String,
    address: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
