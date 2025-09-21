import { get } from "svelte/store";
import { llmGenerateImagePrompt, llmGenerateTags, llmTextGeneration } from "$lib/controllers/llm";
import { CharacterSettingsStore, CharacterStore } from "$lib/engine/engine-character";
import { EngineConversation } from "$lib/engine/engine-conversation";
import { DungeonGameSettingsStore } from "$lib/engine/engine-dungeon";
import { EnginePersonaStore } from "$lib/engine/engine-persona";
import { engineSettings } from "$lib/stores/engine";
import { calculateHash, firstToSecondPerson, promptReplace, resultReplace } from "$lib/utilities/utils";
import { Gamemode } from "../global";
import { DebugLogger } from "../utilities/error-manager";
import type { FetchRequestInput } from "../utilities/request-manager";

//Note: History will split out media types and only return text types
export async function generateStory(
	message: string,
	actionOption: string,
	opts?: { customPrompt?: string; historyFeed?: number; returnResponseOnly?: boolean }
) {
	let Dgss: DungeonGameSettings = get(DungeonGameSettingsStore);
	if (!Dgss) return;
	//put message into conversation first
	toSecondPerson(message, actionOption);
	let prompt = Dgss.llmTextSettings.prompt ?? "";
	const persona = await EnginePersonaStore.get(); //should get the data from the database
	let hist = await EngineConversation.history(opts?.historyFeed, true);
	let mPrompt = replaceTags(prompt, persona, hist, Dgss);
	//create messages array
	let messages = [];
	messages.push({ role: "system", content: mPrompt });
	messages.push(...hist);
	const settings = {
		messages: messages,
		model: Dgss.llmTextSettings.model,
		llmTextSettings: Dgss.llmTextSettings,
		llmResponseSettings: Dgss.llmResponseSettings,
		user: persona.persona
	};
	let resp = await llmTextGeneration({ messages, settings });
	if (!resp) return;
	await EngineConversation.add(resp || "");
	return resp; //pointless return but hey ho, where else would it go? down the toilet, yo!
}
export async function generateCharResponse(
	message: string,
	actionOption: string | null,
	opts?: { customPrompt?: string; historyFeed?: number; returnResponseOnly?: boolean }
): Promise<FetchRequestInput | undefined> {
	let Css: CharacterSettings = get(CharacterSettingsStore);
	let char = get(CharacterStore);
	if (!Css) return;
	let prompt = Css.llmTextSettings.prompt ?? "";
	EngineConversation.add(message, { actionOption });
	const persona = await EnginePersonaStore.get(); //should get the data from the database
	let hist = (await EngineConversation.history(opts?.historyFeed, true)) as Conversation[]; //skip join and return array.
	let mPrompt = replaceCharTags(prompt, persona, char, Css);
	//create messages array
	let messages = [];
	messages.push({ role: "system", content: mPrompt });
	messages.push(...hist);
	if (actionOption === "continue") messages.push({ role: "user", content: "[continue]" });

	//======================================================//=====================================================
	//Try figure out context fetching here....
	const systemPrompt = await getSystemChatPrompt(
		Css.worldId,
		Css.cId,
		mPrompt,
		{ customInstructions: Css.llmTextSettings.customInstructions },
		Css.dbPath
	);
	//=====================================================//=====================================================
	const settings: RequestInit = {
		body: JSON.stringify({
			messages: messages,
			model: Css.llmTextSettings.model,
			llmTextSettings: Css.llmTextSettings,
			llmResponseSettings: Css.llmResponseSettings,
			user: persona.persona
		}),
		headers: { "Content-Type": "application/json" },
		method: "POST"
	};
	const hash: number = calculateHash(message ?? Date.now(), Date.now());
	await EngineConversation.add("", { ignoreCleanup: true, hash, transacting: true });
	return {
		//if not message then calculate a random hash on date.now
		hash: hash,
		type: "LLM",
		url: `/api/llm/provider/${Css.llmActive}/chat`,
		options: settings
	};
}

