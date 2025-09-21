//Store for hte basic SD settings associated with a game
import { tick } from "svelte";
import { get, writable } from "svelte/store";
import { dbGet, dbSet } from "$lib/controllers/db";
import { Gamemode } from "$lib/global";
import { DebugLogger } from "$lib/utilities/error-manager";
import { fixPromptSpacing } from "$lib/utilities/sd-utils";

export const UPDATE_INTERVAL = 1000;
// This is a 1x1 transparent PNG
export const PNG_PIXEL = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
export const placeholderVae = "Automatic";
export const sdSources = {
	//webui: "webui",
	comfy: "comfy"
	//civitai: "civitai"
};
export const generationMode = {
	MESSAGE: -1,
	CHARACTER: 0,
	USER: 1,
	SCENARIO: 2,
	RAW_LAST: 3,
	NOW: 4,
	FACE: 5,
	FREE: 6,
	BACKGROUND: 7,
	CHARACTER_MULTIMODAL: 8,
	USER_MULTIMODAL: 9,
	FACE_MULTIMODAL: 10,
	FREE_EXTENDED: 11
};
export const multimodalMap = {
	[generationMode.CHARACTER]: generationMode.CHARACTER_MULTIMODAL,
	[generationMode.USER]: generationMode.USER_MULTIMODAL,
	[generationMode.FACE]: generationMode.FACE_MULTIMODAL
};
export const modeLabels = {
	[generationMode.MESSAGE]: "Chat Message Template",
	[generationMode.CHARACTER]: 'Character ("Yourself")',
	[generationMode.FACE]: 'Portrait ("Your Face")',
	[generationMode.USER]: 'User ("Me")',
	[generationMode.SCENARIO]: 'Scenario ("The Whole Story")',
	[generationMode.NOW]: "Last Message",
	[generationMode.RAW_LAST]: "Raw Last Message",
	[generationMode.BACKGROUND]: "Background",
	[generationMode.CHARACTER_MULTIMODAL]: "Character (Multimodal Mode)",
	[generationMode.FACE_MULTIMODAL]: "Portrait (Multimodal Mode)",
	[generationMode.USER_MULTIMODAL]: "User (Multimodal Mode)",
	[generationMode.FREE_EXTENDED]: "Free Mode (LLM-Extended)"
};
/*export const triggerWords = {
  [generationMode.CHARACTER]: ["you"],
  [generationMode.USER]: ["me"],
  [generationMode.SCENARIO]: ["scene"],
  [generationMode.RAW_LAST]: ["raw_last"],
  [generationMode.NOW]: ["last"],
  [generationMode.FACE]: ["face"],
  [generationMode.BACKGROUND]: ["background"],
};*/
/*export const messageTrigger = {
  activationRegex:
	/\b(send|mail|imagine|generate|make|create|draw|paint|render|show)\b.{0,10}\b(pic|picture|image|drawing|painting|photo|photograph)\b(?:\s+of)?(?:\s+(?:a|an|the|this|that|those|your)?)?(.+)/i,
  specialCases: {
	[generationMode.CHARACTER]: ["you", "yourself"],
	[generationMode.USER]: ["me", "myself"],
	[generationMode.SCENARIO]: ["story", "scenario", "whole story"],
	[generationMode.NOW]: ["last message"],
	[generationMode.FACE]: ["your face", "your portrait", "your selfie"],
	[generationMode.BACKGROUND]: [
	  "background",
	  "scene background",
	  "scene",
	  "scenery",
	  "surroundings",
	  "environment",
	],
  },
};*/
export const promptTemplatesSd = {
	// Not really a prompt template, rather an outcome message template
	[generationMode.MESSAGE]: "[{{char}} sends a picture that contains: {{prompt}}].",
	/*OLD:     [generationMode.CHARACTER]: "Pause your roleplay and provide comma-delimited list of phrases and keywords which describe {{char}}'s physical appearance and clothing. Ignore {{char}}'s personality traits, and chat history when crafting this description. End your response once the comma-delimited list is complete. Do not roleplay when writing this description, and do not attempt to continue the story.", */
	[generationMode.CHARACTER]:
		"[In the next response, ONLY RESPOND WITH ONE COMMA-DELIMITED LIST OF KEYWORDS TO DESCRIBE THE LAST MESSAGE. The keywords should be descriptive but concise, geared towards creating a full character portrait. Include the specified characteristics: Perspective, Camera Shot, Camera Angle, Camera Lens, Lighting, Location, Character Genders, Primary Action, and Characters in Scene (grouped by individual). They must include relevant descriptive and detailed explicit keywords, when appropriate. Only respond with the comma-separated keyword list.]",

	//face-specific prompt
	[generationMode.FACE]:
		"[In the next response I want you to provide only a detailed comma-delimited list of keywords and phrases which describe {{char}}. The list must include all of the following items in this order: name, species and race, gender, age, facial features and expressions, occupation, hair and hair accessories (if any), what they are wearing on their upper body (if anything). Do not describe anything below their neck. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'close up facial portrait,']",
	//prompt for only the last message
	[generationMode.USER]:
		"[Pause your roleplay and provide a detailed description of {{user}}'s physical appearance from the perspective of {{char}} in the form of a comma-delimited list of keywords and phrases. The list must include all of the following items in this order: name, species and race, gender, age, clothing, occupation, physical features and appearances. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'full body portrait,'. Ignore the rest of the story when crafting this description. Do not roleplay as {{char}} when writing this description, and do not attempt to continue the story.]",
	[generationMode.SCENARIO]:
		"[Pause your roleplay and provide a detailed description for all of the following: a brief recap of recent events in the story, {{char}}'s appearance, and {{char}}'s surroundings. Do not roleplay while writing this description.]",

	[generationMode.NOW]: `[Pause your roleplay and provide a danbooru keywords list of the last message. You will provide 20 keywords or less. Keywords must describe the view from the perspective of the user and be descriptive but concise. The keywords should include the specified characteristics: Perspective, Camera Shot, Camera Angle, Camera Lens, Lighting, Location, Primary Action, and Characters in Scene (grouped by individual). They must include descriptive and detailed explicit keywords, when appropriate. For example: 'first person, pov, close-up, wide-angle, 50mm, dimly lit, bedroom, 1girl 1boy, anal sex, (girl: wet with sweat, naked, hand on bed, looking at male)'. \nONLY RESPOND WITH ONE COMMA-DELIMITATED LIST OF KEYWORDS.]`,

	[generationMode.RAW_LAST]:
		"[Pause your roleplay and provide ONLY the last chat message string back to me verbatim. Do not write anything after the string. Do not roleplay at all in your response. Do not continue the roleplay story.]",
	[generationMode.BACKGROUND]: `[IMPORTANT: STOP ALL ROLEPLAYING NOW. You must ignore any narrative, roleplay, or character details and provide a single output as follows:

1. Begin your output with the literal text: "background,".
2. After this prefix, list up to 20 comma-separated keywords that describe only the background or scene.
3. The first five keywords must appear in this exact order: location, time of day, weather, lighting, and one additional visual detail.
4. ONLY include details about the setting that are visually observable in a still photograph. Under no circumstances should your output include any descriptions of characters, character names, personalities, movements, or any other non-background elements.
5. Do not continue the story or include any roleplaying elements.

Your entire response should be exactly one line following these instructions. Now, provide the keyword list.]`,
	[generationMode.FACE_MULTIMODAL]:
		'Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with "close-up portrait".',
	[generationMode.CHARACTER_MULTIMODAL]:
		'Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with "full body portrait".',
	[generationMode.USER_MULTIMODAL]:
		'Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with "full body portrait".',
	[generationMode.FREE_EXTENDED]:
		'Pause your roleplay and provide an exhaustive comma-separated list of tags describing the appearance of "{0}" in great detail. Start with {{charPrefix}} (sic) if the subject is associated with {{char}}.'
};
export const promptTemplatesFlux = {
	// Not really a prompt template, rather an outcome message template
	[generationMode.MESSAGE]: "[{{char}} sends a picture that contains: {{prompt}}].",
	/*OLD:     [generationMode.CHARACTER]: "Pause your roleplay and provide comma-delimited list of phrases and keywords which describe {{char}}'s physical appearance and clothing. Ignore {{char}}'s personality traits, and chat history when crafting this description. End your response once the comma-delimited list is complete. Do not roleplay when writing this description, and do not attempt to continue the story.", */
	[generationMode.CHARACTER]:
		"[In the next response, generate relevant keywords. They should be descriptive but concise, geared towards creating a full character portrait. Include the specified characteristics: Perspective, Camera Shot, Camera Angle, Camera Lens, Lighting, Location, Character Genders, Primary Action, and Characters in Scene (grouped by individual). They must include relevant descriptive and detailed explicit keywords, when appropriate. ONLY RESPOND WITH ONE COMMA-DELIMITATED LIST OF KEYWORDS.]",

	//face-specific prompt
	[generationMode.FACE]:
		"[In the next response I want you to provide only a detailed comma-delimited list of keywords and phrases which describe {{char}}. The list must include all of the following items in this order: name, species and race, gender, age, facial features and expressions, occupation, hair and hair accessories (if any), what they are wearing on their upper body (if anything). Do not describe anything below their neck. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'close up facial portrait,']",
	//prompt for only the last message
	[generationMode.USER]:
		"[Pause your roleplay and provide a detailed description of {{user}}'s physical appearance from the perspective of {{char}} in the form of a comma-delimited list of keywords and phrases. The list must include all of the following items in this order: name, species and race, gender, age, clothing, occupation, physical features and appearances. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'full body portrait,'. Ignore the rest of the story when crafting this description. Do not roleplay as {{char}} when writing this description, and do not attempt to continue the story.]",
	[generationMode.SCENARIO]:
		"[Pause your roleplay and provide a detailed description for all of the following: a brief recap of recent events in the story, {{char}}'s appearance, and {{char}}'s surroundings. Do not roleplay while writing this description.]",

	[generationMode.NOW]:
		"[Pause your roleplay. Extract key visual details from the given story and convert them into a concise, natural-language description suitable for Flux image generation. Focus on essential aspects like that would be perceive by {{user}} such as camera shot, angle, lighting, location, primary action, and individual character details. Ensure the prompt is vivid yet succinct, avoiding excessive technical jargon, dialogue or comma-delimited lists.]",

	[generationMode.RAW_LAST]:
		"[Pause your roleplay and provide ONLY the last chat message string back to me verbatim. Do not write anything after the string. Do not roleplay at all in your response. Do not continue the roleplay story.]",
	[generationMode.BACKGROUND]:
		"[Pause your roleplay and provide a detailed description of {{char}}'s surroundings in the form of a comma-delimited list of keywords and phrases. The list must include all of the following items in this order: location, time of day, weather, lighting, and any other relevant details. Do not include descriptions of characters and non-visual qualities such as names, personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'background,'. Ignore the rest of the story when crafting this description. Do not roleplay as {{user}} when writing this description, and do not attempt to continue the story.]",
	[generationMode.FACE_MULTIMODAL]:
		'Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with "close-up portrait".',
	[generationMode.CHARACTER_MULTIMODAL]:
		'Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with "full body portrait".',
	[generationMode.USER_MULTIMODAL]:
		'Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with "full body portrait".',
	[generationMode.FREE_EXTENDED]:
		'Pause your roleplay and provide an exhaustive comma-separated list of tags describing the appearance of "{0}" in great detail. Start with {{charPrefix}} (sic) if the subject is associated with {{char}}.'
};
export const attachToDungeonImagePrompt = `{{personaName}} 
{{personaDesc}} 
{{genre}} 
{{opening}} 
{{plotEssentials}} 
{{authorsNotes}} 
{{storySummary}}
{{recent}}`;

