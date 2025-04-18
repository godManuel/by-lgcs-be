const express = require("express");
const { getRDAs, getLGAs } = require("../controllers/serviceAreas");
const router = express.Router();

router.get("/rdas", getRDAs);

router.get("/lgas", getLGAs);

module.exports = router;
