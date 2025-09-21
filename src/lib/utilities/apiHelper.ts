import { llmTokens } from "$lib/controllers/llm";

export function resp(body: any, status: number, mime = "application/json") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": mime },
  });
}
export function throwError(message: string, status: number): never {
	throw { message, status };
}
export const er = {
  badRequest: {
    missing: "Request item missing or invalid.",
    nonObject: "Payload must be an object",
  },
  serverFail: {
    db: "Unable to get database",
  },
};
/**
 * Checks if a string is valid based on specific criteria.
 * OVERKILL: This function is overkill for the current use case but 'fail to prepare' et al.
 * @param {string} str - The string to be checked.
 * @returns {boolean} - Returns true if the string is invalid, otherwise false.
 */
export function sanitizeFilename(str: string, returnString = false): boolean | string {
  const invalidChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
  const controlChars = Array.from({ length: 32 }, (_, i) => i);
  const windowsReservedFilenames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];

  const isInvalid = (
    !!str ||
    str.length < 3 ||
    str.length > 255 ||
    str !== str.toLowerCase() ||
    invalidChars.some((char) => str.includes(char)) ||
    controlChars.some((char) => str.includes(String.fromCharCode(char))) ||
    windowsReservedFilenames.includes(str.toUpperCase())
  );

  if (!returnString) {
    return isInvalid;
  }

  // Clean up the string
  let cleanedStr = str.toLowerCase();
  cleanedStr = cleanedStr.replace(new RegExp(`[${invalidChars.join('')}]`, 'g'), '');
  cleanedStr = cleanedStr.replace(new RegExp(`[${controlChars.map((char) => String.fromCharCode(char)).join('')}]`, 'g'), '');

  // Ensure the cleaned string is not a reserved filename
  if (windowsReservedFilenames.includes(cleanedStr.toUpperCase())) {
    cleanedStr = `_${cleanedStr}`;
  }

  // Ensure the cleaned string length is within the valid range
  if (cleanedStr.length < 3) {
    cleanedStr = cleanedStr.padEnd(3, '_');
  } else if (cleanedStr.length > 255) {
    cleanedStr = cleanedStr.substring(0, 255);
  }

  return cleanedStr;
}
export async function stripConversation(text:string, contextLimit:number){
  if(!text) return text; //get outta her' with this shite.
  let tx = text;
   //see before we do this, count the text and add 35% to see if it's still less than limit, because this might be a waste of time.
  if ((tx.length + tx.length * 0.35) < contextLimit) return tx;
  // Count the tokens
  let tokens = await llmTokens({ text: tx });

  // If we're over the limit, trim from the start
  const averageTokenLength = 5; // average token length - pure guesstabation.
  while (tokens > contextLimit) {
    const wordsToRemove = estimateWordsToRemove(
      tokens,
      contextLimit,
      averageTokenLength
    );
    const wordsArray = tx.split(" ");
    tx = wordsArray.slice(wordsToRemove).join(" ");
    tokens = await llmTokens({ text: tx });
  }
  return tx;
}
// Function to estimate the number of words to remove
function estimateWordsToRemove(
  tokens: number,
  contextLimit: number,
  averageTokenLength: number
): number {
  const excessTokens = tokens - contextLimit;
  return Math.ceil(excessTokens / averageTokenLength);
}
//JSON FIXER
export async function correctJSONResponse(response: string): Promise<any> {
	// Step 1: Extract JSON from markdown and clean wrappers
	let cleaned = response
		// Remove markdown code blocks
		.replace(/```(?:json)?\s*/g, "")
		.replace(/```\s*/g, "")
		// Remove chat message wrappers
		.replace(/\{"role":\s*"assistant",\s*"content":\s*"/g, "")
		.replace(/"\}*$/g, "")
		//mention `tags` and all of a sudden the LLM becomes a twitter whore.
		.replace(/\\#/g, "")
		.replace(/#/g, "")
		//End removal of hashtags.
		.replace(/\\"/g, '"')
		.replace(/\\n/g, "\n")
		.replace(/""([^"]+)""/g, '"$1"') // Correct double-double quoted strings
		.trim();
	console.log("Cleaned response:", cleaned);
	// Step 2: Extract first complete JSON object/array
	const jsonMatch = cleaned.match(/[\{\[][\s\S]*[\}\]]/);
	if (jsonMatch) {
		cleaned = jsonMatch[0];
	}

	// Step 3: Apply common fixes
	const fixes = [
		// Try direct parse first
		(str: string) => JSON.parse(str),

		// Correct unquoted keys and trailing commas
		(str: string) => JSON.parse(str.replace(/(\w+):/g, '"$1":').replace(/,(\s*[}\]])/g, "$1")),

		// More aggressive cleanup
		(str: string) =>
			JSON.parse(
				str
					.replace(/(\w+):/g, '"$1":')
					.replace(/,(\s*[}\]])/g, "$1")
					.replace(/'/g, '"')
					.replace(/([{,]\s*)(\w+):/g, '$1"$2":')
			),

		// Extract from multiple JSON attempts (take first valid)
		(str: string) => {
			const objects = str.match(/\{[^{}]*\}/g) || [];
			for (const obj of objects) {
				try {
					return JSON.parse(obj.replace(/(\w+):/g, '"$1":'));
				} catch {
					continue;
				}
			}
			throw new Error("No valid JSON found");
		}
	];

	// Try each fix strategy
	for (const fix of fixes) {
		try {
			const result = fix(cleaned);
			if (result && typeof result === "object") {
				return result;
			}
		} catch {
			continue;
		}
	}

	// Fallback: return empty object
	console.warn("Failed to parse JSON, returning empty object:", response);
	return {};
}
