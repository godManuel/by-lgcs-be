const express = require("express");
const router = express.Router();

const {
  login,
  verifyLoginOTP,
  resendLoginOTP,
} = require("../controllers/auth");

const { protect, authorize } = require("../middlewares/auth");

// @POST - Create SuperAdmin
router.route("/login").post(login);

// @POST - Verify Login OTP
router.route("/verify-otp").post(verifyLoginOTP);

router.route("/resend-otp").post(resendLoginOTP);

module.exports = router;