export async function generateCharDetails(prompt: string, action: string) {
	let Css = get(CharacterSettingsStore);
	let char = get(CharacterStore);
	if (!Css) return;
	const persona = await EnginePersonaStore.get(); //should get the data from the database
	let mPrompt = replaceCharTags(prompt, persona, char, Css);
	//create messages array
	const messages = [{ role: "system", content: mPrompt }];
	console.log("generateCharDetails called with prompt", mPrompt);
	const settings = {
		model: Css.llmTextSettings.model,
		user: persona.persona
	};
	let resp = null;
	if (action === "strengths" || action === "flaws") {
		resp = await llmGenerateTags({ prompt: mPrompt, settings });
		return resp; //join the tags with a comma
	} else {
		resp = await llmTextGeneration({ messages, settings });
		return resultReplace(resp as string);
	}
}
//TODO: Needs work
export async function generateImagePrompt(prompt: string, selfFeedHistory?: any) {
	const hist = selfFeedHistory ?? EngineConversation.history();
	const mode = getGamemode();
	const dgss: DungeonGameSettings | CharacterSettings = getSettings(mode);
	let messages: Record<string, string>[] = [];
	let persona = await getPersona();
	//set up system message
	messages.push({
		role: "system",
		content:
			mode === "dungeons"
				? replaceTags(prompt, persona, "", dgss as DungeonGameSettings)
				: replaceCharTags(dgss.llmTextSettings.prompt ?? "", persona, get(CharacterStore), dgss as CharacterSettings)
	});
	messages.push(...hist);
	messages.push({ role: "user", content: prompt });
	return await llmGenerateImagePrompt({ messages }); //pointless return but hey ho, where else would it go? down the toilet, yo!
}
/**
 * @deprecated Use {@link llmTextGeneration} instead.
 *
 * Generates a raw response from the LLM based on the provided prompt and options.
 * Selects settings from either the engine or dungeon game context, optionally appends history,
 * and configures generation parameters such as temperature, max tokens, penalties, and stopping criteria.
 * Optionally cleans the response text before returning.
 *
 * @param weAre - Context identifier, either "engine" or another value for dungeon game settings.
 * @param prompt - The prompt string to send to the LLM.
 * @param opts - Optional generation settings:
 *   - temperature: Sampling temperature.
 *   - maxTokens: Maximum number of tokens to generate.
 *   - presence: Presence penalty.
 *   - frequency: Frequency penalty.
 *   - topP: Nucleus sampling probability.
 *   - typicalP: Typical sampling probability.
 *   - historyFeed: Number of history entries to append.
 *   - cleanText: Whether to clean the response text.
 *   - stops: Array of stop sequences.
 * @returns The generated response from the LLM, optionally cleaned.
 */
