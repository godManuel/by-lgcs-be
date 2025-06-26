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
      required: true,
    },
    serviceArea: {
      type: String,
      // enum: { values: validServiceAreas, message: "Invalid Service Area" },
      required: true,
    },
    displayPhoto: { type: String, required: true },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    middleName: String,
    sex: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
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
      required: true,
    },
    firstApptDate: {
      type: Date,
      required: true,
    },
    lastPromDate: {
      type: Date,
      required: true,
    },
    duePromDate: {
      type: Date,
    },
    retireDate: {
      type: Date,
      required: true,
    },
    qualification: {
      type: String,
      enum: [
        "fslc",
        "ssce",
        "nce/diploma",
        "bsc",
        "msc",
        "phd",
        "pgd",
        "tradetestone",
        "tradetesttwo",
        "tradetestthree",
      ],
      required: true,
    },
    department: {
      type: String,
      enum: ["admin", "education", "health", "works", "budget", "treasury", "agric"],
      required: true,
    },
    currentRank: {
      type: String,
      required: true,
    },
    currentGradeLevel: {
      type: String,
      required: true,
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
    hasNCEORDiploma: {
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
    certificates: [certificateSchema],
  },
  { timestamps: true }
);

// Automatically populating the age field by the date-of-birth field
servantSchema.pre("save", async function (next) {
  if (this.dateOfBirth) {
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

  if (this.isNew) {
    const serviceAreaCode = this.serviceArea.substring(0, 3).toUpperCase();
    const serviceRegionCode = this.serviceRegion.toUpperCase();

    const servantCount = await mongoose
      .model("Servant")
      .countDocuments({ serviceArea: this.serviceArea });

    this.applicantID = `BY/LGSC/${serviceRegionCode}/${serviceAreaCode}/${(
      servantCount + 1
    )
      .toString()
      .padStart(3, "0")}`;
  }
  next();
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
