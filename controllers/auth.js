const User = require("../models/User");
const { RDAs, LGAs } = require("../config/serviceAreas.js");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const { sendEmail } = require("../utils/sendEmail");

// @DESC        Login Admin or Super-Admin
// @ROUTE       POST  /api/v1/auth/login
// @ACCESS      Private
exports.login = asyncHandler(async (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return next(new ErrorResponse("Please enter an email and password", 400));
  }

  const user = await User.findOne({ email: req.body.email }).select(
    "+password",
  );
  if (!user) return next(new ErrorResponse("Email or password incorrect", 401));

  const isMatch = await user.matchPassword(req.body.password);

  if (!isMatch)
    return next(new ErrorResponse("Email or password incorrect", 401));

  const emailOTP = await user.getEmailOTP();
  await user.save();

  try {
    await sendEmail(
      user.email,
      `Your Verification Code is ${emailOTP}`,
      "otp-verification",
      {
        name: user.firstName,
        expiryTime: user.emailOTPExpire,
        otp: emailOTP,
      },
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
  const user = await User.findOne({ email: req.body.email }).populate(
    "coordinators",
    "_id firstName lastName email role assignedLGA",
  );
  if (!user) return next(new ErrorResponse("User not found", 404));

  if (!user.emailOTP || !user.emailOTPExpire) {
    return next(
      new ErrorResponse("No active OTP found. Please request a new one.", 400),
    );
  }

  if (user.emailOTPExpire < Date.now()) {
    user.emailOTP = undefined;
    user.emailOTPExpire = undefined;
    await user.save();

    return next(
      new ErrorResponse("OTP has expired. Please request a new one.", 400),
    );
  }

  const verifiedOTP = await user.verifyEmailOTP(req.body.emailOTP);

  if (!verifiedOTP) {
    return next(new ErrorResponse("Invalid OTP.", 400));
  }

  const token = user.getSignedToken();

  await user.save();

  const resolvedLGA = user.assignedLGA
    ? LGAs[user.assignedLGA] || user.assignedLGA
    : null;
  const resolvedRDAs = user.assignedRDAs.map((key) => RDAs[key] || key);

  let message = "";

  switch (true) {
    case resolvedLGA && resolvedRDAs.length > 0:
      message = `You are assigned to LGA: ${resolvedLGA} and RDAs: ${resolvedRDAs.join(", ")}`;
      break;

    case resolvedLGA:
      message = `You are assigned to LGA: ${resolvedLGA}`;
      break;

    case resolvedRDAs.length > 0:
      message = `You are assigned to RDAs: ${resolvedRDAs.join(", ")}`;
      break;

    default:
      message = `You are not assigned to any LGAs or RDAs yet.`;
  }

  res.status(200).json({
    success: true,
    data: {
      email: user.email,
      role: user.role,
      name: user.firstName + " " + user.lastName,
      statistics: user.statistics,
      assignedLGA: resolvedLGA,
      assignedRDAs: resolvedRDAs.length > 0 ? user.assignedRDAs : null,
      coordinators: user.coordinators.length > 0 ? user.coordinators : null,
      message,
      token,
    },
  });
});

exports.resendLoginOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse("Please provide your email address", 400));
  }

  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Generate a new OTP and expiry time
  const emailOTP = await user.getEmailOTP();
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail(
      user.email,
      `Your Verification Code is ${emailOTP}`,
      "otp-verification",
      {
        name: user.firstName,
        expiryTime: user.emailOTPExpire,
        otp: emailOTP,
      },
    );

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email.",
      data: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return next(new ErrorResponse("Email could not be sent", 500));
  }
});
