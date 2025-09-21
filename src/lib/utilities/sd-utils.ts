import { get } from "svelte/store";
import { Gamemode } from "$lib/global";
import { BASE_RESOLUTIONS } from "$lib/stores/sd.store";
import { DebugLogger } from "$lib/utilities/error-manager";

//video prompt https://www.comfyonline.app/blog/wan2-1-prompt-guide
/**
 * Find a closest resolution option match for the current width and height.
 */
export function getClosestKnownResolution(width: number, height: number): [number, number] | null {
	let bestResolution: [number, number] | null = null;
	let minTotalDiff = Number.POSITIVE_INFINITY;

	// Round width and height to the nearest 64 after scaling
	const w = Math.round((width * 1.5) / 64) * 64;
	const h = Math.round((height * 1.5) / 64) * 64;
	const targetAspect = w / h;
	const targetArea = w * h;

	for (const [bw, bh] of BASE_RESOLUTIONS) {
		const aspectDiff = Math.abs(bw / bh - targetAspect) / targetAspect;
		const areaDiff = Math.abs(bw * bh - targetArea) / targetArea;
		const totalDiff = aspectDiff + areaDiff;
		if (totalDiff < minTotalDiff) {
			minTotalDiff = totalDiff;
			bestResolution = [bw, bh];
		}
	}

	return bestResolution;
}
/**
 * Cleans up the prompt string by removing unnecessary spaces around commas and replacing control characters with a space.
 *
 * This function:
 * - Removes any spaces immediately preceding a comma (e.g., "cunt , wanker" becomes "cunt, wanker").
 * - Removes any spaces immediately following a comma. (e.g. "shite, bag" becomes "shite,bag")
 * - Replaces newline, carriage return, tab, backspace, form feed, and vertical tab whitespace characters with a single space cause JSON parse loses it's shit when they're present.
 *
 * @param prompt - The input string to be corrected.
 * @returns The modified string with consistent spacing.
 */
export function fixPromptSpacing(prompt: string) {
	return prompt
		.replace(/ ,/g, ",")
		.replace(/, /g, ",")
		.replace(/[\n\r\t\b\f\v]/g, " ");
}
/**
 * Converts a given File object or file path string to its Base64 representation.
 *
 * This function accepts either a File object or a string representing a file path.
 * If a File object is provided, it uses the file directly. If a string is given, it assumes
 * it is a URL and fetches the resource, then converts the resulting Blob into a Base64 string.
 *
 * @param input - The file or file path as a File object or a URL string.
 * @returns A promise that resolves to the Base64 encoded string representation of the file.
 * @throws Will throw an error if the input is neither a File object nor a string.
 */
export async function toBase64(input: string | File, removeFileType?: boolean): Promise<string> {
	let blob: Blob;
	DebugLogger.debug("toBase64 input", input);
	if (input instanceof File) {
		blob = input;
	} else if (typeof input === "string") {
		const response = await fetch(input, { credentials: "include" });
		if (!response.ok) {
			DebugLogger.error(`Failed to fetch image from ${input}`);
			throw new Error(`Failed to fetch image from ${input}`);
		}
		blob = await response.blob();
	} else {
		DebugLogger.error("Input must be either a File object or a file path string");
		throw new Error("Input must be either a File object or a file path string");
	}
	if (removeFileType) {
		return readBlob(blob).then((base64) => base64.replace(/^data:.*?,/, ""));
	}
	return await readBlob(blob);
}
/**
 * Reads the provided Blob and converts its data into a Base64-encoded string.
 *
 * @param blob - The Blob object to be read.
 * @returns A Promise that resolves with a Base64-encoded string representing the contents of the blob.
 *
 * @throws An Error if reading the blob fails.
 */
async function readBlob(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (reader.result !== null) {
				resolve(reader.result as string);
			} else {
				reject(new Error("Failed to read blob"));
			}
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}
export async function saveBase64ToImage(
	base64Image: string,
	id: string,
	filename?: string
): Promise<{ success: boolean; filePath: string }> {
	const mode = get(Gamemode);
	// Concise check for all required parameters
	for (const [key, value] of Object.entries({ base64Image, mode, id })) {
		if (!value) {
			console.error(`${key} parameter is required.`);
			throw new Error(`${key} parameter is required.`);
		}
	}

	// If the base64Image string doesn't start with the data URL prefix, add it
	const image = base64Image.startsWith("data:image/") ? base64Image : `data:image/png;base64,${base64Image}`;

	const payload = { mode, id, image, filename };

	const response = await fetch("/api/filesystem/images", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
		credentials: "include"
	});
	const data = await response.json();

	if (!response.ok) {
		console.error(`Failed to save image: ${data.error}`);
		throw new Error(`Failed to save image: ${data.error}`);
	}
	return data;
}
/**
 * Retrieves the JSON data for the specified workflow.
 *
 * This function constructs a URL path for the workflow by combining a base path with the provided
 * workflow name, then fetches the corresponding JSON data from that URL.
 *
 * @param workflow - The name of the workflow to fetch.
 * @returns A promise that resolves to the parsed JSON object representing the workflow data.
 * @throws Error if the workflow data is not found (i.e., the HTTP response is not OK).
 */
export async function getWorkflow(workflow: string) {
	const workflowPath = `/comfyui-workflows/image/${workflow}`; //load up workflow json data
	const workflowData = await fetch(workflowPath, { credentials: "include" }); //if not found, return error
	if (!workflowData.ok) {
		console.error("Look for workflow", workflowPath);
		throw new Error("Workflow not found.");
	}
	//use comfyReplaceTags to replace all the tags in the workflow with the values from the SD object
	const workflowJson = await workflowData.json();
	return workflowJson;
}
export function splitImageMessage(message: string, options?: { imageFileNameOnly?: boolean; promptOnly?: boolean }) {
	// [image:${promptId}.png][prompt:na]
	const imageRegex = /\[image:(.*?)\]/;
	const promptRegex = /\[prompt:([\s\S]*?)\]/;
	const imageMatch = message.match(imageRegex);
	const promptMatch = message.match(promptRegex);

	let image = imageMatch ? imageMatch[1] : "";
	let prompt = promptMatch ? promptMatch[1] : "";

	if (options?.imageFileNameOnly && image) {
		return { image: image };
	}
	if (options?.promptOnly) {
		return { prompt: prompt };
	}
	return { image, prompt };
}
