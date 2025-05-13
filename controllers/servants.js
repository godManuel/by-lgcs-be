const { RDAs, LGAs } = require("../config/serviceAreas.js");
const { parseBooleanFields } = require("../utils/parseBooleanFields.js");
const { normalizeServiceArea } = require("../utils/normalizeServiceArea.js");
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

  const { serviceArea, serviceRegion } = req.body;
  const { role, assignedRDAs, assignedLGAs } = req.user;

  // console.log(req.body);

  const normalized = normalizeServiceArea(serviceRegion, serviceArea);

  if (!normalized)
    return res.status(400).json({ error: "Invalid serviceArea provided" });

  const booleanFields = [
    "hasFirstApptLetter",
    "hasConfirmationLetter",
    "hasLastPromLetter",
    "hasProfessionalCert",
    "hasFSLC",
    "hasSSCE",
    "hasFirstDegree",
    "hasAgeDeclarationORBirthCert",
    "hasLGACert",
    "hasChangeOfName",
    "hasAnyOtherCert",
  ];

  if (role === "superadmin") {
    parseBooleanFields(req.body, booleanFields);

    const servant = await Servant.create({
      serviceRegion: req.body.serviceRegion,
      serviceArea: normalized.value,
      displayPhoto: newPath.url,
      firstName: req.body.firstName,
      middleName: req.body.middleName,
      lastName: req.body.lastName,
      sex: req.body.sex,
      dateOfBirth: req.body.dateOfBirth,
      originLGA: req.body.originLGA,
      firstApptDate: req.body.firstApptDate,
      lastPromDate: req.body.lastPromDate,
      duePromDate: req.body.duePromDate,
      retireDate: req.body.retireDate,
      qualification: req.body.qualification,
      currentRank: req.body.currentRank,
      currentGradeLevel: req.body.currentGradeLevel,
      hasFirstApptLetter: req.body.hasFirstApptLetter,
      hasConfirmationLetter: req.body.hasConfirmationLetter,
      hasLastPromLetter: req.body.hasLastPromLetter,
      hasProfessionalCert: req.body.hasProfessionalCert,
      hasFSLC: req.body.hasFSLC,
      hasSSCE: req.body.hasSSCE,
      hasFirstDegree: req.body.hasFirstDegree,
      hasAgeDeclarationORBirthCert: req.body.hasAgeDeclarationORBirthCert,
      hasLGACert: req.body.hasLGACert,
      hasChangeOfName: req.body.hasChangeofName,
      hasAnyOtherCert: req.body.hasAnyOtherCert,
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
      parseBooleanFields(req.body, booleanFields);

      const servant = await Servant.create({
        serviceRegion: req.body.serviceRegion,
        serviceArea: normalized.value,
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
        hasFirstApptLetter: req.body.hasFirstApptLetter,
        hasConfirmationLetter: req.body.hasConfirmationLetter,
        hasLastPromLetter: req.body.hasLastPromLetter,
        hasProfessionalCert: req.body.hasProfessionalCert,
        hasFSLC: req.body.hasFSLC,
        hasSSCE: req.body.hasSSCE,
        hasFirstDegree: req.body.hasFirstDegree,
        hasAgeDeclarationORBirthCert: req.body.hasAgeDeclarationORBirthCert,
        hasLGACert: req.body.hasLGACert,
        hasChangeOfName: req.body.hasChangeofName,
        hasAnyOtherCert: req.body.hasAnyOtherCert,
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
  const { serviceArea, name } = req.query;
  const { role, assignedRDAs, assignedLGAs } = req.user;

  if (role === "superadmin") {
    res.status(200).json(res.advancedResults);
  }

  if (role === "admin") {
    if (req.query.serviceArea) {
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

    if (req.query.name) {
      const { name } = req.query;

      // Combine all service area mappings
      const combinedServiceAreas = {
        ...RDAs,
        ...LGAs,
      };

      // All assigned area codes (e.g., ['RDA001', 'LGA002'])
      const assignedKeys = [...assignedRDAs, ...assignedLGAs];

      // Allowed values from those keys (e.g., ['Yenagoa', 'Sagbama'])
      const allowedAreaValues = assignedKeys
        .map((key) => combinedServiceAreas[key])
        .filter(Boolean);

      // Step 1: Search servants by name
      const servants = await Servant.find({
        $or: [
          { firstName: { $regex: name, $options: "i" } },
          { lastName: { $regex: name, $options: "i" } },
        ],
      });

      if (servants.length === 0) {
        return next(new ErrorResponse("No servants found!", 403));
      }

      // Step 2: Filter by allowed service areas
      const authorizedServants = servants.filter((servant) =>
        allowedAreaValues.includes(servant.serviceArea)
      );

      if (authorizedServants.length === 0) {
        return next(
          new ErrorResponse("You are not assigned to this region", 403)
        );
      }

      // Step 3: Return only authorized servants
      return res.status(200).json({
        success: true,
        count: authorizedServants.length,
        data: authorizedServants,
      });
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

// @DESC        Update Civil Servant
// @ROUTE       POST  /api/v1/civil-servants/:id
// @ACCESS      Private
exports.updateCivilServant = asyncHandler(async (req, res, next) => {
  const { serviceArea } = req.body;
  const { role, assignedRDAs, assignedLGAs } = req.user;

  if (role === "superadmin") {
    let servant = await Servant.findById(req.params.servantId);
    if (!servant) return next(new ErrorResponse("Data not found!", 404));

    servant = await Servant.findByIdAndUpdate(
      req.params.servantId,
      {
        $set: req.body,
      },
      { new: true, runValidators: true }
    );

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

      servant = await Servant.findByIdAndUpdate(
        req.params.servantId,
        {
          $set: req.body,
        },
        { new: true, runValidators: true }
      );

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

// @DESC        Upload Certificates for Civil Servant
// @ROUTE       POST  /api/v1/civil-servants/:id/certificates
// @ACCESS      Private
exports.uploadCerts = asyncHandler(async (req, res, next) => {
  const { serviceArea } = req.body;
  const { role, assignedRDAs, assignedLGAs } = req.user;

  if (role === "superadmin") {
    let servant = await Servant.findById(req.params.servantId);
    if (!servant) return next(new ErrorResponse("Data not found!", 404));

    // const userId = req.params.userId;
    const files = req.files;
    const docNames = req.body.names;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const parsedNames = Array.isArray(docNames) ? docNames : [docNames];

    const uploadedDocs = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadResult = await cloudinary.uploads(file.path, {
        folder: "user_documents",
        resource_type: "auto",
      });

      console.log(uploadResult);

      uploadedDocs.push({
        name: parsedNames[i] || `Document ${i + 1}`,
        url: uploadResult.url,
      });

      fs.unlinkSync(file.path); // clean up temp file
    }

    servant = await Servant.findByIdAndUpdate(
      servant,
      { $push: { certificates: { $each: uploadedDocs } } },
      { new: true, runValidators: true }
    );
    // servant = await Servant.findByIdAndUpdate(
    //   req.params.servantId,
    //   {
    //     $set: {
    //       certificates: [certificates],
    //     },
    //   },
    //   { new: true, runValidators: true }
    // );

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

      const certificates = req.files.map((file, index) => ({
        name: req.body[`certName${index}`] || file.originalname,
        url: file.path,
      }));

      servant = await Servant.findByIdAndUpdate(
        req.params.servantId,
        {
          $set: certificates,
        },
        { new: true, runValidators: true }
      );

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