export async function generateRawdog(
	weAre: string,
	prompt: string,
	opts?: ApiLlmSettings & {
		historyFeed?: number;
		cleanText?: boolean;
	}
) {
	let mStore: any;
	if (weAre === "engine") mStore = get(engineSettings);
	else mStore = get(DungeonGameSettingsStore);
	if (opts?.historyFeed) {
		let hist = await EngineConversation.history(opts.historyFeed);
		prompt += hist;
	}
	//create messages array
	let messages = [];
	messages.push({ role: "system", content: "Your are a roleplay master" });
	messages.push({ role: "user", content: prompt });
	const settings: ApiLlmSettings = {
		temperature: opts?.temperature ?? mStore.llmTextSettings.temperature,
		maxNewTokens: opts?.maxNewTokens ?? mStore.llmTextSettings.maxNewTokens,
		maxTokens: opts?.maxTokens ?? mStore.llmTextSettings.maxTokens,
		penaltyPresence: opts?.penaltyPresence ?? mStore.llmTextSettings.penalty.presence ?? 1.5,
		penaltyFrequency: opts?.penaltyFrequency ?? mStore.llmTextSettings.penalty.frequency ?? 1.5,
		topP: opts?.topP ?? mStore.llmTextSettings.p.top ?? 1,
		typicalP: opts?.typicalP ?? mStore.llmTextSettings.p.typical ?? 0.5,
		minP: mStore.llmTextSettings.p.min ?? 0,
		topK: mStore.llmTextSettings.topK ?? 50,
		streaming: mStore.llmResponseSettings.stream ?? false,
		reasoning: mStore.llmTextSettings.reasoning ?? false,
		stop: opts?.stop ?? []
	};
	let resp = await llmTextGeneration({ messages, settings });
	if (opts?.cleanText) return resultReplace(resp); //remove shite
	console.log("Rawdog response:", resp);
	return resp;
}
async function getSystemChatPrompt(worldId: string, charId: string, query: string, options?: any, dbPath?: string): Promise<any> {
	try {
		if (!worldId || !charId) {
			throw new Error("worldId and charId are required");
		}
		// Get character data
		const characterData = ""; //FIXME: Add actual character data pish
		if (!characterData) {
			throw new Error("Character not found");
		}
		const contexts = [""]; //FIXME: Add api fetch call to get contexts.
		// Build system prompt
		const systemPrompt = buildSystemPrompt({
			characterData,
			contexts,
			charId,
			worldId,
			customInstructions: options?.customInstructions
		});
		return {
			systemPrompt,
			contextsUsed: contexts.length,
			charId,
			worldId
		};
	} catch (err: any) {
		console.error("Error generating system prompt:", err);
		throw new Error(err.message);
	}
}

//=======================================
/**
 * Helper function to build system prompt from character data and context
 */
