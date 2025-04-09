const express = require("express");
const router = express.Router();

const { registerSuperAdmin, addAdmin } = require("../controllers/users");

const { protect, authorize } = require("../middlewares/auth");

// @POST - Create SuperAdmin
router.route("/register-superadmin").post(registerSuperAdmin);

// @POST - Add Admin
router.route("/add-admin").post(protect, authorize("superadmin"), addAdmin);

module.exports = router;
