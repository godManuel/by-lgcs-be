const User = require("../models/User.js");
const asyncHandler = require("../middlewares/async.js");
const ErrorResponse = require("../utils/errorResponse.js");
const { sendEmail } = require("../utils/sendEmail");
const { LGAs, RDAs } = require("../config/serviceAreas.js");

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
  const { email, assignedLGAs, assignedRDAs } = req.body;

  let user = await User.findOne({ email });
  if (user) return next(new ErrorResponse("User already exists", 400));

   let updateFields = {};

  if (assignedLGAs) {
    const invalidLGAs = assignedLGAs.filter(lgaKey => !(lgaKey in LGAs))
    if (invalidLGAs.length > 0) {
      return next(new ErrorResponse(`Invalid assignedLGAs provided: ${invalidLGAs.join(", ")}`, 400));
    }
    updateFields.assignedLGAs = assignedLGAs.map(lgaKey => LGAs[lgaKey]);
  }

  if (assignedRDAs) {
    const invalidRDAs = assignedRDAs.filter(rdaKey => !(rdaKey in RDAs));
    if (invalidRDAs.length > 0) {
      return next(new ErrorResponse(`Invalid assignedRDAs provided: ${invalidRDAs.join(", ")}`, 400));
    }
    updateFields.assignedRDAs = assignedRDAs.map(rdaKey => RDAs[rdaKey]);
  }

  if (Object.keys(updateFields).length === 0) {
    return next(new ErrorResponse('Only assignedLGAs or assignedRDAs can be updated', 400));
  }

  user = await User.create({
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password: req.body.password,
    assignedLGAs: updateFields.assignedLGAs || [],
    assignedRDAs: updateFields.assignedRDAs || [],
  });

  await user.save();

  try {
    await sendEmail(user.email, "Invitation as Admin", "invite-admin", {
      name: user.firstName,
      email: user.email,
      password: req.body.password
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
});

// @DESC        Get all users with role of admin. Only allowed for Superadmin
// @ROUTE       GET /api/v1/users/admins
// @ACCESS      Private (Superadmin only)
exports.getAllAdmins = asyncHandler(async (req, res, next) => {
  const admins = await User.find({ role: "admin" }).select("-password");
  if (!admins) return next(new ErrorResponse("No admins yet!"), 404);

  res.status(200).json({
    success: true,
    data: admins
  });
});

// @DESC        Update an admin's details. Only allowed for Superadmin
// @ROUTE       PUT /api/v1/users/admins/:id
// @ACCESS      Private (Superadmin only)
exports.updateAdmin = asyncHandler(async (req, res, next) => {
  const { email, assignedLGAs, assignedRDAs } = req.body;
  if (!email) return next(new ErrorResponse('No admin selected', 400));

  let updateFields = {};

  // const parseAssignedLGAs = JSON.parse(assignedLGAs)
  // const parseAssignedRDAs = JSON.parse(assignedRDAs)

  if (assignedLGAs) {
    const invalidLGAs = assignedLGAs.filter(lgaKey => !(lgaKey in LGAs))
    if (invalidLGAs.length > 0) {
      return next(new ErrorResponse(`Invalid assignedLGAs provided: ${invalidLGAs.join(", ")}`, 400));
    }
    updateFields.assignedLGAs = assignedLGAs.map(lgaKey => LGAs[lgaKey]);
  }

  if (assignedRDAs) {
    const invalidRDAs = assignedRDAs.filter(rdaKey => !(rdaKey in RDAs));
    if (invalidRDAs.length > 0) {
      return next(new ErrorResponse(`Invalid assignedRDAs provided: ${invalidRDAs.join(", ")}`, 400));
    }
    updateFields.assignedRDAs = assignedRDAs.map(rdaKey => RDAs[rdaKey]);
  }

  if (Object.keys(updateFields).length === 0) {
    return next(new ErrorResponse('Only assignedLGAs or assignedRDAs can be updated', 400));
  }

  const admin = await User.findOneAndUpdate(
    { email: email, role: "admin" },
    { $addToSet: updateFields },
    { new: true, runValidators: true }
  ).select("-password");

  if (!admin) {
    return next(new ErrorResponse("Admin not found", 404));
  }

  res.status(200).json({
    success: true,
    data: admin,
  });
});