function buildSystemPrompt({
	characterData,
	contexts,
	charId,
	worldId,
	customInstructions = "You are a helpful AI assistant."
}: {
	characterData: any;
	contexts: any[];
	charId: string;
	worldId: string;
	customInstructions?: string;
}): string {
	const sections: string[] = [];

	// Base instructions
	sections.push(`${customInstructions}\n\nYou are ${charId}, operating in the world "${worldId}".`);

	// Character information (placeholder for JSON data)
	sections.push("\n## Character Profile");
	sections.push(`**Name:** ${characterData.name || charId}`);

	if (characterData.personality) {
		sections.push(`**Personality:** ${characterData.personality}`);
	} else {
		sections.push(`**Personality:** [PLACEHOLDER - Add personality from character JSON]`);
	}

	if (characterData.appearance) {
		sections.push(`**Appearance:** ${characterData.appearance}`);
	} else {
		sections.push(`**Appearance:** [PLACEHOLDER - Add appearance from character JSON]`);
	}

	if (characterData.background) {
		sections.push(`**Background:** ${characterData.background}`);
	} else {
		sections.push(`**Background:** [PLACEHOLDER - Add background from character JSON]`);
	}

	if (characterData.traits && characterData.traits.length > 0) {
		sections.push(`**Key Traits:** ${characterData.traits.join(", ")}`);
	} else {
		sections.push(`**Key Traits:** [PLACEHOLDER - Add traits from character JSON]`);
	}

	// Recent relevant context
	if (contexts.length > 0) {
		sections.push("\n## Relevant Context & Memories");

		const chatContexts = contexts.filter((c) => c.type === "chat").slice(0, 5);
		const worldContexts = contexts.filter((c) => c.type === "world_lore" || c.type === "world_event").slice(0, 3);

		if (chatContexts.length > 0) {
			sections.push("\n### Recent Interactions:");
			chatContexts.forEach((ctx, idx) => {
				const speaker = ctx.metadata?.speaker || "Unknown";
				const content = ctx.summary || ctx.content.slice(0, 100);
				sections.push(`${idx + 1}. **${speaker}:** ${content}${ctx.content.length > 100 ? "..." : ""}`);
			});
		}

		if (worldContexts.length > 0) {
			sections.push("\n### World Knowledge:");
			worldContexts.forEach((ctx, idx) => {
				const content = ctx.summary || ctx.content.slice(0, 100);
				const tags = ctx.tags ? ` [${ctx.tags.slice(0, 3).join(", ")}]` : "";
				sections.push(`${idx + 1}. ${content}${ctx.content.length > 100 ? "..." : ""}${tags}`);
			});
		}

		// Emotional context if available
		const emotionalContexts = contexts.filter((c) => c.emotionalState && Object.keys(c.emotionalState).length > 0);
		if (emotionalContexts.length > 0) {
			sections.push("\n### Emotional Context:");
			const recentEmotion = emotionalContexts[0].emotionalState;
			sections.push(`Recent emotional state: ${JSON.stringify(recentEmotion)}`);
		}
	}

	// Guidelines
	sections.push("\n## Roleplay Guidelines");
	sections.push("- Stay in character at all times");
	sections.push("- Reference relevant memories and context naturally");
	sections.push("- Respond based on your personality and background");
	sections.push("- Keep responses engaging and true to your character");

	return sections.join("\n");
}
function toSecondPerson(message: string, actionOption: string) {
	{
		let m = message.trim();
		DebugLogger.debug("m is", m);
		m = m[0].toLowerCase() + m.slice(1);
		if (![".", "?", "!"].includes(m.slice(-1))) {
			m += ".";
		}
		if (actionOption !== "say") m = firstToSecondPerson(m);

		m = actionOption === "do" ? `>You ${m}` : actionOption === "say" ? `You say "${m}"` : message;

		if (["say", "ask", '"'].some((substring) => m.includes(substring))) {
			// Update the store value to increase the token value by 50%
			DungeonGameSettingsStore.update((store) => {
				store.llmResponseSettings.maxTokens = store.llmResponseSettings.maxTokens * 1.5;
				return store;
			});
		} else {
			// Update the store value to the default token value
			DungeonGameSettingsStore.update((store) => {
				return store;
			});
		}

		m = promptReplace(m);
		const lastPrompt = m.includes(">") ? m.split(">").pop() : m;
		//If it's a continue, don't add the user message to the conversation
		EngineConversation.add(m, {
			hash: calculateHash(m ?? Date.now(), Date.now()), //hash with timestamp
			role: actionOption === "story" ? "assistant" : "user", //role
			type: "text", //type
			ignoreCleanup: false, //ignoreCleanup
			transacting: false, //transacting
			actionOption
		});
	}
}
function getGamemode() {
	return get(Gamemode);
}
async function getPersona() {
	return await EnginePersonaStore.get();
}
function getSettings(mode: string) {
	return mode === "dungeons" ? get(DungeonGameSettingsStore) : get(CharacterSettingsStore);
}
function replaceTags(prompt: string, persona: any, recent: any, Dgss: DungeonGameSettings) {
	// Replace {{user}} in personaDesc
	const updatedPersonaDesc = persona.personaDesc.replace(/{{user}}/g, persona.persona);
	// Replace placeholders in the prompt
	return (
		prompt
			.replace(/{{wordCount}}/g, `${Dgss.llmResponseSettings.wordCount ?? 100}`)
			.replace(/{{personaName}}/g, `${persona.persona ? `User's Persona: ${persona.persona}.` : ""}`)
			.replace(/{{personaDesc}}/g, `${updatedPersonaDesc ? `User's Persona description: ${updatedPersonaDesc}.` : ""}`)
			.replace(/{{genre}}/g, `${Dgss.game.genre ? `Genre: ${Dgss.game.genre}.` : ""}`)
			.replace(/{{opening}}/g, `${Dgss.game.opening ? `Opening: ${Dgss.game.opening}.` : ""}`)
			.replace(/{{responseLength}}/g, Dgss.llmResponseSettings.maxTokens ?? 100)
			.replace(/{{plotEssentials}}/g, `${Dgss.game.plotEssentials ? `[Plot essentials:\n ${Dgss.game.plotEssentials}]` : ""}`)
			.replace(/{{authorsNotes}}/g, `${Dgss.game.authorsNotes ? `[Authors notes:\n${Dgss.game.authorsNotes}]` : ""}`)
			//.replace(/{{storySummary}}/g, `${summary ? `[Summary:\n${summary}.]` : ""}`)
			.replace(/{{user}}/g, `${persona.persona ? `${persona.persona}` : "the user"}`)
			//.replace(/{{recent}}/g, `${recent ? ` ${recent}.` : ""}`)
			.trim()
	);
}
function replaceCharTags(prompt: string, persona: any, char: Character, llmSettings: CharacterSettings) {
	// Replace {{user}} in personaDesc
	const updatedPersonaDesc = persona.personaDesc.replace(/{{user}}/g, persona.persona);
	//** THERE'S NO HISTORY HERE AS IT'S PASSED AS MESSAGES */
	// Replace placeholders in the prompt
	return (
		prompt
			.replace(/{{personaName}}/g, `${persona.persona ? `User's Persona: ${persona.persona}.` : ""}`)
			.replace(/{{personaDesc}}/g, `${updatedPersonaDesc ? `User's Persona description: ${updatedPersonaDesc}.` : ""}`)
			.replace(/{{wordCount}}/g, `${llmSettings?.llmResponseSettings?.wordCount ?? 100}`)
			.replace(/{{age}}/g, `${char.age ? `${char.age}` : ""}`)
			.replace(/{{description}}/g, `${char.description ? `${char.description}` : ""}`)
			.replace(/{{background}}/g, `${char.background ? `${char.background}` : ""}`)
			.replace(/{{strengths}}/g, `${char.strengths ? `${char.strengths}` : ""}`)
			.replace(/{{flaws}}/g, `${char.flaws ? `${char.flaws}` : ""}`)
			.replace(/{{goal}}/g, `${char.goals ? `${char.goals.join(", ")}` : ""}`)
			//with titles xxx_w_title
			.replace(/{{user_w_title}}/g, `${persona.persona ? `User's Persona: ${persona.persona}` : ""}`)
			.replace(/{{char_w_title}}/g, `${char.name ? `Character Name: ${char.name}` : ""}`)
			.replace(/{{age_w_title}}/g, `${char.age ? `Character Age: ${char.age}` : ""}`)
			.replace(/{{description_w_title}}/g, `${char.description ? `Character Description: ${char.description}` : ""}`)
			.replace(/{{background_w_title}}/g, `${char.background ? `Character Background: ${char.background}` : ""}`)
			.replace(/{{strengths_w_title}}/g, `${char.strengths ? `Character Personality Strengths: ${char.strengths}` : ""}`)
			.replace(/{{flaws_w_title}}/g, `${char.flaws ? `Character Personality Flaws: ${char.flaws}` : ""}`)
			.replace(/{{goal_w_title}}/g, `${char.goals ? `Character Goal: ${char.goals.join(", ")}` : ""}`)
			.replace(/{{gender_w_title}}/g, `${char.gender ? `Character Gender: ${char.gender}` : ""}`)
			//.replace(/{{storySummary}}/g, `${summary ? `[Summary:\n${summary}.]` : ""}`)
			.replace(/{{responseLength}}/g, llmSettings?.llmResponseSettings?.maxTokens ?? 100)
			.replace(/{{face_w_title}}/g, `${char.faceCaption ? `Character Facial Features: ${char.faceCaption}` : ""}`)
			.replace(/{{body_w_title}}/g, `${char.bodyCaption ? `Character Body Features: ${char.bodyCaption}` : ""}`)
			//AT THE BOTTOM SO THAT THEY REPLACE ANY INSTANCES IN THE OTHER PISH
			.replaceAll(/{{user}}/g, `${persona.persona ? `${persona.persona}` : "the user"}`)
			.replaceAll(/{{char}}/g, `${char.name ? `${char.name}` : ""}`)
			.replace(/{{gender}}/g, `${char.gender ? `${char.gender}.` : ""}`)
			.trim()
	);
}
