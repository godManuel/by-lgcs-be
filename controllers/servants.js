const { RDAs, LGAs } = require("../config/serviceAreas.js");
const Servant = require("../models/Servant.js");
const User = require("../models/User.js");
const asyncHandler = require("../middlewares/async.js");
const ErrorResponse = require("../utils/errorResponse.js");
const cloudinary = require("../utils/cloudinary.js");
const fs = require("fs");
const { getRetirementStatus } = require("../utils/retireStatus.js");
const buildServantPayload = require("../utils/buildServantPayload.js");
const { createDraft } = require("../utils/createFormDraft.js");

// @DESC        Create Civil Servant Draft
// @ROUTE       POST  /api/v1/civil-servants/
// @ACCESS      Private
// exports.createCivilServantDraft = asyncHandler(async (req, res) => {
//   const servant = await Servant.create({
//     currentStep: 1,
//     formStatus: "draft",
//     admin: req.user.id,
//   });

//   await User.findByIdAndUpdate(req.user._id, {
//     $inc: {
//       "statistics.totalServants": 1,
//       "statistics.totalDrafts": 1,
//     },
//   });

//   res.status(201).json({
//     success: true,
//     data: servant,
//   });
// });

// @DESC        Update Civil Servant Personal Information
// @ROUTE       PATCH  /api/v1/civil-servants/
// @ACCESS      Private
exports.addPersonalInformation = asyncHandler(async (req, res, next) => {
  const { serviceArea } = req.body;
  const { role, assignedRDAs, assignedLGAs } = req.user;

  if (role === "superadmin") {
    return createDraft(req, res, next);
  }

  if (role === "admin") {
    const assignedLGAKeys = assignedLGAs
      .map((val) => Object.keys(LGAs).find((key) => LGAs[key] === val))
      .filter(Boolean);

    const assignedRDAKeys = assignedRDAs
      .map((val) => Object.keys(RDAs).find((key) => RDAs[key] === val))
      .filter(Boolean);

    const isLGAKey = Object.prototype.hasOwnProperty.call(LGAs, serviceArea);
    const isRDAKey = Object.prototype.hasOwnProperty.call(RDAs, serviceArea);

    if (
      (isLGAKey && assignedLGAKeys.includes(serviceArea)) ||
      (isRDAKey && assignedRDAKeys.includes(serviceArea))
    ) {
      return createDraft(req, res, next);
    }

    return next(new ErrorResponse("You are not assigned to this region", 403));
  }
});

// @DESC        Upload Civil Servant Biometric Photo
// @ROUTE       PATCH  /api/v1/civil-servants/:id/photo
// @ACCESS      Private
exports.uploadBiometricPhoto = asyncHandler(async (req, res, next) => {
  const { role, assignedRDAs, assignedLGAs } = req.user;

  const servant = await Servant.findById(req.params.id);

  if (!servant) {
    return next(new ErrorResponse("Servant not found", 404));
  }

  const { serviceArea, serviceRegion } = req.body;

  if (role === "superadmin") {
    const uploader = async (path) =>
      await cloudinary.uploads(path, "civil-servants");

    const newPath = await uploader(req.file.path);

    fs.unlinkSync(req.file.path);
    servant.displayPhoto = newPath.url;
    servant.currentStep = 2;

    await servant.save();

    res.json({
      success: true,
      message: "Biometric photo added successfully",
      data: servant,
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
      const uploader = async (path) =>
        await cloudinary.uploads(path, "civil-servants");

      const newPath = await uploader(req.file.path);

      fs.unlinkSync(req.file.path);
      servant.displayPhoto = newPath.url;
      servant.currentStep = 2;

      await servant.save();

      res.json({
        success: true,
        message: "Biometric photo added successfully",
        data: servant,
      });
    } else {
      return next(
        new ErrorResponse("You are not assigned to this region", 403),
      );
    }
  }
});

// @DESC        Select Civil Servant Documents for upload
// @ROUTE       PATCH  /api/v1/civil-servants/:id/document-selection
// @ACCESS      Private
exports.saveSelectedDocuments = asyncHandler(async (req, res, next) => {
  const { role, assignedRDAs, assignedLGAs } = req.user;

  const servant = await Servant.findById(req.params.id);

  if (!servant) {
    return next(new ErrorResponse("Servant not found", 404));
  }

  const { serviceArea, serviceRegion } = req.body;

  if (role === "superadmin") {
    servant.documentsSelected = Object.values(req.body).some((v) => v === true);

    Object.assign(servant, req.body);

    servant.currentStep = 3;

    await servant.save();

    res.json({
      success: true,
      message: "Documents for upload selected successfully",
      data: servant,
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
      servant.documentsSelected = Object.values(req.body).some(
        (v) => v === true,
      );

      Object.assign(servant, req.body);

      servant.currentStep = 3;

      await servant.save();

      res.json({
        success: true,
        message: "Documents for upload selected successfully",
        data: servant,
      });
    } else {
      return next(
        new ErrorResponse("You are not assigned to this region", 403),
      );
    }
  }
});

// @DESC        Submit Civil Servant Application
// @ROUTE       PATCH  /api/v1/civil-servants/:id/submit
// @ACCESS      Private
exports.submitCivilServant = asyncHandler(async (req, res, next) => {
  const { role, assignedRDAs, assignedLGAs } = req.user;

  const servant = await Servant.findById(req.params.id);

  if (!servant) {
    return next(new ErrorResponse("Servant not found", 404));
  }

  const { serviceArea, serviceRegion } = req.body;

  if (role === "superadmin") {
    servant.currentStep = 4;

    await servant.save();

    res.json({
      success: true,
      status: servant.formStatus,
      progress: servant.progress,
      message: "Civil Servant record completed",
      servant,
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
      servant.currentStep = 4;

      await servant.save();

      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          "statistics.completedServants": 1,
          "statistics.totalDrafts": -1,
        },
      });

      res.json({
        success: true,
        status: servant.formStatus,
        progress: servant.progress,
        message: "Civil Servant record completed",
        servant,
      });
    } else {
      return next(
        new ErrorResponse("You are not assigned to this region", 403),
      );
    }
  }
});

