const express = require("express");
const router = express.Router();

const upload = require("../utils/multer");

const {
  addCivilServant,
  getCivilServant,
  getCivilServants,
} = require("../controllers/servants");

const { protect, authorize } = require("../middlewares/auth");

const advancedResults = require("../middlewares/advancedResults");
const Servant = require("../models/Servant");

// @POST - Create SuperAdmin
router
  .route("/")
  .post(
    protect,
    authorize("superadmin", "admin"),
    upload.single("displayPhoto"),
    addCivilServant
  );

// @GET - Fetch a civil servant by advanced filtering
router
  .route("/")
  .get(
    protect,
    authorize("superadmin", "admin"),
    advancedResults(Servant),
    getCivilServants
  );

// @GET - Fetch a single Civil Servant
router
  .route("/:servantId")
  .get(protect, authorize("superadmin", "admin"), getCivilServant);

module.exports = router;
