const buildServantPayload = require("./buildServantPayload");
const Servant = require("../models/Servant");
const User = require("../models/User");
const Counter = require("../models/Counter");

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

  const counter = await Counter.findOneAndUpdate(
    {
      serviceRegion: servant.serviceRegion,
      serviceArea: servant.serviceArea,
    },
    {
      $inc: { sequence: 1 },
    },
    {
      new: true,
      upsert: true,
    },
  );

  servant.applicantID = `BY/LGSC/${serviceRegionCode}/${serviceAreaCode}/${counter.sequence
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
