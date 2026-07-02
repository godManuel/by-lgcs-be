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
// exports.addPersonalInformation = asyncHandler(async (req, res, next) => {
//   const { serviceArea } = req.body;
//   const { role, assignedRDAs, assignedLGA } = req.user;

//   if (role === "superadmin") {
//     return createDraft(req, res, next);
//   }

//   if (role === "admin" || role === "coordinator") {
//     const assignedLGAKeys = assignedLGAs
//       .map((val) => Object.keys(LGAs).find((key) => LGAs[key] === val))
//       .filter(Boolean);

//     const assignedRDAKeys = assignedRDAs
//       .map((val) => Object.keys(RDAs).find((key) => RDAs[key] === val))
//       .filter(Boolean);

//     const isLGAKey = Object.prototype.hasOwnProperty.call(LGAs, serviceArea);
//     const isRDAKey = Object.prototype.hasOwnProperty.call(RDAs, serviceArea);

//     if (
//       (isLGAKey && assignedLGAKeys.includes(serviceArea)) ||
//       (isRDAKey && assignedRDAKeys.includes(serviceArea))
//     ) {
//       return createDraft(req, res, next);
//     }

//     return next(new ErrorResponse("You are not assigned to this region", 403));
//   }
// });
exports.addPersonalInformation = asyncHandler(async (req, res, next) => {
  const { serviceArea } = req.body;
  const { role, assignedLGA } = req.user;

  if (role === "superadmin") {
    return createDraft(req, res, next);
  }

  if (role === "admin" || role === "coordinator" || role === "coordinator") {
    const assignedLGAKey = Object.keys(LGAs).find(
      (key) => LGAs[key] === assignedLGA,
    );

    if (assignedLGAKey === serviceArea) {
      return createDraft(req, res, next);
    }

    return next(new ErrorResponse("You are not assigned to this LGA", 403));
  }
});

// @DESC        Upload Civil Servant Biometric Photo
// @ROUTE       PATCH  /api/v1/civil-servants/:id/photo
// @ACCESS      Private
exports.uploadBiometricPhoto = asyncHandler(async (req, res, next) => {
  const { role, assignedLGA } = req.user;

  const servant = await Servant.findById(req.params.id);

  if (!servant) {
    return next(new ErrorResponse("Servant not found", 404));
  }

  if (!req.file) {
    return next(
      new ErrorResponse("Please upload a biometric photograph.", 400),
    );
  }

  // Only Admins/Coordinators are restricted by LGA
  if (role !== "superadmin") {
    if (role !== "admin" && role !== "coordinator") {
      return next(new ErrorResponse("Unauthorized", 403));
    }

    const assignedLGAKey = Object.keys(LGAs).find(
      (key) => LGAs[key] === assignedLGA,
    );

    if (assignedLGAKey !== servant.serviceArea) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return next(new ErrorResponse("You are not assigned to this LGA", 403));
    }
  }

  try {
    const uploadedPhoto = await cloudinary.uploads(
      req.file.path,
      "civil-servants",
    );

    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    servant.displayPhoto = uploadedPhoto.url;
    servant.currentStep = 2;

    await servant.save();

    return res.status(200).json({
      success: true,
      message: "Biometric photo added successfully",
      data: servant,
    });
  } catch (err) {
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return next(
      new ErrorResponse(err.message || "Error uploading biometric photo.", 500),
    );
  }
});