// @DESC        Add Civil Servant
// @ROUTE       POST  /api/v1/civil-servants/
// @ACCESS      Private
// exports.addCivilServant = asyncHandler(async (req, res, next) => {
//   const uploader = async (path) =>
//     await cloudinary.uploads(path, "civil-servants");

//   const { path } = req.file;
//   const newPath = await uploader(path);
//   fs.unlinkSync(path);

//   const { serviceArea, serviceRegion } = req.body;
//   const { role, assignedRDAs, assignedLGAs } = req.user;

//   // console.log(req.body);

//   const normalized = normalizeServiceArea(serviceRegion, serviceArea);

//   if (!normalized)
//     return res.status(400).json({ error: "Invalid serviceArea provided" });

//   const booleanFields = [
//     "hasFirstApptLetter",
//     "hasConfirmationLetter",
//     "hasLastPromLetter",
//     "hasProfessionalCert",
//     "hasFSLC",
//     "hasNCE",
//     "hasOND",
//     "hasHND",
//     "hasBL",
//     "hasLLB",
//     "hasLLD",
//     "hasLLM",
//     "hasNabteb",
//     "hasNabtebAdvanced",
//     "hasJchew",
//     "hasChew",
//     "hasNYSCORExemptionLetter",
//     "hasSSCE",
//     "hasFirstDegree",
//     "hasAgeDeclarationORBirthCert",
//     "hasLGACert",
//     "hasChangeOfName",
//     "hasAnyOtherCert",
//     "hasPGD",
//     "hasMasters",
//     "hasPhD",
//     "hasTradeTestOne",
//     "hasTradeTestTwo",
//     "hasTradeTestThree",
//     "hasCertificate",
//   ];

//   if (role === "superadmin") {
//     parseBooleanFields(req.body, booleanFields);

