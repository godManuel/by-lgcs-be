const { RDAs, LGAs } = require("../config/serviceAreas");

exports.normalizeServiceArea = (type, input) => {
  const key = input.trim().toLowerCase();

  if (type == "RDA") {
    return { value: RDAs[key] };
  }

  if (type == "LGA") {
    return { value: LGAs[key] };
  }

  return null;
};