// @DESC        Select Civil Servant Documents for upload
// @ROUTE       PATCH  /api/v1/civil-servants/:id/document-selection
// @ACCESS      Private
exports.saveSelectedDocuments = asyncHandler(async (req, res, next) => {
  const { role, assignedRDAs, assignedLGA } = req.user;

  const servant = await Servant.findById(req.params.id);

  if (!servant) {
    return next(new ErrorResponse("Servant not found", 404));
  }

  const { serviceArea } = req.body;

  if (role === "superadmin") {
    servant.documentsSelected = Object.values(req.body).some(
      (value) => value === true,
    );

    Object.assign(servant, req.body);

    servant.currentStep = 3;

    await servant.save();

    return res.json({
      success: true,
      message: "Documents for upload selected successfully",
      data: servant,
    });
  }

  if (role === "admin" || role === "coordinator" || role === "coordinator") {
    // Convert the assigned LGA value back to its corresponding key
    const assignedLGAKey = Object.keys(LGAs).find(
      (key) => LGAs[key] === assignedLGA,
    );

    // Convert assigned RDA values back to their corresponding keys
    const assignedRDAKeys = (assignedRDAs || [])
      .map((value) => Object.keys(RDAs).find((key) => RDAs[key] === value))
      .filter(Boolean);

    // Determine whether the submitted serviceArea is an LGA or RDA
    const isLGAKey = Object.prototype.hasOwnProperty.call(LGAs, serviceArea);
    const isRDAKey = Object.prototype.hasOwnProperty.call(RDAs, serviceArea);

    // Allow access only if the admin is assigned to the selected LGA or RDA
    if (
      (isLGAKey && assignedLGAKey === serviceArea) ||
      (isRDAKey && assignedRDAKeys.includes(serviceArea))
    ) {
      servant.documentsSelected = Object.values(req.body).some(
        (value) => value === true,
      );

      Object.assign(servant, req.body);

      servant.currentStep = 3;

      await servant.save();

      return res.json({
        success: true,
        message: "Documents for upload selected successfully",
        data: servant,
      });
    }

    return next(new ErrorResponse("You are not assigned to this region", 403));
  }

  return next(new ErrorResponse("Unauthorized", 403));
});