//     const servant = await Servant.create({
//       serviceRegion: req.body.serviceRegion,
//       serviceArea: normalized.value,
//       displayPhoto: newPath.url,
//       firstName: req.body.firstName,
//       middleName: req.body.middleName,
//       lastName: req.body.lastName,
//       sex: req.body.sex,
//       phone: req.body.phone,
//       dateOfBirth: req.body.dateOfBirth,
//       originLGA: req.body.originLGA,
//       firstApptDate: req.body.firstApptDate,
//       lastPromDate: req.body.lastPromDate,
//       duePromDate: req.body.duePromDate,
//       retireByAge: req.body.retireByAge,
//       retireByService: req.body.retireByService,
//       qualification: req.body.qualification,
//       department: req.body.department,
//       currentRank: req.body.currentRank,
//       currentGradeLevel: req.body.currentGradeLevel,
//       hasFirstApptLetter: req.body.hasFirstApptLetter,
//       hasConfirmationLetter: req.body.hasConfirmationLetter,
//       hasLastPromLetter: req.body.hasLastPromLetter,
//       hasProfessionalCert: req.body.hasProfessionalCert,
//       hasFSLC: req.body.hasFSLC,
//       hasSSCE: req.body.hasSSCE,
//       hasNCE: req.body.hasNCE,
//       hasOND: req.body.hasOND,
//       hasHND: req.body.hasHND,
//       hasBL: req.body.hasBL,
//       hasLLB: req.body.hasLLB,
//       hasLLD: req.body.hasLLD,
//       hasLLM: req.body.hasLLM,
//       hasNabteb: req.body.hasNabteb,
//       hasNabtebAdvanced: req.body.hasNabtebAdvanced,
//       hasJchew: req.body.hasJchew,
//       hasChew: req.body.hasChew,
//       hasFirstDegree: req.body.hasFirstDegree,
//       hasNYSCORExemptionLetter: req.body.hasNYSCORExemptionLetter,
//       hasMasters: req.body.hasMasters,
//       hasPhD: req.body.hasPhD,
//       hasNYSCORExemptionLetter: req.body.hasNYSCORExemptionLetter,
//       hasAgeDeclarationORBirthCert: req.body.hasAgeDeclarationORBirthCert,
//       hasLGACert: req.body.hasLGACert,
//       hasChangeOfName: req.body.hasChangeofName,
//       hasPGD: req.body.hasPGD,
//       hasTradeTestOne: req.body.hasTradeTestOne,
//       hasTradeTestTwo: req.body.hasTradeTestTwo,
//       hasTradeTestThree: req.body.hasTradeTestThree,
//       hasAnyOtherCert: req.body.hasAnyOtherCert,
//       hasCertificate: req.body.hasCertificate,
//     });

//     res.status(201).json({
//       success: true,
//       data: {
//         servant,
//       },
//     });
//   }

//   if (role === "admin") {
//     // Map assigned LGA/RDA values to their keys
//     const assignedLGAKeys = assignedLGAs
//       .map((val) => Object.keys(LGAs).find((key) => LGAs[key] === val))
//       .filter(Boolean);
//     const assignedRDAKeys = assignedRDAs
//       .map((val) => Object.keys(RDAs).find((key) => RDAs[key] === val))
//       .filter(Boolean);

//     // Check if serviceArea is a valid key in LGAs or RDAs
//     const isLGAKey = Object.prototype.hasOwnProperty.call(LGAs, serviceArea);
//     const isRDAKey = Object.prototype.hasOwnProperty.call(RDAs, serviceArea);

//     if (
//       (isLGAKey && assignedLGAKeys.includes(serviceArea)) ||
//       (isRDAKey && assignedRDAKeys.includes(serviceArea))
//     ) {
//       parseBooleanFields(req.body, booleanFields);

//       const servant = await Servant.create({
//         serviceRegion: req.body.serviceRegion,
//         serviceArea: normalized.value,
//         displayPhoto: newPath.url,
//         firstName: req.body.firstName,
//         middleName: req.body.middleName,
//         lastName: req.body.lastName,
//         sex: req.body.sex,
//         phone: req.body.phone, // Added phone field
//         dateOfBirth: req.body.dateOfBirth,
//         originLGA: req.body.originLGA,
//         firstApptDate: req.body.firstApptDate,
//         lastPromDate: req.body.lastPromDate,
//         duePromDate: req.body.duePromDate,
//         retireByAge: req.body.retireByAge,
//         retireByService: req.body.retireByService,
//         qualification: req.body.qualification,
//         department: req.body.department,
//         currentRank: req.body.currentRank,
//         currentGradeLevel: req.body.currentGradeLevel,
//         hasFirstApptLetter: req.body.hasFirstApptLetter,
//         hasConfirmationLetter: req.body.hasConfirmationLetter,
//         hasLastPromLetter: req.body.hasLastPromLetter,
//         hasProfessionalCert: req.body.hasProfessionalCert,
//         hasFSLC: req.body.hasFSLC,
//         hasSSCE: req.body.hasSSCE,
//         hasNCE: req.body.hasNCE,
//         hasOND: req.body.hasOND,
//         hasHND: req.body.hasHND,
//         hasBL: req.body.hasBL,
//         hasLLB: req.body.hasLLB,
//         hasLLD: req.body.hasLLD,
//         hasLLM: req.body.hasLLM,
//         hasNabteb: req.body.hasNabteb,
//         hasNabtebAdvanced: req.body.hasNabtebAdvanced,
//         hasJchew: req.body.hasJchew,
//         hasChew: req.body.hasChew,
//         hasFirstDegree: req.body.hasFirstDegree,
//         hasNYSCORExemptionLetter: req.body.hasNYSCORExemptionLetter,
//         hasMasters: req.body.hasMasters,
//         hasPhD: req.body.hasPhD,
//         hasNYSCORExemptionLetter: req.body.hasNYSCORExemptionLetter,
//         hasAgeDeclarationORBirthCert: req.body.hasAgeDeclarationORBirthCert,
//         hasLGACert: req.body.hasLGACert,
//         hasChangeOfName: req.body.hasChangeofName,
//         hasPGD: req.body.hasPGD,
//         hasTradeTestOne: req.body.hasTradeTestOne,
//         hasTradeTestTwo: req.body.hasTradeTestTwo,
//         hasTradeTestThree: req.body.hasTradeTestThree,
//         hasAnyOtherCert: req.body.hasAnyOtherCert,
//         hasCertificate: req.body.hasCertificate,
//       });

