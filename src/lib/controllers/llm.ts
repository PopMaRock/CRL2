import { get } from "svelte/store";
import { summaryPrompt } from "$lib/constants/prompts/prompts";
import { evolutionSchema, imagePromptSchema, tagsSchema } from "$lib/constants/schemas";
import { CharacterSettingsStore } from "$lib/engine/engine-character";
import { DungeonGameSettingsStore } from "$lib/engine/engine-dungeon";
import { Gamemode } from "$lib/global";
import { engineSettings } from "$lib/stores/engine";
import { _api } from "$lib/utilities/_api";
import { asyncDebounce, asyncThrottle } from "$lib/utilities/lodash-wrapper";
/**
 * An async throttled function that sends input text(s) to the embeddings API endpoint.
 * Returns a vector representation (embedding) of the input text(s) as an array of 384 floats.
 *
 * @param input - A string or array of strings to generate embeddings for.
 * @returns A promise that resolves to an array containing the embedding vector(s).
 *
 * @example
 * // Single string input
 * const result = await llmEmbeddings("Hello world");
 * // result: [float[384]]
 *
 * // Multiple strings input
 * const result = await llmEmbeddings(["Hello world", "Goodbye"]);
 * // result:  [float[384], float[384]]
 *
 * @remarks
 * The function is throttled to execute at most once every 500 milliseconds.
 */
export const llmEmbeddings = asyncThrottle(async (input: string | string[]): Promise<any> => {
	console.debug("llmEmbeddings called with input:", input);
	const resp = (await _api("/api/transformers/embeddings", "POST", {
		text: input
	})) as { vector: number[] | number[][] };
	return resp.vector;
}, 500);
/**
 * An async throttled function that sends input text(s) to a sentiment analysis API endpoint.
 * Labels = ['admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring', 'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval', 'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief', 'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization', 'relief', 'remorse', 'sadness', 'surprise', 'neutral']
 * @param input - A string representing the text to analyze for sentiment.
 * @returns A promise that resolves to the sentiment analysis result(s).
 *
 * @example
 * // Single string input
 * const result = await llmSentiment("I love typescript!");
 * // result: { sentiment: "sadness", score: 0.95 }
 *
 * @remarks
 * The function is throttled to execute at most once every 300 milliseconds.
 */
export const llmSentiment = asyncThrottle(async (input: string): Promise<any> => {
	const resp: any = await _api("/api/transformers/sentiment", "POST", {
		text: input
	});
	// If response is an array, return the label from the first item
	if (Array.isArray(resp?.sentiment) && resp?.sentiment?.length > 0 && resp?.sentiment[0].label) {
		return resp.sentiment[0].label;
	}
	throw new Error("Invalid sentiment response format");
}, 300);
/**
 * Debounced asynchronous function that sends either a string to summarise or custom messages to the summarisation API endpoint.
 *
 * @param params - An object containing either `content` (string to summarise) or `messages` (array of message objects with `role` and `content`).
 * @returns A promise resolving to the API response containing the summary.
 *
 * @example
 * // Summarise a string
 * const result = await llmSummarise("This is a message to summarise.");
 * // Example result: "This is a concise summary."
 *
 * @remarks
 * The function is debounced with a 500ms delay to prevent excessive API calls.
 */
export const llmSummarise = asyncThrottle(async (content: string): Promise<any> => {
	console.debug("llmSummarise called with content:", content);
	if (!content) throw new Error("Content is required for summarisation");
	let messages = [];
	messages.push({
		role: "system",
		content: summaryPrompt.system
	});
	messages.push({
		role: "user",
		content: summaryPrompt.user.replace("{{content}}", content)
	});
	const llmSettings = getSettings();
	const resp = (await _api(`/api/llm/provider/${llmSettings.llmActive}/summarise`, "POST", {
		messages
	})) as { summary?: string };
	return resp?.summary ?? resp;
}, 500);
/**
 * An async throttled function that analyzes whether the existing memory should be updated based on new memory input.
 *
 * This function sends a prompt and schema to the `/api/transformers/summarise` endpoint, requesting an analysis
 * of whether the memory should evolve. The schema expects a response indicating if the memory should be updated,
 * along with enhanced content, summary, keywords, and the reason for evolution if applicable.
 * This needs a 12b+ model to work properly. Lower models are just brain dead shite that will bullshit the answer.
 *
 * @param params - An object containing:
 *   - `new_memory`: The new memory stringified as JSON.
 *   - `existing_memory`: The current memory stringified as JSON to compare against.
 * @returns A promise resolving to the API response, which includes:
 *   - `shouldEvolve`: Boolean indicating if the memory should be updated.
 *   - `updatedContent`: Enhanced content if evolution is needed.
 *   - `updatedSummary`: Refined summary if evolution is needed.
 *   - `updatedKeywords`: Enhanced keywords if evolution is needed.
 *   - `evolutionReason`: Explanation for why the memory was updated.
 * @throws Error if either `new_memory` or `existing_memory` is missing.
 *
 * @example
 * const newMemory = JSON.stringify({ id: 2, content: "Got fucked by thread safety again in Rust.", timestamp: "2025-06-10" });
 * const existingMemory = JSON.stringify({ id: 1, content: "Considering sexually assulting the creators of Rust over variable ownership.", timestamp: "2025-06-01" });
 * const result = await llmEvolution({ new_memory: newMemory, existing_memory: existingMemory });
 * // result: {
 * //   shouldEvolve: true,
 * //   updatedContent: "...",
 * //   updatedSummary: "...",
 * //   updatedKeywords: ["variable ownership", "thread safety", ...],
 * //   evolutionReason: "New memory provides disturbing fantasies regarding Rust."
 * // }
 */
