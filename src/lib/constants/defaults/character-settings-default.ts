import { character121Prompt } from "../prompts/prompts";

export const CharacterLlmDefault: CharacterSettings = {
	charId: "",
	llmActive: "lmstudio",
	llmTextSettings: {
		// Core settings
		prompt: character121Prompt,
		model: "deepseek-chat",
		unloadModelBeforeSd: false,
		reasoning: false,
		temperature: 0.9,
		limitContext: 4096,
		CFG: 1,
		topK: 40,
		p: {
			typical: 0.7,
			min: 0.1,
			top: 0.8
		},
		// Context and memory settings
		memoryBank: true, // using vectera local
		historyTruncate: "middle",
		//*** BELOW SETTINGS ARE UTTER NON-SENSE ***
		// Only here because sillytavern made me think someone, somewhere gives a fuck about them */
		// Fine-tuning parameters
		seed: -1, //internal
		penalty: {
			presence: 0.9,
			frequency: 0.8,
			repPen: 1.18
		},
		hash: null,
		charId: ""
	},
	llmResponseSettings: {
		maxTokens: 150,
		wordCount: 100,
		sequenceBreakers: '["\\n", ":", "\\"", "*"]',
		customStopStrings: '["##", "\\n\\nYou say", "--"]',
		showThinking: false,
		stream: false,
		cleanUpText: false,
		userNameAsStop: true
	},
	sd: {
		sdActive: "comfyui",
		sdDefaultPositive: "(masterpiece), drawing",
		sdDefaultNegative: "(bad hands), realistic"
	},
	vo: {
		voActive: "elevenlabs",
		voDefaultPositive: "happy",
		voDefaultNegative: "sad",
		model: "Alice"
	},
	accessability: {
		fadein: true,
		text: "normal" //can be print, clean, hacker
	},
	behaviour: {
		autoSave: true,
		autoSaveInterval: 60000
	}
};

export const characterDefaults: Character = {
	charId: "",
	name: "",
	description: "",
	age: 21,
	gender: "",
	species: "",
	strengths: [],
	flaws: [],
	faceCaption: "",
	bodyCaption: "",
	scenario: "",
	background: "", //move to context
	goals: [],
	emotionalState: "",
	relationships: [],
	images: {
		avatar: "",
		backgroundAvatar: "",
		transparentAvatar: "",
		face: ""
	},
	firstMsg: "",
	exampleMsg: "",
	sd: false,
	vo: false,
	hash: null
};
