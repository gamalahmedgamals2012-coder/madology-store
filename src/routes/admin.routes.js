const express = require("express");
const adminController = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/users", adminController.listUsers);
router.get("/orders", adminController.listOrders);
router.patch("/orders/:id/status", adminController.updateOrderStatus);

module.exports = router;
