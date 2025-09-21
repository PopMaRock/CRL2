interface ApiLlmSettings {
    baseUrl?: string;
    model?: string;
	temperature?: number;
	maxNewTokens?: number;
	maxTokens?: number | null;
	minP?: number;
	typicalP?: number;
	topP?: number;
	topK?: number;
	penaltyFrequency?: number;
	penaltyPresence?: number;
	stop?: string[];
	reasoning?: boolean;
	streaming?: boolean;
	userNameAsStop?: boolean;
}