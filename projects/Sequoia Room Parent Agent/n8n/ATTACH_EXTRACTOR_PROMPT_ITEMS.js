// Compatible version using $items instead of $input.all()
const allItems = $items();

// Separate prompt from content items
let promptString = "";
const contentItems = [];

for (let i = 0; i < allItems.length; i++) {
  const item = allItems[i];
  const json = item.json || {};

  // Identify prompt items (from HTTP Request - has "data" field with instructions)
  if (json.data && typeof json.data === "string" && json.data.includes("assistant")) {
    promptString = json.data;
    continue;
  }

  // Everything else is content (emails/PDFs)
  if (json.text || json.source_type) {
    contentItems.push(item);
  }
}

if (!promptString) {
  throw new Error("Extractor prompt not found in merged data");
}

if (contentItems.length === 0) {
  console.log("No content items found");
  return [];
}

const results = [];

for (let i = 0; i < contentItems.length; i++) {
  const item = contentItems[i];
  const json = item.json || {};
  const content = json.text || json.raw_text || "";
  const sourceType = json.source_type || "unknown";
  const sourceUrl = json.source_url || "";

  const assembledPrompt = promptString.trim() + "\n\nSOURCE_TYPE: " + sourceType + "\nSOURCE_URL: " + sourceUrl + "\n\nCONTENT:\n" + content;

  results.push({
    json: {
      ...json,
      prompt_template: promptString,
      prompt_text: assembledPrompt,
    },
    binary: item.binary,
  });
}

return results;