export const llmEvolution = asyncThrottle(async (params: { newMemory: string; existingMemory: string }): Promise<any> => {
	console.debug("llmEvolution called with params:", params);
	const { newMemory, existingMemory } = params;
	if (!newMemory || !existingMemory) throw new Error("Both newMemory and existingMemory are required");
	let messages: Record<string, string>[] = [];
	let schema = {};
	let message = "";

	message = `Your task: Analyze the new memory and existing memory below. Decide if the new memory adds meaningful new information (e.g., enhances or expands with details like bonds, commitments, or landscapes). `;
	message += `If yes, set shouldEvolve to true, provide updated fields by merging/enhancing the existing ones, and explain in evolutionReason. If no (e.g., insufficient new info), `;
	message += `set shouldEvolve to false and evolutionReason to "No new meaningful information". Always output a complete JSON object matching this schema exactly.`;
	message += `New memory: ${newMemory}\nExisting memory: ${existingMemory}\n\n`;

	schema = evolutionSchema;
	messages.push({
		role: "user",
		content: message
	});
	const settings: ApiLlmSettings = {
		maxNewTokens: 512,
		topK: 20,
		penaltyFrequency: 1.3
	};
	return await structuredPrompt(messages, schema, settings);
}, 500);
export const llmGenerateTags = asyncThrottle(async (params: { prompt: string; settings?: ApiLlmSettings }): Promise<any> => {
	console.debug("llmGenerateTags called with params:", params);
	const { prompt, settings } = params;
	if (!prompt) throw new Error("Both content and context are required");
	let messages = [];
	messages.push({
		role: "user",
		content: ` \nContext: ${prompt}\n`
	});
	const schema = tagsSchema;
	//body.prompt += `Respond ONLY with JSON matching this schema: ${JSON.stringify(body.schema)}`;
	return await structuredPrompt(messages, schema, {
		maxNewTokens: 100,
		temperature: 0.18,
		penaltyPresence: 1.3,
		topP: 0.95,
		topK: 70,
		...settings
	});
}, 500);
/**
 * Throttled asynchronous function that tokenizes the given text using an API call and specified tokeniser.
 *
 * @param params - An object containing:
 *   - `text`: The input string to be tokenized.
 *   - `tokeniser`: The tokeniser to use for tokenization (optional)
 * @returns A promise that resolves to an object containing the token count (`{ tokenCount }`).
 * @throws Will throw an error if the input text is not provided.
 *
 * @example
 * const result = await llmTokens({ text: "Hello world!", tokeniser: "gte" });
 * // result: { tokenCount: 3 }
 */
export const llmTokens = asyncThrottle(async (params: { text: string; tokeniser?: string }): Promise<any> => {
	console.debug("llmTokens called with params:", params);
	if (!params.text) throw new Error("Text is required for tokenisation");
	return await _api("/api/transformers/tokens", "POST", {
		text: params.text,
		tokeniser: params.tokeniser
	});
}, 500);
export const llmTextGeneration = asyncThrottle(
	async (params: { messages: Record<string, string>[]; settings: ApiLlmSettings }): Promise<any> => {
		if (!params || !params.messages || !Array.isArray(params.messages) || params.messages.length === 0) {
			throw new Error("Messages array is required and must not be empty");
		}
		const llmSettings: any = getSettings();
		return await _api(`/api/llm/provider/${llmSettings.llmActive}/chat`, "POST", {
			messages: params.messages,
			settings: params.settings
		});
	},
	500
);
export const llmGenerateImagePrompt = asyncDebounce(async (params: { messages: Record<string, string>[] }) => {
	if (!params || !params.messages || !Array.isArray(params.messages) || params.messages.length === 0) {
		throw new Error("Messages array is required and must not be empty");
	}
	return await structuredPrompt(params.messages, imagePromptSchema, {
		maxNewTokens: 200,
		temperature: 0.4,
		topP: 0.95,
		topK: 40,
		penaltyPresence: 0.7,
		streaming: false,
		reasoning: false
	});
}, 500);
//singular - get info on current model
export const llmGetModel = asyncDebounce(async (): Promise<any> => {
	return await _api("/api/llm/provider/lmstudio/models", "HEAD", {});
}, 500);
//plural - get information on all available LLM models
export const llmGetModels = asyncDebounce(async (): Promise<any> => {
	return await _api("/api/llm/provider/lmstudio/models", "GET", {});
}, 500);
export const llmLoadModel = asyncDebounce(async (model: string): Promise<any> => {
	return await _api("/api/llm/provider/lmstudio/models", "PUT", {
		model
	});
}, 500);
export const llmUnloadModels = asyncDebounce(async (): Promise<any> => {
	return await _api("/api/llm/provider/lmstudio/models", "DELETE");
}, 500);
export const llmTestConnection = asyncDebounce(async (llm: string): Promise<any> => {
	if (!llm) throw new Error("LLM provider is required for connection test");
	return await _api(`/api/llm/provider/${llm}/ping`, "GET", {});
}, 500);
//##################################
// Helper functions
async function structuredPrompt(messages: Record<string, string>[], schema: any, settings: ApiLlmSettings) {
	if (!messages || !Array.isArray(messages) || messages.length === 0) {
		throw new Error("Messages array is required and must not be empty");
	}
	if (!schema) throw new Error("Schema is required for structured prompt");
	const llmSettings = getSettings();
	return await _api(`/api/llm/provider/${llmSettings.llmActive}/structured`, "POST", {
		messages,
		schema,
		settings
	});
}
function getSettings(): DungeonGameSettings | CharacterSettings | EngineSettings {
	const mode = get(Gamemode);
	if (mode === "dungeons") {
		return get(DungeonGameSettingsStore);
	} else if (mode === "characters") {
		return get(CharacterSettingsStore);
	} else {
		return get(engineSettings);
	}
}
