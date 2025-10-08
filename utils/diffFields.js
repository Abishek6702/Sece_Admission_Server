// utils/diffFields.js
function diffFields(oldObj, newObj, parentKey = "") {
  let changedFields = [];

  for (const key of Object.keys(newObj)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (
      typeof newObj[key] === "object" &&
      newObj[key] !== null &&
      !Array.isArray(newObj[key])
    ) {
      // Recurse into nested objects
      changedFields = changedFields.concat(
        diffFields(oldObj[key] || {}, newObj[key], fullKey)
      );
    } else {
      const oldValue = oldObj ? oldObj[key] : undefined;
      const newValue = newObj[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push(fullKey);
      }
    }
  }

  return changedFields;
}

module.exports = diffFields;
