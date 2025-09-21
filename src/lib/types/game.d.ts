//god, this is a fuckin mess...

// biome-ignore lint/correctness/noUnusedVariables: ah gtfo mofo.
type Gamemodes = "dungeons" | "characters";

interface Settings {
	llmActive: "deepseek" | "lmstudio";
	llmTextSettings: LlmTextSettings;
	llmResponseSettings: any;
	sd?: Sd;
	vo?: Vo;
	accessability?: Accessibility;
	behaviour?: Behaviour;
}

// biome-ignore lint/correctness/noUnusedVariables: no
interface DungeonGameSettings extends Settings {
	game: Game;
	characters: Character[];
}
// biome-ignore lint/correctness/noUnusedVariables: no
interface CharacterSettings extends Settings {
	charId: string;
}

// biome-ignore lint/correctness/noUnusedVariables: no
interface EngineSettings {
	llmActive: string;
	llmTextSettings: LlmTextSettings;
	llmResponseSettings: LlmResponseSettings;
}
interface Sd {
	sdActive: string;
	sdDefaultPositive: string;
	sdDefaultNegative: string;
}
interface Vo {
	voActive: string;
	voDefaultPositive: string;
	voDefaultNegative: string;
	model: string;
}
interface Accessibility {
	fadein: boolean;
	text: "normal" | "print" | "clean" | "hacker";
}

interface Behaviour {
	autoSave: boolean;
	autoSaveInterval: number;
}

// biome-ignore lint/correctness/noUnusedVariables: no
interface Conversation {
	hash: number;
	role: string;
	content: string;
	meta: Meta;
	type: string; // 'text', 'image', 'video', 'audio' - for standalone messages
	additionalMedia?: ConversationAdditionalMedia;
	transacting: boolean;
}
interface ConversationAdditionalMedia {
	url?: string;
	prompt?: string;
	caption?: string;
	type?: string; // 'image', 'video', 'audio'
	transacting: boolean;
}

// biome-ignore lint/correctness/noUnusedVariables: bad
interface Audio {
	url: string;
	duration: number;
	type: string; // 'voiceOver', 'backgroundMusic', 'soundEffect'
	generator: string; // 'elevenlabs', 'localXtts', 'localTts'
}
interface Game {
	id: string;
	hash: string | null;
	name: string;
	description: string;
	createdBy: string;
	genre: string;
	image: string;
	opening: string;
	plotEssentials: string;
	authorsNotes: string;
	storySummary: string;
	sd: boolean;
	vo: boolean;
}
interface Character {
	charId: string;
	hash: string | null;
	name: string;
	description: string;
	age: number;
	gender: string;
	species: string;
	strengths: string[];
	flaws: string[];
	faceCaption: string;
	bodyCaption: string;
	background: string;
	scenario: string;
	goals: string[];
	emotionalState: string;
	relationships: Record<string, string>[];
	images: {
		avatar: string;
		backgroundAvatar: string;
		transparentAvatar: string;
		face: string;
	};
	firstMsg: string;
	exampleMsg: string;
	sd: boolean;
	vo: boolean;
}
// biome-ignore lint/correctness/noUnusedVariables: naughty
interface EnginePersona {
	persona: string;
	personaDesc: string;
	personaImage: string;
}

interface Meta {
	created?: number;
	lastPlay?: number;
	timestamp?: number;
	hasAudio?: boolean;
}
interface Summary {
	summary: string;
	positionSummarised: number;
	timestamp: number; // Use number for timestamp as Date.now() returns a number
}
//LLM Interface
interface LlmTextSettings {
	hash: string | null;
	charId: string;
	prompt?: string;
	model?: string;
	unloadModelBeforeSd: boolean;
	reasoning?: boolean;
	limitContext: number;
	memoryBank: boolean;
	historyTruncate: "start" | "middle";
	temperature: number;
	topK: number;
	CFG: number;
	p: {
		typical: number;
		min: number;
		top: number;
	};
	penalty: {
		presence: number;
		frequency: number;
		repPen: number;
	};
	seed: number;
}
interface LlmResponseSettings {
	maxTokens: number | null;
	wordCount: number | null;
	sequenceBreakers: string | null;
	customStopStrings: string | null;
	showThinking: boolean;
	stream: boolean;
	cleanUpText: boolean;
	userNameAsStop: boolean;
}

//###################################################
//
// biome-ignore lint/correctness/noUnusedVariables: shh no.
interface CrlGenerateParams {
	weAre: "engine" | "game";
	prompt: string;
	maxTokens?: number;
	temperature?: number;
	topP?: number;
	topK?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	streaming?: boolean;
	stop?: string[];
}
//####################################################
interface DungeonGameState {
	lootBox: any[];
	placeAndTime: Record<string, any>;
	shop: any[];
	choices: any[];
	enemy: Record<string, any>;
	gameEvent: GameEvent;
	meta: Meta;
}
//FIXME: Remove below. not used
interface EngineManagerType {
	state: Record<string, any>;
	summaries: Summary[];
	player: Record<string, any>;
	characters: Record<string, any>[];
	currentCharacter: Record<string, any>;
	currentLocation: Record<string, any>;
}
interface DungeonPlayer {
	name: string;
	gender: string;
	visual: string;
	background: string;
	class: string;
	level: number;
	xp: number;
	nextLevel: number;
	stats: Stats[];
	gold: number;
	spells: any[];
	inventory: any[];
}
interface GameEvent {
	inCombat: boolean;
	shopMode: boolean | null;
	lootMode: boolean;
}
interface Stats {
	hp: number;
	maxHp: number;
	mp: number;
	maxMp: number;
}
