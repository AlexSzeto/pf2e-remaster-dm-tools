export const spellToCard = (spellRulesJson) => {
  /**
   * Transforms the first JSON block into the second JSON block.
   *
   * @param {Object} inputJson - The input JSON as an object.
   * @returns {Object} The transformed JSON.
   */

  // Helper function to safely extract nested data
  function getNestedValue(path, defaultValue = "") {
    return path.reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : defaultValue), spellRulesJson);
  }

  // Extracting relevant data
  const name = getNestedValue(["name"]);
  const level = getNestedValue(["system", "level", "value"]);
  const traits = getNestedValue(["system", "traits", "value"], []);
  const description = getNestedValue(["system", "description", "value"]);
  const traditions = getNestedValue(["system", "traits", "traditions"], []).join(", ");
  const rangeValue = getNestedValue(["system", "range", "value"]);
  const areaType = getNestedValue(["system", "area", "type"]);
  const areaValue = getNestedValue(["system", "area", "value"]);
  const defenseStat = getNestedValue(["system", "defense", "save", "statistic"]);
  const defenseBasic = getNestedValue(["system", "defense", "save", "basic"], false) ? "basic" : "";

  // Constructing the output JSON
  const transformedJson = {
    name: name,
    type: `spell ${level}`,
    traits: traits,
    stats: [
      {
        name: "Traditions",
        text: traditions
      },
      {
        name: "Range",
        text: `${rangeValue}`,
        newline: true
      },
      {
        name: "Area",
        text: `${areaValue} ft ${areaType}`
      },
      {
        name: "Defense",
        text: `${defenseBasic} ${defenseStat}`,
        newline: true
      },
      {
        name: "Description",
        text: description,
        hr: true
      }
    ]
  };

  return transformedJson;
}