const mongoose = require("mongoose");

const servantSchema = new mongoose.Schema(
  {
    serviceRegion: {
      type: String,
      enum: ["rda", "lga"],
      required: true,
    },
    serviceArea: { type: String, required: true },
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
        "yenagoa",
        "ogbia",
        "southern-ijaw",
        "nembe",
        "ekeremor",
        "kolokuma/opokuma",
        "brass",
        "sagbama",
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
    retireDate: {
      type: Date,
      required: true,
    },
    qualification: {
      type: String,
      enum: ["primary", "secondary", "tertiary"],
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

const Servant = mongoose.model("Servant", servantSchema);

module.exports = Servant;
