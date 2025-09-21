import { dungeonPrompt } from "../prompts/prompts";

export const DungeonGameSettingsDefault: DungeonGameSettings = {
	llmActive: "lmstudio",
	llmTextSettings: {
		// Core settings
		prompt: dungeonPrompt,
		model: "gpt-4o-mini",
		unloadModelBeforeSd: false,
		reasoning: false,
		temperature: 0.8,
		limitContext: 4096,
		CFG: 1,
		topK: 40,
		p: {
			typical: 0.7,
			min: 0.1,
			top: 0.8
		},
		memoryBank: true, // using vectera local
		historyTruncate: "middle",
		//*** BELOW SETTINGS ARE UTTER NON-SENSE ***
		// Only here because sillytavern made me think someone, somewhere gives a fuck about them */
		// Fine-tuning parameters
		seed: -1, //internal
		penalty: {
			presence: 0.5,
			frequency: 1.5,
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
	game: {
		id: "",
		name: "",
		description: "",
		createdBy: "CRL",
		genre: "",
		image: "",
		opening: "",
		plotEssentials: "",
		authorsNotes: "",
		storySummary: "",
		sd: false,
		vo: false,
		hash: null
	},
	characters: [],
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