const defaultPositive = "embedding:Pony/zPDXL3";
const defaultNegative = "bad quality,worst quality,worst detail,sketch,censored,watermark,signature,artist name";

//------------------------------
const defaultSettings = {
	//################################################################
	source: sdSources.comfy,
	webui: {
		url: "http://127.0.0.1:7860",
		auth: "",
		validated: false
	},
	comfy: {
		url: "http://127.0.0.1:8188",
		auth: "",
		validated: false,
		interogateWf: "CRL-INTERROGATE.json"
	},
	civitai: {
		url: "https://api.fuckknows", //TODO: IMPLEMENT - Practically non-existant on the to do list.
		auth: "",
		validated: false
	},
	// Image dimensions (Width & Height)
	width: 512,
	height: 512,
	positivePrompt: defaultPositive,
	negativePrompt: defaultNegative,
	// Automatic1111/Webui exclusives
	hiresFix: false,
	// Refine mode
	llmPromptGen: true,
	editBeforeGen: true,
	interactiveMode: true, // Allows the key 'See' to be used.
	// Scheduler
	freeExtend: false,
	prompts: promptTemplatesSd,
	hrUpscaler: "4x-ULtraSharp.pth",
	hrScale: 2,
	hrDenoisingStrength: 0.65,
	hrSecondPassSteps: 2
};
export const fixedParams = {
	hrSecondPassStepsMax: 50,
	hrSecondPassStepsStep: 1,
	//-
	denoisingStrengthMax: 1,
	denoisingStrengthStep: 0.01,
	//-
	hrScaleMin: 1.0,
	hrScaleMax: 4.0,
	hrScaleStep: 0.1,
	//-
	dimensionMin: 64,
	dimensionMax: 2048,
	dimensionStep: 64,
	//-
	clipskipMin: 1,
	clipskipMax: 12,
	clipskipStep: 1,
	//-
	stepsMin: 1,
	stepsMax: 150,
	stepsStep: 1,
	//-
	scaleMin: 1,
	scaleMax: 30,
	scaleStep: 0.5
};
export const expressYourself = {
	admiration: "widened eyes, raised eyebrows, and a slight smile conveying admiration and awe",
	amusement: "slight tilt of the head, mouth slightly open, and eyes sparkling with amusement",
	anger: "steely gaze, gritted teeth, and flushed cheeks reflecting simmering anger.",
	annoyance: "slight eye roll, pursed lips, and a tired expression reflecting annoyance",
	approval: "contented expression, eyebrows relaxed, and a soft gaze that conveys genuine approval",
	caring: "concern, brows furrowed slightly, and a soft, reassuring gaze reflecting caring.",
	confusion: "blank stare, mouth slightly agape, and a furrowed forehead showing a state of bewilderment and confusion.",
	curiosity: "contemplative smile, eyes searching for answers, and a curious gaze that invites exploration.",
	desire: "yearning, lips slightly parted, and eyes filled with longing and desire.",
	disappointment: "drooping shoulders, a pained expression, and eyes reflecting deep disappointment.",
	disapproval: "tight-lipped smile, eyes narrowed in disapproval, and a cold, distant expression.",
	disgust: "wide eyes, mouth slightly open in revulsion, and a recoiling expression showing disgust.",
	excitement: "bright smile, raised eyebrows, and cheerful expression radiating enthusiasm and excitement",
	embarrassment: "flushed cheeks, a sheepish smile, and eyes looking away in embarrassment.",
	fear: "sheer panic, mouth agape, and eyes filled with terror indicating deep fear.",
	gratitude: "a beaming smile, eyes crinkled at the corners, and a thankful gaze that exudes deep gratitude.",
	grief: "pained expression, eyes filled with sorrow, and a trembling lip signaling profound grief.",
	joy: "exuding excitement and joy. Energetic and lively expression, ensuring a sense of positivity",
	love: "contentment, eyes locked in a loving gaze, and a serene smile showing unconditional love.",
	nervousness: "tense expression, averted gaze, and a trembling lip reflecting nervousness.",
	neutral: "relaxed expression, neutral gaze, and a subtle smile showing a calm and neutral emotion.",
	optimism: "bright smile, eyes full of hope, and an upbeat expression reflecting optimism and positivity.",
	pride: "confident smile, raised chin, and a gleam in the eyes reflecting a strong sense of pride.",
	realization:
		"with widened eyes, a sudden look of understanding, and a subtle expression of realization dawning upon the individual.",
	relief: "relaxed smile, eyes closed in relief, and a visible exhale conveying a sense of relief and comfort.",
	remorse: "downcast eyes, a pained expression, and a look of regret and sorrow reflecting deep remorse.",
	sadness: "downturned lips, teary eyes, and a somber expression conveying profound sadness and emotional pain.",
	surprise: "wide eyes, dropped jaw, and eyebrows raised in astonishment conveying a sense of surprise and shock."
};
export const defaultCharacterSettings = {
	positivePrompt: "masterpiece, best quality, amazing quality, very aesthetic, absurdres, newest, detailed eyes",
	negativePrompt: "",
	ponyAdd: "score_9, score_8_up, score_7_up,score_6_up, source_pony", //rating_explicit
	comfy: {
		imageWf: "CRL-SDXL.json",
		videoWf: "",
		audioWf: ""
	},
	model: "SDXL/meichidarkmixReload_meichidarkLustV3.safetensors",
	modelType: "sdxl", //flux, pony, sd1.5
	resolution: "sd_res_1024x1024",
	vae: "Automatic",
	scale: 7.0,
	steps: 12,
	seed: -1,
	// Scheduler
	sampler: "dpmpp_2s_ancestral",
	scheduler: "sgm_uniform",
	clipskip: 2,
	expression: "neutral",
	cn: {
		mode: false,
		ref: {
			enable: false,
			attachTo: [6, 4, 1, 3],
			inputRef: "char",
			pixelperfect: false,
			prefer: "Balanced",
			weight: 0.6
		},
		fid: {
			enable: false,
			model: "",
			module: "",
			lora: "",
			attachTo: [6, 4, 1, 3],
			inputRef: "char",
			pixelperfect: false,
			weight: 0.6
		}
	},
	ad: {
		adetailer_mode: false,
		adetailer_models: [],
		adetailer_weight: 0.3
	},
	ao: {
		manual_ao_mode: false,
		ao_override: ""
	},
	pulid: true,
	instantId: false,
	reference: true,
	roop: false,
	freeU: false
};
export const BASE_RESOLUTIONS: [number, number][] = [
	[512, 512],
	[512, 768],
	[576, 1024],
	[768, 512],
	[768, 768],
	[768, 1024],
	[768, 1280],
	[768, 1344],
	[768, 1536],
	[816, 1920],
	[832, 1152],
	[832, 1216],
	[896, 1152],
	[896, 1088],
	[1024, 1024],
	[1024, 576],
	[1024, 768],
	[1080, 1920],
	[1440, 2560],
	[1088, 896],
	[1216, 832],
	[1152, 832],
	[1152, 896],
	[1280, 768],
	[1344, 768],
	[1536, 640],
	[1536, 768],
	[1920, 816],
	[1920, 1080],
	[2560, 1440]
];

