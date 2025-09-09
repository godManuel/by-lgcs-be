exports.getRetirementStatus = (servant) => {
  const today = new Date();

  const ageDue = servant.retireByAge <= today;
  const serviceDue = servant.retireByService <= today;

  let status = "active";

  if (ageDue) {
    status = "dueByAge";
  } else if (serviceDue) {
    status = "dueByService";
  }

  return {
    ...servant,
    isRetired: ageDue || serviceDue, // boolean flag
    retirementStatus: status, // string: "active" | "dueByAge" | "dueByService"
  };
};
