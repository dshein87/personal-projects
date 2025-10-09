// FIXED VERSION - Attach Extractor Prompt Node
// This version validates input sources and correctly extracts the prompt from HTTP Request

const ingestedItems = $input.all(0);  // Items from first input (Merge Ingestion)
const promptItems = $input.all(1);    // Items from second input (Load Extractor Prompt - HTTP Request)

// Validate we have both inputs
if (!promptItems || promptItems.length === 0) {
  throw new Error("No prompt data received on input 1. Check that 'Load Extractor Prompt' is connected.");
}

if (!ingestedItems || ingestedItems.length === 0) {
  console.log("No ingestion data available - upstream nodes may not have executed");
  return [];
}

// Extract prompt from HTTP Request response
const promptItem = promptItems[0];
let promptString = "";

// HTTP Request node returns data in different structures depending on content type
// For raw text responses, it's typically in: json.data or directly as string
const promptData = promptItem.json;

if (typeof promptData === "string") {
  // Response is directly a string
  promptString = promptData;
} else if (promptData && typeof promptData === "object") {
  // Response is an object - check for HTTP Request typical fields FIRST
  // HTTP Request puts text/plain responses in .data field
  if (promptData.data && typeof promptData.data === "string") {
    promptString = promptData.data;
  }
  // Sometimes in .body
  else if (promptData.body && typeof promptData.body === "string") {
    promptString = promptData.body;
  }
  // For JSON responses, might be in .content or .prompt
  else if (promptData.content && typeof promptData.content === "string") {
    promptString = promptData.content;
  }
  else if (promptData.prompt && typeof promptData.prompt === "string") {
    promptString = promptData.prompt;
  }
  // DO NOT USE .text as fallback - that's an email/document field!
}

// Try binary data as last resort
if (!promptString && promptItem.binary && promptItem.binary.data) {
  const binaryData = promptItem.binary.data;
  if (Buffer.isBuffer(binaryData)) {
    promptString = binaryData.toString('utf8');
  } else if (typeof binaryData === 'string') {
    promptString = binaryData;
  }
}

// Validate we got a prompt
if (!promptString || promptString.trim().length === 0) {
  throw new Error(
    "Extractor prompt did not load any text. " +
    "HTTP Request response structure: " + JSON.stringify(promptData, null, 2)
  );
}

// Validate it looks like an instruction prompt, not email content
// Prompts should contain keywords like "assistant", "output", "JSON"
const looksLikePrompt = /assistant|output|JSON|extract|parse|instruction/i.test(promptString);
const looksLikeEmail = /Subject:|From:|To:|View this email/i.test(promptString);

if (!looksLikePrompt || looksLikeEmail) {
  throw new Error(
    "Extracted text doesn't look like a prompt template. " +
    "It may be email content. First 200 chars: " +
    promptString.slice(0, 200)
  );
}

// Now process each ingested item
return ingestedItems.map(item => {
  const json = item.json || {};
  const content = json.text || json.raw_text || "";
  const sourceType = json.source_type || "unknown";
  const sourceUrl = json.source_url || "";

  // Assemble full prompt with context
  const assembledPrompt = `${promptString.trim()}

SOURCE_TYPE: ${sourceType}
SOURCE_URL: ${sourceUrl}

CONTENT:
${content}`;

  return {
    json: {
      ...json,
      prompt_template: promptString,
      prompt_text: assembledPrompt,
    },
    binary: item.binary,
  };
});
