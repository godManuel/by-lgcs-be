const User = require("../models/User.js");
const Servant = require("../models/Servant.js");
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
    const invalidLGAs = assignedLGAs.filter((lgaKey) => !(lgaKey in LGAs));
    if (invalidLGAs.length > 0) {
      return next(
        new ErrorResponse(
          `Invalid assignedLGAs provided: ${invalidLGAs.join(", ")}`,
          400
        )
      );
    }
    updateFields.assignedLGAs = assignedLGAs.map((lgaKey) => LGAs[lgaKey]);
  }

  if (assignedRDAs) {
    const invalidRDAs = assignedRDAs.filter((rdaKey) => !(rdaKey in RDAs));
    if (invalidRDAs.length > 0) {
      return next(
        new ErrorResponse(
          `Invalid assignedRDAs provided: ${invalidRDAs.join(", ")}`,
          400
        )
      );
    }
    updateFields.assignedRDAs = assignedRDAs.map((rdaKey) => RDAs[rdaKey]);
  }

  if (Object.keys(updateFields).length === 0) {
    return next(
      new ErrorResponse("Only assignedLGAs or assignedRDAs can be updated", 400)
    );
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
      password: req.body.password,
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
    data: admins,
  });
});

// @DESC        Update an admin's details. Only allowed for Superadmin
// @ROUTE       PUT /api/v1/users/admins/:id
// @ACCESS      Private (Superadmin only)
exports.updateAdmin = asyncHandler(async (req, res, next) => {
  const { email, assignedLGAs, assignedRDAs } = req.body;
  if (!email) return next(new ErrorResponse("No admin selected", 400));

  let updateFields = {};

  // const parseAssignedLGAs = JSON.parse(assignedLGAs)
  // const parseAssignedRDAs = JSON.parse(assignedRDAs)

  if (assignedLGAs) {
    const invalidLGAs = assignedLGAs.filter((lgaKey) => !(lgaKey in LGAs));
    if (invalidLGAs.length > 0) {
      return next(
        new ErrorResponse(
          `Invalid assignedLGAs provided: ${invalidLGAs.join(", ")}`,
          400
        )
      );
    }
    updateFields.assignedLGAs = assignedLGAs.map((lgaKey) => LGAs[lgaKey]);
  }

  if (assignedRDAs) {
    const invalidRDAs = assignedRDAs.filter((rdaKey) => !(rdaKey in RDAs));
    if (invalidRDAs.length > 0) {
      return next(
        new ErrorResponse(
          `Invalid assignedRDAs provided: ${invalidRDAs.join(", ")}`,
          400
        )
      );
    }
    updateFields.assignedRDAs = assignedRDAs.map((rdaKey) => RDAs[rdaKey]);
  }

  if (Object.keys(updateFields).length === 0) {
    return next(
      new ErrorResponse("Only assignedLGAs or assignedRDAs can be updated", 400)
    );
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
// @DESC        Remove assignedLGAs or assignedRDAs from an admin
// @ROUTE       PUT /api/v1/users/admins/remove-areas
// @ACCESS      Private (Superadmin only)
exports.removeAdminAreas = asyncHandler(async (req, res, next) => {
  const { email, removeLGAs, removeRDAs } = req.body;
  if (!email) return next(new ErrorResponse("No admin selected", 400));

  // Find the admin first
  const admin = await User.findOne({ email: email, role: "admin" });
  if (!admin) {
    return next(new ErrorResponse("Admin not found", 404));
  }

  let update = {};

  // Check LGAs
  if (removeLGAs && removeLGAs.length > 0) {
    const invalidLGAs = removeLGAs.filter((lgaKey) => !(lgaKey in LGAs));
    if (invalidLGAs.length > 0) {
      return next(
        new ErrorResponse(
          `Invalid LGAs provided: ${invalidLGAs.join(", ")}`,
          400
        )
      );
    }
    const lgaValues = removeLGAs.map((lgaKey) => LGAs[lgaKey]);
    const notAssignedLGAs = lgaValues.filter(
      (lga) => !admin.assignedLGAs.includes(lga)
    );
    if (notAssignedLGAs.length > 0) {
      return next(
        new ErrorResponse(
          `Some LGAs are not assigned to this admin: ${notAssignedLGAs.join(
            ", "
          )}`,
          400
        )
      );
    }
    update["assignedLGAs"] = { $in: lgaValues };
  }

  // Check RDAs
  if (removeRDAs && removeRDAs.length > 0) {
    const invalidRDAs = removeRDAs.filter((rdaKey) => !(rdaKey in RDAs));
    if (invalidRDAs.length > 0) {
      return next(
        new ErrorResponse(
          `Invalid RDAs provided: ${invalidRDAs.join(", ")}`,
          400
        )
      );
    }
    const rdaValues = removeRDAs.map((rdaKey) => RDAs[rdaKey]);
    const notAssignedRDAs = rdaValues.filter(
      (rda) => !admin.assignedRDAs.includes(rda)
    );
    if (notAssignedRDAs.length > 0) {
      return next(
        new ErrorResponse(
          `Some RDAs are not assigned to this admin: ${notAssignedRDAs.join(
            ", "
          )}`,
          400
        )
      );
    }
    update["assignedRDAs"] = { $in: rdaValues };
  }

  if (Object.keys(update).length === 0) {
    return next(new ErrorResponse("No LGAs or RDAs provided for removal", 400));
  }

  const updatedAdmin = await User.findOneAndUpdate(
    { email: email, role: "admin" },
    { $pull: update },
    { new: true }
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Areas removed successfully",
    data: updatedAdmin,
  });
});

exports.fixServiceArea = asyncHandler(async (req, res) => {
  try {
    const BATCH_SIZE = 20;
    const query = { serviceArea: "Alabiri (Ekeremor)" };
    const totalToUpdate = await Servant.countDocuments(query);
    console.log(`Total records to update: ${totalToUpdate}`);

    if (totalToUpdate === 0) {
      return res.status(200).json({ message: "No records to update." });
    }

    const totalBatches = Math.ceil(totalToUpdate / BATCH_SIZE);
    let updatedCount = 0;

    for (let i = 0; i < totalBatches; i++) {
      const users = await Servant.find(query).limit(BATCH_SIZE);

      const userIds = users.map((user) => user._id);

      await Servant.updateMany(
        { _id: { $in: userIds } },
        { $set: { serviceArea: "Aleibiri (Ekeremor)" } }
      );

      updatedCount += users.length;

      // Optional: Introduce a small delay to prevent DB overload
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
    }

    return res.status(200).json({
      message: `Successfully updated ${updatedCount} records from "Alaibiri (Ekeremor)" to "Aleibiri (Ekeremor)".`,
    });
  } catch (error) {
    console.error("Error updating serviceArea:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});
