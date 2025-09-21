import ExifReader from "exifreader";
import { get } from "svelte/store";
import { character121Prompt, characterNarrativePrompt } from "$lib/constants/prompts/prompts";
import { CharacterSettingsStore, CharacterStore } from "$lib/engine/engine-character";
import { DebugLogger } from "$lib/utilities/error-manager";

//Here we fuckin go....
//characterhub.org...
//chub.ai can fuck off

export async function importURL(url: string) {
	//contains characterhub.org then it's chub
	if (url.includes("characterhub.org")) {
		return await characterHubUrl(url);
	}
}
export async function importFile(file: File) {
	const base64 = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			if (typeof reader.result === "string") {
				const resultParts = reader.result.split(",");
				if (resultParts.length > 1) {
					resolve(resultParts[1]);
				} else {
					reject(new Error("Unexpected file format"));
				}
			} else {
				reject(new Error("Could not read file as base64 string"));
			}
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
	const response = chubCardV2(base64);
	return response;
}

async function characterHubUrl(url: string) {
	//get and sort through the absolute mess that is a file from characterhub.org
	// Validate that the URL is formed correctly, e.g.:
	// https://www.characterhub.org/characters/cutenotlewd/cricket-674c71b2
	const validUrlPattern = /^https?:\/\/(www\.)?characterhub\.org\/characters\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
	if (!validUrlPattern.test(url)) {
		throw new Error(
			"Invalid URL format. Please ensure the URL is like https://www.characterhub.org/characters/<username>/<slug>"
		);
	}
	//call /api/external/charhub with url
	const response = await fetch(`/api/external/charhub?rUrl=${url}`, { credentials: "include" });
	const data = await response.blob();
	let base64Data = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const result = reader.result as string;
			const base64 = result.split(",")[1];
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(data);
	});
	return chubCardV2(base64Data);
	// Further processing of the valid URL can be done here.
}
function chubCardV2(base64: string) {
	const exif = readExif(base64);
	//there should be a chara element with base64 encoded 'value' and base64 encoded 'description'
	//see if they exist and if they do, decode them and console log the data
	const chara = exif?.chara;
	console.log("Chara", JSON.parse(atob(chara?.value)));
	if (chara) {
		const value = chara?.value;
		const description = chara?.description;
		if (value && description) {
			try {
				const parsedValue = JSON.parse(atob(value));
				const parsedDescription = JSON.parse(atob(description));
				DebugLogger.debug("Value", parsedValue);
				DebugLogger.debug("Description", parsedDescription);
				return chubCardV2toCharacter(parsedValue, base64);
			} catch (error) {
				DebugLogger.debug("Error parsing JSON", error);
			}
		}
	}
}
function chubCardV2toCharacter(value: any, image: string) {
	let llmSettings = get(CharacterSettingsStore);
	let char = get(CharacterStore);
	DebugLogger.debug("ChubCardV2 to Character", value, image);
	//convert chubcardV2 to character settings
	char.name = value.data?.name ?? "Betty";
	char.firstMsg = value.data?.first_mes ?? "";
	char.exampleMsg = value.data?.mes_example ?? "";
	char.strengths.push(value.data?.personality);
	char.scenario = value.data?.scenario ?? "";
	char.age = value.data?.age ?? 21; //fuck knows, it might be in there...
	//The geezers that make these cards will shit everything into the description so try pull it out.
	//From an extensive look at 1 card, take this as gospel (dear fuck, I had to google how to spell 'gospel' and it still looks wrong...)
	let descriptionStr = value.data?.description ?? "";
	try {
		descriptionStr = extractAndAssign(/Appearance:\s*([^\n]+)/, descriptionStr, (val) => (char.faceCaption = val));
		descriptionStr = extractAndAssign(/Personality:\s*([^\n]+)/, descriptionStr, (val) => char.strengths.push(val));
		descriptionStr = extractAndAssign(/Traits:\s*([^\n]+)/, descriptionStr, (val) => char.flaws.push(val));
		descriptionStr = extractAndAssign(/Goal:\s*([^\n]+)/, descriptionStr, (val) => char.goals.push(val));
		descriptionStr = extractAndAssign(/Background:\s*([^\n]+)/, descriptionStr, (val) => (char.background = val));
		descriptionStr = extractAndAssign(/Species:\s*([^\n]+)/, descriptionStr, (val) => (char.species = val));
		// Try match anything like: "age: 21", "age 21", "21 years old", "21 y/o", "21yo", "21 yrs", "21yr", "21-year-old"
		descriptionStr = extractAndAssign(
			/\b(?:age\s*[:-]?\s*)?(\d{1,3})(?:\s*(?:years?\s*old|y\/?o|yo|yrs?|yr|-\s*year\s*old))?\b/i,
			descriptionStr,
			(val) => (char.age = Number.parseInt(val))
		);
		//char.description = value.data?.description ?? "";
		if (value.data?.system_prompt) {
			llmSettings.llmTextSettings.prompt = value.data?.system_prompt;
		} else {
			//check to see if we have a firstMsg and that first message contains text within stars *this is text*
			//then it's a narrative prompt.
			const firstMsg = char.firstMsg;
			const firstMsgMatch = firstMsg.match(/\*(.*?)\*/);
			if (firstMsgMatch) {
				llmSettings.llmTextSettings.prompt = characterNarrativePrompt;
			} else {
				llmSettings.llmTextSettings.prompt = character121Prompt;
			}
		}
	} catch (error) {
		console.warn("Error extracting character data from description", error);
		return;
	}
	//check to see if base64 data is missing the start mimetype data
	//if it is, add it back in
	if (!image.startsWith("data:image/png;base64,")) {
		image = `data:image/png;base64,${image}`;
	}
	char.description = descriptionStr;
	char.images.avatar = image;
	console.log("Character", char);
	console.log("LLM Settings", llmSettings);
	CharacterSettingsStore.set(llmSettings);
	CharacterStore.set(char);
	return true;
}

function readExif(base64: string) {
	// Decode base64 string into a binary string using atob
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	// Parse metadata from the image using ExifReader
	const metadata = ExifReader.load(bytes.buffer);
	DebugLogger.debug("Metadata", metadata);
	return metadata;
}
function extractAndAssign(regex: RegExp, str: string, assign: (value: string) => void) {
	const match = str?.match(regex);
	if (match?.[1]) {
		assign(match[1].trim());
		return str.replace(regex, "").trim();
	}
	return str ?? "";
}
