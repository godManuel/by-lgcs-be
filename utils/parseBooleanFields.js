exports.parseBooleanFields = (data, fields) => {
  fields.forEach((field) => {
    if (typeof data[field] === "string") {
      data[field] = data[field].toLowerCase() === "true";
    }
  });
  return data;
};
