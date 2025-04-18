const asyncHandler = require("../middlewares/async.js");
const serviceAreas = require("../config/serviceAreas.js");

exports.getRDAs = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: serviceAreas.RDAs,
  });
});

exports.getLGAs = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: serviceAreas.LGAs,
  });
});
