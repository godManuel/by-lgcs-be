const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");

// @DESC        Login Admin or Super-Admin
// @ROUTE       POST  /api/v1/auth/login
// @ACCESS      Private
exports.login = asyncHandler(async (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return next(new ErrorResponse("Please enter an email and password", 400));
  }

  const user = await User.findOne({ email: req.body.email }).select(
    "+password"
  );
  if (!user) return next(new ErrorResponse("Email or password incorrect", 401));

  const isMatch = await user.matchPassword(req.body.password);

  if (!isMatch)
    return next(new ErrorResponse("Email or password incorrect", 401));

  const emailOTP = await user.getEmailOTP();
  await user.save();

  try {
    // const sendEmail = await loadSendEmail();

    await sendEmail(
      user.email,
      `Your Verification Code is ${emailOTP}`,
      "otp-verification",
      {
        name: user.firstName,
        expiryTime: user.emailOTPExpire,
        otp: emailOTP,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        role: user.role,
        message: "A confirmation code has been sent to your email",
      },
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Email could not be sent", 500));
  }
});

// @DESC        Verify User Login via Email OTP
// @ROUTE       POST  /api/v1/auth/verify-login
// @ACCESS      Private
exports.verifyLoginOTP = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new ErrorResponse("User not found", 404));

  const verifiedOTP = await user.verifyEmailOTP(req.body.emailOTP);
  if (!verifiedOTP) return next(new ErrorResponse("Invalid OTP"));

  if (user.emailOTPExpire < Date.now()) {
    await user.delete();
    next(new ErrorResponse("OTP Expired! Request a new one", 400));
  }

  user.emailOTP = undefined;
  user.emailOTPExpire = undefined;

  const token = user.getSignedToken();

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      email: user.email,
      role: user.role,
      token,
    },
  });
});
