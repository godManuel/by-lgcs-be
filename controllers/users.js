const User = require("../models/User.js");
const asyncHandler = require("../middlewares/async.js");
const ErrorResponse = require("../utils/errorResponse.js");
const { sendEmail } = require("../utils/sendEmail");

// @DESC        Register Superadmin
// @ROUTE       POST  /api/v1/users/register-superadmin
// @ACCESS      Private
exports.registerSuperAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  let user = await User.findOne({ email });
  if (user) return next(new ErrorResponse("User already exists", 400));

  user = await User.create(req.body);
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      email: user.email,
      role: user.role,
    },
  });
});

// @DESC        Register Superadmin
// @ROUTE       POST  /api/v1/users/add-admin
// @ACCESS      Private
exports.addAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  let user = await User.findOne({ email });
  if (user) return next(new ErrorResponse("User already exists", 400));

  user = await User.create(req.body);

  await user.save();

  try {
    // const sendEmail = await loadSendEmail();

    await sendEmail(user.email, "Invitation as Admin", "invite-admin", {
      name: user.firstName,
      email: user.email,
      password: req.body.password,
      // loginUrl:
    });

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

  // res.status(200).json({
  //   success: true,
  //   data: {
  //     user,
  //   },
  // });
});
