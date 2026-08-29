const express = require("express");
const locationController = require("../controllers/location.controller");

const router = express.Router();

router.get("/search", locationController.searchLocations);
router.get("/reverse", locationController.reverseLocation);

module.exports = router;
