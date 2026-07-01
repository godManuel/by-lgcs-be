const { normalizeServiceArea } = require("./normalizeServiceArea");
const { parseBooleanFields } = require("./parseBooleanFields");

const booleanFields = [
  "hasFirstApptLetter",
  "hasConfirmationLetter",
  "hasLastPromLetter",
  "hasProfessionalCert",
  "hasFSLC",
  "hasNCE",
  "hasOND",
  "hasHND",
  "hasBL",
  "hasLLB",
  "hasLLD",
  "hasLLM",
  "hasNabteb",
  "hasNabtebAdvanced",
  "hasJchew",
  "hasChew",
  "hasNYSCORExemptionLetter",
  "hasSSCE",
  "hasFirstDegree",
  "hasAgeDeclarationORBirthCert",
  "hasLGACert",
  "hasChangeOfName",
  "hasAnyOtherCert",
  "hasPGD",
  "hasMasters",
  "hasPhD",
  "hasTradeTestOne",
  "hasTradeTestTwo",
  "hasTradeTestThree",
  "hasCertificate",
];

module.exports = (body, photo = null) => {
  parseBooleanFields(body, booleanFields);

  const normalized = normalizeServiceArea(body.serviceRegion, body.serviceArea);

  if (!normalized) {
    throw new Error("Invalid service area");
  }

  return {
    serviceRegion: body.serviceRegion,
    serviceArea: normalized.value,

    displayPhoto: photo,

    firstName: body.firstName,
    middleName: body.middleName,
    lastName: body.lastName,

    sex: body.sex,
    phone: body.phone,

    dateOfBirth: body.dateOfBirth,

    originLGA: body.originLGA,

    firstApptDate: body.firstApptDate,

    lastPromDate: body.lastPromDate,

    duePromDate: body.duePromDate,

    retireByAge: body.retireByAge,

    retireByService: body.retireByService,

    qualification: body.qualification,

    department: body.department,

    currentRank: body.currentRank,

    currentGradeLevel: body.currentGradeLevel,

    hasFirstApptLetter: body.hasFirstApptLetter,
    hasConfirmationLetter: body.hasConfirmationLetter,
    hasLastPromLetter: body.hasLastPromLetter,
    hasProfessionalCert: body.hasProfessionalCert,
    hasFSLC: body.hasFSLC,
    hasSSCE: body.hasSSCE,
    hasNCE: body.hasNCE,
    hasOND: body.hasOND,
    hasHND: body.hasHND,
    hasBL: body.hasBL,
    hasBachelorsDegree: body.hasBachelorsDegree,
    hasLLB: body.hasLLB,
    hasLLD: body.hasLLD,
    hasLLM: body.hasLLM,
    hasNabteb: body.hasNabteb,
    hasNabtebAdvanced: body.hasNabtebAdvanced,
    hasJChew: body.hasJchew,
    hasChew: body.hasChew,
    hasFirstDegree: body.hasFirstDegree,
    hasPGD: body.hasPGD,
    hasMasters: body.hasMasters,
    hasPhD: body.hasPhD,
    hasNYSCORExemptionLetter: body.hasNYSCORExemptionLetter,
    hasAgeDeclarationORBirthCert: body.hasAgeDeclarationORBirthCert,
    hasLGACert: body.hasLGACert,
    hasChangeOfName: body.hasChangeOfName,
    hasTradeTestOne: body.hasTradeTestOne,
    hasTradeTestTwo: body.hasTradeTestTwo,
    hasTradeTestThree: body.hasTradeTestThree,
    hasCertificate: body.hasCertificate,
    hasAnyOtherCert: body.hasAnyOtherCert,
  };
};
