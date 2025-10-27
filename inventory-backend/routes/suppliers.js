const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Supplier = require("../models/Supplier");

// Create supplier
router.post("/", auth, async (req, res, next) => {
  try {
    const s = new Supplier(req.body);
    await s.save();
    res.json({ success: true, data: s });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", auth, async (req, res, next) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ✅ Delete supplier
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const deleted = await Supplier.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    res.json({ success: true, message: "Supplier deleted" });
  } catch (err) {
    next(err);
  }
});

// List
router.get("/", auth, async (req, res, next) => {
  try {
    const list = await Supplier.find().lean();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
