const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Customer = require("../models/Customer");

// Create customer
router.post("/", auth, async (req, res, next) => {
  try {
    const c = new Customer(req.body);
    await c.save();
    res.json({ success: true, data: c });
  } catch (err) {
    next(err);
  }
});

// Get all customers
router.get("/", auth, async (req, res, next) => {
  try {
    const list = await Customer.find().lean();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// Update customer
router.put("/:id", auth, async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// Delete customer
router.delete("/:id", auth, async (req, res, next) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
