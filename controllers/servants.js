const Servant = require("../models/Servant.js");
const asyncHandler = require("../middlewares/async.js");
const ErrorResponse = require("../utils/errorResponse.js");
const cloudinary = require("../utils/cloudinary.js");
const fs = require("fs");

// @DESC        Add Civil Servant
// @ROUTE       POST  /api/v1/civil-servants/
// @ACCESS      Private
exports.addCivilServant = asyncHandler(async (req, res, next) => {
  const uploader = async (path) =>
    await cloudinary.uploads(path, "civil-servants");

  const { path } = req.file;
  const newPath = await uploader(path);
  fs.unlinkSync(path);
  // const urls = [];
  // const files = req.files;
  // for (const file of files) {

  // }

  console.log(newPath);

  const { serviceArea } = req.body;
  const { role, assignedRDAs, assignedLGAs } = req.user;

  if (role === "superadmin") {
    const servant = await Servant.create({
      serviceRegion: req.body.serviceRegion,
      serviceArea: req.body.serviceArea,
      displayPhoto: newPath.url,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      sex: req.body.sex,
      dateOfBirth: req.body.dateOfBirth,
      originLGA: req.body.originLGA,
      firstApptDate: req.body.firstApptDate,
      lastPromDate: req.body.lastPromDate,
      retireDate: req.body.retireDate,
      qualification: req.body.qualification,
      currentRank: req.body.currentRank,
      currentGradeLevel: req.body.currentGradeLevel,
    });

    res.status(201).json({
      success: true,
      data: {
        servant,
      },
    });
  }

  if (role === "admin") {
    if (
      assignedLGAs.includes(serviceArea) ||
      assignedRDAs.includes(serviceArea)
    ) {
      const servant = await Servant.create({
        serviceRegion: req.body.serviceRegion,
        serviceArea: req.body.serviceArea,
        displayPhoto: newPath.url,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        sex: req.body.sex,
        dateOfBirth: req.body.dateOfBirth,
        originLGA: req.body.originLGA,
        firstApptDate: req.body.firstApptDate,
        lastPromDate: req.body.lastPromDate,
        retireDate: req.body.retireDate,
        qualification: req.body.qualification,
        currentRank: req.body.currentRank,
        currentGradeLevel: req.body.currentGradeLevel,
      });

      res.status(201).json({
        success: true,
        data: {
          servant,
        },
      });
    } else {
      return next(
        new ErrorResponse("You are not assigned to this region", 403)
      );
    }
  }
});

// @DESC        Get Civil Servant by advanced filtering
// @ROUTE       POST  /api/v1/civil-servants/
// @ACCESS      Private
exports.getCivilServants = asyncHandler(async (req, res, next) => {
  const { serviceArea } = req.query;
  const { role, assignedRDAs, assignedLGAs } = req.user;

  if (role === "superadmin") {
    res.status(200).json(res.advancedResults);
  }

  if (role === "admin") {
    if (
      assignedLGAs.includes(serviceArea) ||
      assignedRDAs.includes(serviceArea)
    ) {
      res.status(200).json(res.advancedResults);
    } else {
      return next(
        new ErrorResponse("You are not assigned to this region", 403)
      );
    }
  }
});

// @DESC        Get Civil Servant
// @ROUTE       POST  /api/v1/civil-servants/:id
// @ACCESS      Private
exports.getCivilServant = asyncHandler(async (req, res, next) => {
  const { serviceArea } = req.body;
  const { role, assignedRDAs, assignedLGAs } = req.user;

  if (role === "superadmin") {
    const servant = await Servant.findById(req.params.servantId);
    if (!servant) return next(new ErrorResponse("Data not found!", 404));

    res.status(200).json({
      success: true,
      data: { servant },
    });
  }

  if (role === "admin") {
    if (
      assignedLGAs.includes(serviceArea) ||
      assignedRDAs.includes(serviceArea)
    ) {
      const servant = await Servant.findById(req.params.servantId);
      if (!servant) return next(new ErrorResponse("Data not found!", 404));

      res.status(200).json({
        success: true,
        data: { servant },
      });
    } else {
      return next(
        new ErrorResponse("You are not assigned to this region", 403)
      );
    }
  }
});
