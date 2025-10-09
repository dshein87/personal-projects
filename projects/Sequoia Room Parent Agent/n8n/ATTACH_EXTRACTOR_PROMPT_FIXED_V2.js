// FIXED VERSION V2 - Simplified for n8n compatibility
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
let promptString = "";

const promptData = promptItem.json;

if (typeof promptData === "string") {
  promptString = promptData;
} else if (promptData && typeof promptData === "object") {
  if (promptData.data && typeof promptData.data === "string") {
    promptString = promptData.data;
  } else if (promptData.body && typeof promptData.body === "string") {
    promptString = promptData.body;
  } else if (promptData.content && typeof promptData.content === "string") {
    promptString = promptData.content;
  }
}

if (!promptString && promptItem.binary && promptItem.binary.data) {
  const binaryData = promptItem.binary.data;
  if (Buffer.isBuffer(binaryData)) {
    promptString = binaryData.toString('utf8');
  } else if (typeof binaryData === 'string') {
    promptString = binaryData;
  }
}

if (!promptString || promptString.trim().length === 0) {
  throw new Error("Extractor prompt did not load any text");
}

const hasPromptKeywords = promptString.includes("assistant") || promptString.includes("output") || promptString.includes("JSON");
const hasEmailKeywords = promptString.includes("Subject:") || promptString.includes("View this email");

if (!hasPromptKeywords || hasEmailKeywords) {
  throw new Error("Text does not look like a prompt. First 200 chars: " + promptString.slice(0, 200));
}

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
