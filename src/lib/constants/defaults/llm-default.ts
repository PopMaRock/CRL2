export const llmDefault: EngineSettings = {
		llmActive: "lmstudio",
		llmTextSettings: {
			model: "deepseek-chat",
			unloadModelBeforeSd: false,
			reasoning: false,
			temperature: 0.7,
			limitContext: 4096,
			CFG: 1,
			topK: 100,
			p: {
				typical: 0.7,
				min: 0.1,
				top: 0.8
			},
			// Context and memory settings
			memoryBank: true, // using vectera local
			historyTruncate: "middle",
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
		}
	};