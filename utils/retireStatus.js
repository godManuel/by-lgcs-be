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

  const plainServant = servant.toObject ? servant.toObject() : servant;

  return {
    ...plainServant,
    isRetired: ageDue || serviceDue,
    retirementStatus: status,
  };
};
