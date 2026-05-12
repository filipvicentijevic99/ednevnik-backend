function normalizeCatalogName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function createDuplicateErrorMessage(label) {
  return `${label} already exists.`;
}

module.exports = {
  normalizeCatalogName,
  createDuplicateErrorMessage,
};
