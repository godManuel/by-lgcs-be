const buildServantPayload = require("./buildServantPayload");
const Servant = require("../models/Servant");
const User = require("../models/User");

exports.createDraft = async (req, res, next) => {
  const servant = new Servant({
    ...buildServantPayload(req.body),
    currentStep: 1,
    formStatus: "draft",
    createdBy: req.user._id,
  });

  // Generate Applicant ID
  const serviceAreaCode = servant.serviceArea.substring(0, 3).toUpperCase();

  const serviceRegionCode = servant.serviceRegion.toUpperCase();

  const servantCount = await Servant.countDocuments({
    serviceArea: servant.serviceArea,
  });

  servant.applicantID = `BY/LGSC/${serviceRegionCode}/${serviceAreaCode}/${(
    servantCount + 1
  )
    .toString()
    .padStart(3, "0")}`;

  await servant.save();

  await User.findByIdAndUpdate(req.user._id, {
    $inc: {
      "statistics.totalServants": 1,
      "statistics.totalDrafts": 1,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Personal information saved successfully.",
    data: servant,
  });
};
