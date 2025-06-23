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
    "hasPGD",
    "hasTradeTestOne",
    "hasTradeTestTwo",
    "hasTradeTestThree",
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
      department: req.body.department,
      currentRank: req.body.currentRank,
      currentGradeLevel: req.body.currentGradeLevel,
      hasFirstApptLetter: req.body.hasFirstApptLetter,
      hasConfirmationLetter: req.body.hasConfirmationLetter,
      hasLastPromLetter: req.body.hasLastPromLetter,
      hasProfessionalCert: req.body.hasProfessionalCert,
      hasFSLC: req.body.hasFSLC,
      hasSSCE: req.body.hasSSCE,
      hasNCEORDiploma: req.body.hasNCEORDiploma,
      hasFirstDegree: req.body.hasFirstDegree,
      hasAgeDeclarationORBirthCert: req.body.hasAgeDeclarationORBirthCert,
      hasLGACert: req.body.hasLGACert,
      hasChangeOfName: req.body.hasChangeofName,
      hasPGD: req.body.hasPGD,
      hasTradeTestOne: req.body.hasTradeTestOne,
      hasTradeTestTwo: req.body.hasTradeTestTwo,
      hasTradeTestThree: req.body.hasTradeTestThree,
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
    // Map assigned LGA/RDA values to their keys
    const assignedLGAKeys = assignedLGAs
      .map((val) => Object.keys(LGAs).find((key) => LGAs[key] === val))
      .filter(Boolean);
    const assignedRDAKeys = assignedRDAs
      .map((val) => Object.keys(RDAs).find((key) => RDAs[key] === val))
      .filter(Boolean);

    // Check if serviceArea is a valid key in LGAs or RDAs
    const isLGAKey = Object.prototype.hasOwnProperty.call(LGAs, serviceArea);
    const isRDAKey = Object.prototype.hasOwnProperty.call(RDAs, serviceArea);

    if (
      (isLGAKey && assignedLGAKeys.includes(serviceArea)) ||
      (isRDAKey && assignedRDAKeys.includes(serviceArea))
    ) {
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
        department: req.body.department,
        currentRank: req.body.currentRank,
        currentGradeLevel: req.body.currentGradeLevel,
        hasFirstApptLetter: req.body.hasFirstApptLetter,
        hasConfirmationLetter: req.body.hasConfirmationLetter,
        hasLastPromLetter: req.body.hasLastPromLetter,
        hasProfessionalCert: req.body.hasProfessionalCert,
        hasFSLC: req.body.hasFSLC,
        hasSSCE: req.body.hasSSCE,
        hasNCEORDiploma: req.body.hasNCEORDiploma,
        hasFirstDegree: req.body.hasFirstDegree,
        hasAgeDeclarationORBirthCert: req.body.hasAgeDeclarationORBirthCert,
        hasLGACert: req.body.hasLGACert,
        hasChangeOfName: req.body.hasChangeofName,
        hasPGD: req.body.hasPGD,
        hasTradeTestOne: req.body.hasTradeTestOne,
        hasTradeTestTwo: req.body.hasTradeTestTwo,
        hasTradeTestThree: req.body.hasTradeTestThree,
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
      const assignedLGAKeys = assignedLGAs
        .map((val) => Object.keys(LGAs).find((key) => LGAs[key] === val))
        .filter(Boolean);
      const assignedRDAKeys = assignedRDAs
        .map((val) => Object.keys(RDAs).find((key) => RDAs[key] === val))
        .filter(Boolean);

      // Check if serviceArea is a valid key in LGAs or RDAs
      const isLGAKey = Object.prototype.hasOwnProperty.call(LGAs, serviceArea);
      const isRDAKey = Object.prototype.hasOwnProperty.call(RDAs, serviceArea);

      if (
        (isLGAKey && assignedLGAKeys.includes(serviceArea)) ||
        (isRDAKey && assignedRDAKeys.includes(serviceArea))
      ) {
        res.status(200).json(res.advancedResults);
      } else {
        return next(
          new ErrorResponse("You are not assigned to this region", 403)
        );
      }
    }

    if (req.query.name) {
      // Combine all service area mappings
      const combinedServiceAreas = {
        ...RDAs,
        ...LGAs,
      };

      // Get all assigned region codes and map them to their actual names
      const assignedKeys = [...assignedRDAs, ...assignedLGAs];
      const allowedAreaValues = assignedKeys
        .map((key) => combinedServiceAreas[key])
        .filter(Boolean)
        .map((area) => area.toLowerCase()); // Normalize for comparison

      // Get search results (e.g., from advancedResults middleware)
      const results = res.advancedResults?.data || [];

      // Filter results based on service area access
      const authorizedServants = results.filter((servant) =>
        allowedAreaValues.includes(servant.serviceArea?.toLowerCase())
      );

      if (authorizedServants.length === 0) {
        return next(
          new ErrorResponse("You are not assigned to this region", 403)
        );
      }

      // Replace data in advancedResults and return
      res.advancedResults.data = authorizedServants;
      res.advancedResults.nbHits = authorizedServants.length;

      return res.status(200).json(res.advancedResults);
    }

    if (req.query.applicantID) {
      // Combine all service area mappings
      const combinedServiceAreas = {
        ...RDAs,
        ...LGAs,
      };

      // Get all assigned region codes and map them to actual service area values
      const assignedKeys = [...assignedRDAs, ...assignedLGAs];
      const allowedAreaValues = assignedKeys
        .map((key) => combinedServiceAreas[key])
        .filter(Boolean)
        .map((area) => area.toLowerCase()); // Normalize for comparison

      // Get result from advancedResults middleware
      const results = res.advancedResults?.data || [];

      // Usually applicantID returns a single servant, but we still use array to keep it consistent
      const authorizedServants = results.filter((servant) =>
        allowedAreaValues.includes(servant.serviceArea?.toLowerCase())
      );

      if (authorizedServants.length === 0) {
        return next(
          new ErrorResponse("You are not assigned to this region", 403)
        );
      }

      // Replace data in advancedResults and return
      res.advancedResults.data = authorizedServants;
      res.advancedResults.nbHits = authorizedServants.length;

      return res.status(200).json(res.advancedResults);
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
    const servantId = req.params.servantId;

    // Step 1: Fetch the servant by ID
    const servant = await Servant.findById(servantId);
    if (!servant) {
      return next(new ErrorResponse("Civil servant not found", 404));
    }

    // Step 2: Combine RDAs and LGAs to match codes to actual area names
    const combinedServiceAreas = {
      ...RDAs,
      ...LGAs,
    };

    const assignedKeys = [...assignedRDAs, ...assignedLGAs];
    const allowedAreaValues = assignedKeys
      .map((key) => combinedServiceAreas[key])
      .filter(Boolean)
      .map((area) => area.toLowerCase());

    const servantArea = servant.serviceArea?.toLowerCase();

    // Step 3: Check if servant's serviceArea is in admin's assigned areas
    if (!allowedAreaValues.includes(servantArea)) {
      return next(
        new ErrorResponse("You are not assigned to this region", 403)
      );
    }

    // Step 4: Proceed with the update
    const updatedServant = await Servant.findByIdAndUpdate(
      servantId,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      servant: updatedServant,
    });
  }
});