// @DESC        Submit Civil Servant Application
// @ROUTE       PATCH  /api/v1/civil-servants/:id/submit
// @ACCESS      Private
exports.submitCivilServant = asyncHandler(async (req, res, next) => {
  const { role, assignedRDAs, assignedLGA } = req.user;

  const servant = await Servant.findById(req.params.id);

  if (!servant) {
    return next(new ErrorResponse("Servant not found", 404));
  }

  const { serviceArea } = req.body;

  if (role === "superadmin") {
    servant.currentStep = 4;

    await servant.save();

    return res.json({
      success: true,
      status: servant.formStatus,
      progress: servant.progress,
      message: "Civil Servant record completed",
      servant,
    });
  }

  if (role === "admin" || role === "coordinator" || role === "coordinator") {
    // Convert the assigned LGA value back to its corresponding key
    const assignedLGAKey = Object.keys(LGAs).find(
      (key) => LGAs[key] === assignedLGA,
    );

    // Convert assigned RDA values back to their corresponding keys
    const assignedRDAKeys = (assignedRDAs || [])
      .map((value) => Object.keys(RDAs).find((key) => RDAs[key] === value))
      .filter(Boolean);

    // Determine whether the submitted serviceArea is an LGA or RDA
    const isLGAKey = Object.prototype.hasOwnProperty.call(LGAs, serviceArea);
    const isRDAKey = Object.prototype.hasOwnProperty.call(RDAs, serviceArea);

    // Check whether the admin is authorized to submit this servant
    if (
      (isLGAKey && assignedLGAKey === serviceArea) ||
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

      return res.json({
        success: true,
        status: servant.formStatus,
        progress: servant.progress,
        message: "Civil Servant record completed",
        servant,
      });
    }

    return next(new ErrorResponse("You are not assigned to this region", 403));
  }

  return next(new ErrorResponse("Unauthorized", 403));
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

//   if (role === "admin" || role === "coordinator" || role === "coordinator") {
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
  const { search } = req.query;
  const { role, assignedRDAs, assignedLGA } = req.user;

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

  if (role === "admin" || role === "coordinator") {
    const normalize = (value = "") => value.toLowerCase().trim();

    // Coordinator/Admin can only access their assigned LGA (+ RDAs if applicable)
    const allowedAreaValues = [assignedLGA, ...(assignedRDAs || [])]
      .filter(Boolean)
      .map(normalize);

    // Handle universal search
    if (req.query.search) {
      const results = res.advancedResults?.data || [];

      const authorizedServants = results.filter((servant) =>
        allowedAreaValues.includes(normalize(servant.serviceArea)),
      );

      if (!authorizedServants.length) {
        return next(
          new ErrorResponse("You are not assigned to this region", 403),
        );
      }

      const transformedServants = authorizedServants.map(getRetirementStatus);

      return res.status(200).json({
        ...res.advancedResults,
        nbHits: transformedServants.length,
        data: transformedServants,
      });
    }

    // No search supplied — return all servants belonging to the user's area
    const results = res.advancedResults?.data || [];

    const authorizedServants = results.filter((servant) =>
      allowedAreaValues.includes(normalize(servant.serviceArea)),
    );

    const transformedServants = authorizedServants.map(getRetirementStatus);

    return res.status(200).json({
      ...res.advancedResults,
      total: transformedServants.length,
      nbHits: transformedServants.length,
      data: transformedServants,
    });
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

  if (role === "admin" || role === "coordinator") {
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
  const { role, assignedRDAs, assignedLGA } = req.user;

  // Helper function
  const getFilteredUpdateBody = (servant, body) => {
    const updateBody = { ...body };

    if (servant.currentStep === 4 && servant.formStatus === "completed") {
      const restrictedFields = Object.keys(updateBody).filter(
        (key) =>
          key.startsWith("has") ||
          key === "serviceArea" ||
          key === "serviceRegion",
      );

      if (restrictedFields.length > 0) {
        return next(
          new ErrorResponse(
            `The following fields cannot be updated after the record has been completed: ${restrictedFields.join(", ")}`,
            400,
          ),
        );
      }
    }

    return updateBody;
  };

  if (role === "superadmin") {
    let servant = await Servant.findById(req.params.servantId);

    if (!servant) {
      return next(new ErrorResponse("Data not found!", 404));
    }

    const updateBody = getFilteredUpdateBody(servant, req.body);

    servant = await Servant.findByIdAndUpdate(
      req.params.servantId,
      {
        $set: updateBody,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      data: { servant },
    });
  }

  if (role === "admin" || role === "coordinator") {
    const servant = await Servant.findById(req.params.servantId);

    if (!servant) {
      return next(new ErrorResponse("Civil servant not found", 404));
    }

    // const allowedAreaValues = [
    //   ...(assignedRDAs || []),
    //   ...(assignedLGA || []),
    // ].map((area) => area.toLowerCase().trim());

    const servantArea = servant.serviceArea;

    console.log(servantArea);
    console.log(assignedLGA);

    if (assignedLGA !== servantArea) {
      return next(
        new ErrorResponse("You are not assigned to this region", 403),
      );
    }

    const updateBody = getFilteredUpdateBody(servant, req.body);

    const updatedServant = await Servant.findByIdAndUpdate(
      req.params.servantId,
      {
        $set: updateBody,
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
  const { role, assignedRDAs, assignedLGA } = req.user;
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

  if (role === "admin" || role === "coordinator") {
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
  const { role, assignedRDAs, assignedLGA } = req.user;

  let servant = await Servant.findById(req.params.id);

  if (!servant) {
    return next(new ErrorResponse("Civil servant not found!", 404));
  }

  // Authorization
  if (role !== "superadmin") {
    if (role !== "admin" && role !== "coordinator") {
      return next(new ErrorResponse("Unauthorized", 403));
    }

    const normalize = (value = "") => value.toLowerCase().trim();

    const allowedAreaValues = [assignedLGA, ...(assignedRDAs || [])]
      .filter(Boolean)
      .map(normalize);

    const servantArea = normalize(servant.serviceArea);

    if (!allowedAreaValues.includes(servantArea)) {
      return next(
        new ErrorResponse("You are not assigned to this region", 403),
      );
    }
  }

  // Validate uploaded files
  const files = req.files;

  if (!files?.length) {
    return next(new ErrorResponse("Please upload at least one document.", 400));
  }

  // Parse document names
  const parsedNames = Array.isArray(req.body.names)
    ? req.body.names
    : req.body.names
      ? [req.body.names]
      : [];

  const uploadedDocs = [];

  try {
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

      // Delete local file after successful upload
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  } catch (err) {
    // Clean up any remaining temporary files
    files.forEach((file) => {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    return next(
      new ErrorResponse(
        err.message || "An error occurred while uploading documents.",
        500,
      ),
    );
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

  await User.findByIdAndUpdate(req.user._id, {
    $inc: {
      "statistics.totalDocumentsUploaded": uploadedDocs.length,
    },
  });

  return res.status(200).json({
    success: true,
    data: servant,
  });
});
