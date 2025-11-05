const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // ✅ ensure unique
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ Handle duplicate index creation errors gracefully
ProductSchema.on("index", (err) => {
  if (err && err.message.includes("name_1")) {
    console.warn("⚠️ Skipping duplicate index creation for 'name_1'");
  }
});

// ✅ Use a different name for the custom index to avoid conflicts
ProductSchema.index(
  { name: 1 },
  {
    unique: true,
    name: "product_name_unique", // 👈 different from 'name_1'
    collation: { locale: "en", strength: 2 },
  }
);

module.exports = mongoose.model("Product", ProductSchema);
