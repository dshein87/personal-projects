// DEBUG VERSION - Shows what structure we're receiving
const ingestedItems = $input.all(0);
const promptItems = $input.all(1);

if (!promptItems || promptItems.length === 0) {
  throw new Error("No prompt data received on input 1");
}

if (!ingestedItems || ingestedItems.length === 0) {
  console.log("No ingestion data available");
  return [];
}

const promptItem = promptItems[0];
const promptData = promptItem.json;

// DEBUG: Log the entire structure
console.log("DEBUG: promptData type:", typeof promptData);
console.log("DEBUG: promptData keys:", Object.keys(promptData || {}));
console.log("DEBUG: promptData.data type:", typeof promptData.data);
console.log("DEBUG: First 100 chars of promptData:", JSON.stringify(promptData).slice(0, 200));

let promptString = "";

if (typeof promptData === "string") {
  promptString = promptData;
  console.log("DEBUG: Used promptData directly as string");
} else if (promptData && typeof promptData === "object") {
  if (promptData.data && typeof promptData.data === "string") {
    promptString = promptData.data;
    console.log("DEBUG: Used promptData.data");
  } else if (promptData.body && typeof promptData.body === "string") {
    promptString = promptData.body;
    console.log("DEBUG: Used promptData.body");
  } else if (promptData.content && typeof promptData.content === "string") {
    promptString = promptData.content;
    console.log("DEBUG: Used promptData.content");
  }
}

if (!promptString && promptItem.binary && promptItem.binary.data) {
  const binaryData = promptItem.binary.data;
  console.log("DEBUG: Trying binary data, type:", typeof binaryData);
  if (Buffer.isBuffer(binaryData)) {
    promptString = binaryData.toString('utf8');
    console.log("DEBUG: Used Buffer.toString");
  } else if (typeof binaryData === 'string') {
    promptString = binaryData;
    console.log("DEBUG: Used binary string directly");
  }
}

if (!promptString || promptString.trim().length === 0) {
  throw new Error("Extractor prompt did not load. Check console logs for structure details.");
}

console.log("DEBUG: Final prompt length:", promptString.length);
console.log("DEBUG: First 100 chars:", promptString.slice(0, 100));

return ingestedItems.map(item => {
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
