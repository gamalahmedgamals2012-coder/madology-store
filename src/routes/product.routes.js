const express = require("express");
const productController = require("../controllers/product.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", productController.listProducts);
router.get("/filters", productController.getProductFilters);
router.get("/suggestions", productController.getSearchSuggestions);
router.get("/:productId", productController.getProduct);
router.get("/:productId/related", productController.getRelated);
router.get("/:productId/reviews", productController.getReviews);
router.post("/:productId/reviews", requireAuth, productController.submitReview);

module.exports = router;