function createEngineSdStore() {
	const { subscribe, set, update } = writable(defaultSettings);

	return {
		subscribe,
		set,
		update,
		reset: () => {
			set(structuredClone(defaultSettings));
		},
		async get(id: string) {
			const mode = get(Gamemode);
			if (!id) return;
			const result = await dbGet({
				db: `${mode}/${id}/sd`
			});
			if (!result || Object.keys(result).length === 0) {
				this.reset();
			} else {
				this.set(result);
			}
			await tick();
			DebugLogger.debug("SD Options Loaded", get(this));
		},
		async save(id: string) {
			const mode = get(Gamemode);
			if (!id) return;
			const currSdSettings = get(this);
			await dbSet({ db: `${mode}/${id}/sd`, data: currSdSettings });
		},
		async getDefault() {
			const result = await dbGet({ db: "CRL", collection: "EngineSd" });
			if (!result || Object.keys(result).length === 0) {
				this.reset();
			} else {
				this.set(result);
			}
			await tick();
			DebugLogger.debug("SD Options Loaded", get(this));
		},
		async saveDefault() {
			await dbSet({ db: "CRL", collection: "EngineSd", data: get(this) });
		}
	};
}
export const EngineSd = createEngineSdStore();
//CHARACTER SD SETTINGS - ALSO DUNGEON SPECIFIC IF USING DUNGEON SETTING
function createEngineSdCharacterStore() {
	const { subscribe, set, update } = writable(defaultCharacterSettings);

	return {
		subscribe,
		set,
		update,
		reset: () => {
			set(structuredClone(defaultCharacterSettings));
		},
		async get(id: string) {
			const mode = get(Gamemode);
			if (!id) return;
			const result = await dbGet({ db: `${mode}/${id}/sdCharacter` });
			if (!result || Object.keys(result).length === 0) {
				this.reset();
			} else {
				this.set(result);
			}
			await tick();
			DebugLogger.debug("SD Character Options Loaded", get(this));
		},
		async save(id: string) {
			const mode = get(Gamemode);
			if (!id) {
				console.error("No ID saving SD Character settings");
				return;
			}
			const currSdSettings = get(this);
			await dbSet({ db: `${mode}/${id}/sdCharacter`, data: currSdSettings });
		}
	};
}
export const EngineSdCharacter = createEngineSdCharacterStore();
/*
ComfyUi workflow tags
{{positivePrompt}} - Positive Prompt
{{ponyAdd}} - Pony Addition
{{faceCaption}} - Face Caption
{{bodyCaption}} - Body Caption
{{referenceImage}} - Reference Image (face image)
{{model}} - SD Model
{{sampler}} - Sampler
{{scheduler}} - Scheduler
{{hrUpscaler}} - HR Upscaler
{{width}}
{{height}}
{{clipskip}}
{{steps}}
{{scale}}
{{seed}}
*/
export function comfyReplaceTags(
	workflowData: string,
	dSd: any,
	dSDc: any,
	game: any,
	msgPrompt: string,
	referenceImage = PNG_PIXEL,
	opts?: { generationMode: number }
) {
	//replace {{ tags }} with values
	let replaced = JSON.stringify(workflowData);
	if (!msgPrompt)
		msgPrompt =
			"1man,red hair,pale skin,freckles,soulless eyes,creepy,angry expression,blood on face,black hoodie,black gloves,black pants,black boots,holding knife";
	let positivePrompt = "";
	let negativePrompt = "";
	let faceCaption = "";
	let bodyCaption = "";
	let ponyAdd = "";
	//build the prompt
	if (opts?.generationMode === generationMode.BACKGROUND) {
		//build without character specifics
		positivePrompt = msgPrompt;
		negativePrompt = `${dSd.negativePrompt ?? ""} (person),(human),(person),(male),(character),(female),(girl),(woman),(boy),((nsfw)),source_explicit,source_pony,grainy, surreal, low quality, multiple views, uncreative, monochrome, macro, lowres, distorted details, underexposed, simple background, homogenous, blurry, overexposed, close-up, dark, unattractive, low contrast, grains, multiple angles, plain background, details are low, standard, foggy, gloomy, oversaturated, opaque, grayscale, portrait, plain.`;
	} else {
		ponyAdd = dSDc?.ponyAdd ?? "";
		positivePrompt = `${dSd.positivePrompt ?? ""} ${dSDc.positivePrompt ?? ""} ${msgPrompt} ${JSON.stringify(msgPrompt).slice(1, -1)}`;
		negativePrompt = `${dSd.negativePrompt ?? ""} ${dSDc.negativePrompt ?? ""}`;
		faceCaption = game?.faceCaption ? `(${game?.gender}: ${game.faceCaption})` : "";
		bodyCaption = game?.bodyCaption ?? "";
	}
	const seed =
		dSDc.seed.toString() === "0" || dSDc.seed.toString() === "-1" || !dSDc.seed
			? Math.floor(Math.random() * 4294967295) + 1
			: dSDc.seed;
	console.log("seed", seed);
	//console log referenceImage
	//console.log("reference image",referenceImage);
	const replacements: { [token: string]: string } = {
		"%prompt%": fixPromptSpacing(positivePrompt),
		"%negative_prompt%": fixPromptSpacing(negativePrompt),
		"%pony_add%": ponyAdd,
		"%face_caption%": faceCaption,
		"%body_caption%": bodyCaption,
		"%char_avatar%": referenceImage ?? PNG_PIXEL,
		"%model%": dSDc.model,
		"%sampler%": dSDc.sampler,
		"%scheduler%": dSDc.scheduler,
		"%hr_upscaler%": dSd.hrUpscaler,
		"%hr_scale%": dSd.hrScale.toString() ?? "1.3",
		"%hr_denoising_strength%": dSd.hrDenoisingStrength.toString(),
		"%hr_second_pass_steps%": dSd.hrSecondPassSteps.toString() ?? "2",
		"%width%": dSd.width.toString() ?? "512",
		"%height%": dSd.height.toString() ?? "512",
		"%clip_skip%": dSDc.clipskip === 0 ? "0" : (-dSDc.clipskip).toString(),
		"%steps%": dSDc.steps.toString() || "20",
		"%scale%": dSDc.scale.toString() || "7.0",
		"%seed%": seed.toString()
	};

	for (const token in replacements) {
		// Escape any special characters in the replacement string that might break JSON parsing
		const safeReplacement = replacements[token].replace(
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Because biome is just being a dick.
			/[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			(match) => {
				return `\\u${(`0000${match.charCodeAt(0).toString(16)}`).slice(-4)}`;
			}
		);
		replaced = replaced.replaceAll(token, safeReplacement);
	}
	return JSON.parse(replaced);
}
