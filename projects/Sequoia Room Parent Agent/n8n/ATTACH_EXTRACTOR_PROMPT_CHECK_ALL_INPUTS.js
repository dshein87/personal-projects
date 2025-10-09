// Check ALL inputs to find where the prompt is
let promptString = "";
let foundAt = -1;

for (let i = 0; i < 5; i++) {
  try {
    const testItems = $input.all(i);
    if (testItems && testItems.length > 0) {
      const testData = testItems[0].json;
      console.log("Input " + i + " keys:", Object.keys(testData || {}));

      if (testData && testData.data && typeof testData.data === "string" && testData.data.includes("assistant")) {
        promptString = testData.data;
        foundAt = i;
        console.log("Found prompt at input " + i);
        break;
      }
    }
  } catch (e) {
    console.log("Input " + i + " not available");
  }
}

if (!promptString) {
  throw new Error("Could not find prompt in any input. Check that Load Extractor Prompt is connected and executing.");
}

console.log("Using prompt from input " + foundAt);
console.log("Prompt length:", promptString.length);

const items = $input.all(0);

return items.map(item => {
  const json = item.json || {};
  const content = json.text || json.raw_text || "";
  const sourceType = json.source_type || "unknown";
  const sourceUrl = json.source_url || "";
  const assembledPrompt = promptString.trim() + "\n\nSOURCE_TYPE: " + sourceType + "\nSOURCE_URL: " + sourceUrl + "\n\nCONTENT:\n" + content;

  return {
    json: {
      ...json,
      prompt_template: promptString,
      prompt_text: assembledPrompt,
    },
    binary: item.binary,
  };
});
