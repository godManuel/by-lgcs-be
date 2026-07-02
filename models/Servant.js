const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  name: String,
  url: String,
});

const servantSchema = new mongoose.Schema(
  {
    serviceRegion: {
      type: String,
      enum: ["RDA", "LGA"],
    },
    serviceArea: {
      type: String,
      // enum: { values: validServiceAreas, message: "Invalid Service Area" },
    },
    displayPhoto: { type: String, default: null },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    middleName: String,
    sex: {
      type: String,
      enum: ["male", "female"],
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
    },
    phone: {
      type: String,
    },
    originLGA: {
      type: String,
      enum: [
        "Yenagoa",
        "Ogbia",
        "Southern Ijaw",
        "Nembe",
        "Ekeremor",
        "Kolokuma/Opokuma",
        "Brass",
        "Sagbama",
      ],
    },
    firstApptDate: {
      type: Date,
    },
    lastPromDate: {
      type: Date,
    },
    duePromDate: {
      type: Date,
    },
    retireByAge: {
      type: Date,
    },
    retireByService: {
      type: Date,
    },
    isRetired: {
      type: Boolean,
      default: false,
    },
    retirementStatus: {
      type: String,
      enum: ["active", "dueByAge", "dueByService"],
      default: "active",
    },
    qualification: {
      type: String,
      enum: [
        "fslc",
        "ssce",
        "nce",
        "bsc",
        "msc",
        "phd",
        "pgd",
        "tradetestone",
        "tradetesttwo",
        "tradetestthree",
        "nabteb",
        "nabteb-advanced",
        "jchew",
        "chew",
        "ond",
        "hnd",
        "bl",
        "llb",
        "lld",
        "llm",
        "certificate",
      ],
    },
    department: {
      type: String,
      enum: [
        "admin",
        "education",
        "health",
        "works",
        "budget",
        "treasury",
        "agric",
      ],
    },
    currentRank: {
      type: String,
    },
    currentGradeLevel: {
      type: String,
    },
    applicantID: String,
    hasFirstApptLetter: {
      type: Boolean,
      default: false,
    },
    hasConfirmationLetter: {
      type: Boolean,
      default: false,
    },
    hasLastPromLetter: {
      type: Boolean,
      default: false,
    },
    hasProfessionalCert: {
      type: Boolean,
      default: false,
    },
    hasFSLC: {
      type: Boolean,
      default: false,
    },
    hasSSCE: {
      type: Boolean,
      default: false,
    },
    hasNCE: {
      type: Boolean,
      default: false,
    },
    hasOND: {
      type: Boolean,
      default: false,
    },
    hasHND: {
      type: Boolean,
      default: false,
    },
    hasBL: {
      type: Boolean,
      default: false,
    },
    hasBachelorsDegree: {
      type: Boolean,
      default: false,
    },
    hasLLB: {
      type: Boolean,
      default: false,
    },
    hasLLD: {
      type: Boolean,
      default: false,
    },
    hasLLM: {
      type: Boolean,
      default: false,
    },
    hasNabteb: {
      type: Boolean,
      default: false,
    },
    hasNabtebAdvanced: {
      type: Boolean,
      default: false,
    },
    hasJChew: {
      type: Boolean,
      default: false,
    },
    hasChew: {
      type: Boolean,
      default: false,
    },
    hasFirstDegree: {
      type: Boolean,
      default: false,
    },
    hasPGD: {
      type: Boolean,
      default: false,
    },
    hasMasters: {
      type: Boolean,
      default: false,
    },
    hasPhD: {
      type: Boolean,
      default: false,
    },
    hasNYSCORExemptionLetter: {
      type: Boolean,
      default: false,
    },
    hasAgeDeclarationORBirthCert: {
      type: Boolean,
      default: false,
    },
    hasLGACert: {
      type: Boolean,
      default: false,
    },
    hasChangeOfName: {
      type: Boolean,
      default: false,
    },
    hasAnyOtherCert: {
      type: Boolean,
      default: false,
    },
    hasTradeTestOne: {
      type: Boolean,
      default: false,
    },
    hasTradeTestTwo: {
      type: Boolean,
      default: false,
    },
    hasTradeTestThree: {
      type: Boolean,
      default: false,
    },
    hasCertificate: {
      type: Boolean,
      default: false,
    },
    certificates: [certificateSchema],

    formStatus: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
      index: true,
    },

    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },

    completedSteps: {
      type: [Number],
      default: [],
    },

    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    lastSavedStep: {
      type: Number,
      default: 1,
    },

    documentsSelected: {
      type: Boolean,
      default: false,
    },

    submittedAt: Date,

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  },
);

// Automatically populating the age field by the date-of-birth field
servantSchema.pre("save", async function (next) {
  if (this.dateOfBirth) {
    /** Calculate Age */
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--; // Adjust age if birthday hasn't occurred yet this year
    }

    this.age = age; // Automatically store the calculated age
  }

  /** Automatically track progress */

  // Ensure completedSteps is always an array
  if (!Array.isArray(this.completedSteps)) {
    this.completedSteps = [];
  }

  // Add current step if not already completed
  if (this.currentStep && !this.completedSteps.includes(this.currentStep)) {
    this.completedSteps.push(this.currentStep);
  }

  // Remove duplicates and sort
  this.completedSteps = [...new Set(this.completedSteps)].sort((a, b) => a - b);

  // Save last step reached
  this.lastSavedStep = this.currentStep;

  // Calculate completion percentage
  const TOTAL_STEPS = 4;

  this.completionPercentage = Math.round(
    (this.completedSteps.length / TOTAL_STEPS) * 100,
  );

  const hasUploadedDocuments =
    Array.isArray(this.certificates) && this.certificates.length > 0;

  /**
   * =================================
   * COMPLETION
   * =================================
   */

  if (
    this.currentStep === 4 &&
    this.displayPhoto &&
    (this.documentsSelected || hasUploadedDocuments)
  ) {
    this.formStatus = "completed";
    this.isComplete = true;
    if (!this.submittedAt) {
      this.submittedAt = new Date();
    }
  } else {
    this.formStatus = "draft";
    this.isComplete = false;
  }

  next();
});

servantSchema.virtual("progress").get(function () {
  return {
    step: this.currentStep,
    completedSteps: this.completedSteps,
    percentage: this.completionPercentage,
    status: this.formStatus,
    completed: this.isComplete,
  };
});

// servantSchema.pre("validate", function (next) {
//   const { serviceArea, serviceRegion } = this;

//   const isValid =
//     serviceRegion === "rda"
//       ? serviceAreas.RDAs.includes(serviceArea)
//       : serviceAreas.LGAs.includes(serviceArea);

//   if (!isValid) {
//     this.invalidate(
//       "serviceArea",
//       `Service area does not match selected region (${serviceRegion}).`
//     );
//   }

//   next();
// });

const Servant = mongoose.model("Servant", servantSchema);

module.exports = Servant;