// @DESC        Upload Certificates for Civil Servant
// @ROUTE       POST  /api/v1/civil-servants/:id/certificates
// @ACCESS      Private
exports.uploadCerts = asyncHandler(async (req, res, next) => {
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
      { $set: { certificates: { $each: uploadedDocs } } },
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
    const servantId = req.params.servantId;

    // Step 1: Fetch the servant by ID
    let servant = await Servant.findById(servantId);
    if (!servant) {
      return next(new ErrorResponse("Civil servant not found", 404));
    }

    // Step 2: Combine RDAs and LGAs to match codes to actual area names
    const combinedServiceAreas = {
      ...RDAs,
      ...LGAs,
    };

    const assignedKeys = [...assignedRDAs, ...assignedLGAs];
    const allowedAreaValues = assignedKeys
      .map((key) => combinedServiceAreas[key])
      .filter(Boolean)
      .map((area) => area.toLowerCase());

    const servantArea = servant.serviceArea?.toLowerCase();

    // Step 3: Check if servant's serviceArea is in admin's assigned areas
    if (!allowedAreaValues.includes(servantArea)) {
      return next(
        new ErrorResponse("You are not assigned to this region", 403)
      );
    }

    // Step 4: Proceed with the update
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
      { $set: { certificates: { $each: uploadedDocs } } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: { servant },
    });
  }
});
