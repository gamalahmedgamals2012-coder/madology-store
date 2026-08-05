const express = require("express");
const orderController = require("../controllers/order.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/orders", requireAuth, orderController.createOrder);
router.post("/order", orderController.createOrder);

module.exports = router;
