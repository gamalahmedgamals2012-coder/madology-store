const express = require("express");
const orderController = require("../controllers/order.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/orders", requireAuth, orderController.createOrder);
router.post("/order", requireAuth, orderController.createOrder);
router.get("/orders", requireAuth, orderController.getOrderHistory);
router.get("/orders/:id/tracking", requireAuth, orderController.getOrderTracking);
router.post("/reviews", requireAuth, orderController.addReview);

module.exports = router;
