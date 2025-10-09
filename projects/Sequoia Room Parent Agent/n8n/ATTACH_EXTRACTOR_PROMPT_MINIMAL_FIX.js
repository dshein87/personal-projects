const items = $input.all(0);
const promptItems = $input.all(1);

let promptString = "";

if (promptItems && promptItems.length > 0) {
  const promptItem = promptItems[0];
  const promptData = promptItem.json;

  if (typeof promptData === "string") {
    promptString = promptData;
  } else if (promptData) {
    promptString = promptData.data || promptData.body || promptData.content || promptData.prompt || "";
  }

  if (!promptString && promptItem.binary && promptItem.binary.data) {
    promptString = promptItem.binary.data.toString('utf8');
  }
}

if (!promptString) {
  throw new Error("Extractor prompt did not load any text");
}

if (!items || items.length === 0) {
  console.log("No ingestion data available - upstream nodes may not have executed");
  return [];
}

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