//       res.status(201).json({
//         success: true,
//         data: {
//           servant,
//         },
//       });
//     } else {
//       return next(
//         new ErrorResponse("You are not assigned to this region", 403),
//       );
//     }
//   }
// });

// @DESC        Get Civil Servant by advanced filtering
// @ROUTE       POST  /api/v1/civil-servants/
// @ACCESS      Private
exports.getCivilServants = asyncHandler(async (req, res, next) => {
  const { serviceArea, name } = req.query;
  const { role, assignedRDAs, assignedLGAs } = req.user;

  if (role === "superadmin") {
    const { success, nbHits, data, total, pagination } = res.advancedResults;

    const transResults = data.map(getRetirementStatus);

    res.status(200).json({
      success,
      total,
      nbHits,
      pagination,
      data: transResults,
    });
  }

  if (role === "admin") {
    if (req.query.serviceArea) {
      const normalize = (value = "") => value.toLowerCase().trim();

      const allowedAreas = [...assignedRDAs, ...assignedLGAs].map(normalize);

      if (!allowedAreas.includes(normalize(serviceArea))) {
        return next(
          new ErrorResponse("You are not assigned to this region", 403),
        );
      }

      const { success, total, nbHits, pagination, data } = res.advancedResults;

      const transformedData = data.map(getRetirementStatus);

      return res.status(200).json({
        success,
        total,
        nbHits,
        pagination,
        data: transformedData,
      });
    }

    if (req.query.name) {
      // Combine all service area mappings
      const allowedAreaValues = [...assignedRDAs, ...assignedLGAs].map((area) =>
        area.toLowerCase().trim(),
      );

      // Get search results (e.g., from advancedResults middleware)
      const results = res.advancedResults?.data || [];

      // Filter results based on service area access
      const normalize = (value = "") => value.toLowerCase().trim();

      const authorizedServants = results.filter((servant) =>
        allowedAreaValues.includes(normalize(servant.serviceArea)),
      );

      if (authorizedServants.length === 0) {
        return next(
          new ErrorResponse("You are not assigned to this region", 403),
        );
      }

      const transformedServants = authorizedServants.map(getRetirementStatus);

      res.advancedResults.data = transformedServants;
      res.advancedResults.nbHits = transformedServants.length;

      return res.status(200).json(res.advancedResults);
    }

    if (req.query.applicantID) {
      // Combine all service area mappings
      const allowedAreaValues = [...assignedRDAs, ...assignedLGAs].map((area) =>
        area.toLowerCase().trim(),
      );

      // Get result from advancedResults middleware
      const results = res.advancedResults?.data || [];

      // Usually applicantID returns a single servant, but we still use array to keep it consistent
      const normalize = (value = "") => value.toLowerCase().trim();

      const authorizedServants = results.filter((servant) =>
        allowedAreaValues.includes(normalize(servant.serviceArea)),
      );

      if (authorizedServants.length === 0) {
        return next(
          new ErrorResponse("You are not assigned to this region", 403),
        );
      }

      const transformedServants = authorizedServants.map(getRetirementStatus);

      res.advancedResults.data = transformedServants;
      res.advancedResults.nbHits = transformedServants.length;

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
        new ErrorResponse("You are not assigned to this region", 403),
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
      { new: true, runValidators: true },
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
    const allowedAreaValues = [...assignedRDAs, ...assignedLGAs].map((area) =>
      area.toLowerCase().trim(),
    );

    const servantArea = servant.serviceArea?.toLowerCase();

    // Step 3: Check if servant's serviceArea is in admin's assigned areas
    if (!allowedAreaValues.includes(servantArea)) {
      return next(
        new ErrorResponse("You are not assigned to this region", 403),
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
      },
    );

    return res.status(200).json({
      success: true,
      servant: updatedServant,
    });
  }
});

// @DESC        Delete Civil Servant
// @ROUTE       DELETE  /api/v1/civil-servants/:id
// @ACCESS      Private
exports.deleteCivilServant = asyncHandler(async (req, res, next) => {
  const { role, assignedRDAs, assignedLGAs } = req.user;
  const servantId = req.params.servantId;

  if (role === "superadmin") {
    const servant = await Servant.findById(servantId);
    if (!servant) return next(new ErrorResponse("Data not found!", 404));

    await Servant.findByIdAndDelete(servantId);

    return res.status(200).json({
      success: true,
      message: "Civil servant deleted successfully",
    });
  }

  if (role === "admin") {
    const servant = await Servant.findById(servantId);
    if (!servant)
      return next(new ErrorResponse("Civil servant not found", 404));

    // Combine RDAs and LGAs to match codes to actual area names
    const combinedServiceAreas = { ...RDAs, ...LGAs };
    const assignedKeys = [...assignedRDAs, ...assignedLGAs];
    const allowedAreaValues = assignedKeys
      .map((key) => combinedServiceAreas[key])
      .filter(Boolean)
      .map((area) => area.toLowerCase());

    const servantArea = servant.serviceArea?.toLowerCase();

    // Check if servant's serviceArea is in admin's assigned areas
    if (!allowedAreaValues.includes(servantArea)) {
      return next(
        new ErrorResponse("You are not assigned to this region", 403),
      );
    }

    await Servant.findByIdAndDelete(servantId);

    return res.status(200).json({
      success: true,
      message: "Civil servant deleted successfully",
    });
  }
});

// @DESC        Upload Certificates for Civil Servant
// @ROUTE       PATCH  /api/v1/civil-servants/:id/certificates
// @ACCESS      Private
exports.uploadCerts = asyncHandler(async (req, res, next) => {
  const { role, assignedRDAs, assignedLGAs } = req.user;

  let servant = await Servant.findById(req.params.id);
  if (!servant) return next(new ErrorResponse("Civil servant not found!", 404));

  if (role === "superadmin") {
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
      servant._id,
      { $push: { certificates: { $each: uploadedDocs } } },
      { new: true, runValidators: true },
    );

    const uploadedCount = uploadedDocs.length;

    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        "statistics.totalDocumentsUploaded": uploadedCount,
      },
    });

    res.status(200).json({
      success: true,
      data: { servant },
    });
  }

  if (role === "admin") {
    // Normalize values for comparison
    const normalize = (value = "") => value.toLowerCase().trim();

    // Get all areas assigned to the admin
    const allowedAreaValues = [
      ...(assignedRDAs || []),
      ...(assignedLGAs || []),
    ].map(normalize);

    const servantArea = normalize(servant.serviceArea);

    // Check if the admin is authorized to access this servant's service area
    if (!allowedAreaValues.includes(servantArea)) {
      return next(
        new ErrorResponse("You are not assigned to this region", 403),
      );
    }

    // Proceed with document upload
    const files = req.files;
    const docNames = req.body.names;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const parsedNames = Array.isArray(docNames)
      ? docNames
      : docNames
        ? [docNames]
        : [];

    const uploadedDocs = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const uploadResult = await cloudinary.uploads(file.path, {
        folder: "user_documents",
        resource_type: "auto",
      });

      uploadedDocs.push({
        name: parsedNames[i] || `Document ${i + 1}`,
        url: uploadResult.url,
      });

      // Delete temporary file
      fs.unlinkSync(file.path);
    }

    servant = await Servant.findByIdAndUpdate(
      servant._id,
      {
        $push: {
          certificates: {
            $each: uploadedDocs,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    const uploadedCount = uploadedDocs.length;

    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        "statistics.totalDocumentsUploaded": uploadedCount,
      },
    });

    return res.status(200).json({
      success: true,
      data: servant,
    });
  }
});
