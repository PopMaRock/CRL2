import { _api } from "$lib/utilities/_api";
import { DebugLogger } from "$lib/utilities/error-manager";

export type ContextKind = "chat" | "world_lore" | "world_event" | "character_note";

export interface GameContext {
	id: number;
	worldId: string;
	chatId?: string;
	charId?: string;
	type: ContextKind;
	content: string;
	summary?: string;
	tags?: string[];
	emotionalState?: Record<string, any>;
	metadata?: Record<string, any>;
	similarity?: number;
	created_at?: number;
	updated_at?: number;
}

export interface CompiledContext {
	chat_history: GameContext[];
	world_lore: GameContext[];
	recent_events: GameContext[];
	character_notes: GameContext[];
	episodic_summary: string;
	total_contexts: number;
}

/**
 * Simplified EngineContext - Integrates with SimplifiedContextManager
 * Reduces complexity and LLM calls while maintaining A-MEM principles
 */
export class EngineContext {
	readonly worldId: string;

	constructor(worldId: string = `world_${Date.now()}_${Math.random().toString(36).slice(2)}`) {
		this.worldId = worldId;
	}

	/**
	 * Store a chat message with emotional state
	 */
	async storeChatMessage(
		chatId: string,
		content: string,
		role: "user" | "assistant" | "system",
		speaker?: string,
		emotionalState?: Record<string, any>
	): Promise<void> {
		await this._api("/api/context", "POST", {
			type: "chat_message",
			worldId: this.worldId,
			chatId,
			content,
			role,
			speaker,
			emotionalState,
			timestamp: Date.now()
		});
	}

	/**
	 * Store character data in JSON database
	 */
	async storeCharacterData(
		charId: string,
		data: {
			name: string;
			personality?: string;
			appearance?: string;
			background?: string;
			traits?: string[];
			goals?: string[];
			relationships?: Record<string, string>;
		}
	): Promise<void> {
		await this._api("/api/context", "POST", {
			type: "character_data",
			worldId: this.worldId,
			charId,
			characterData: data
		});
	}

	/**
	 * Add world lore with minimal processing
	 */
	async addWorldLore(content: string, category?: string, metadata?: Record<string, any>): Promise<number> {
		const response = await this._api<{ id: number }>("/api/context", "POST", {
			worldId: this.worldId,
			contextType: "world_lore",
			content,
			metadata: { category, ...metadata }
		});
		return response.id;
	}

	/**
	 * Record world event
	 */
	async recordEvent(
		content: string,
		participants: string[] = [],
		eventType?: string,
		metadata?: Record<string, any>
	): Promise<number> {
		const response = await this._api<{ id: number }>("/api/context", "POST", {
			worldId: this.worldId,
			contextType: "world_event",
			content,
			metadata: {
				event_type: eventType,
				participants,
				timestamp: Date.now(),
				...metadata
			}
		});
		return response.id;
	}

	/**
	 * Add character note/observation
	 */
	async addCharacterNote(charId: string, content: string, metadata?: Record<string, any>): Promise<number> {
		const response = await this._api<{ id: number }>("/api/context", "POST", {
			worldId: this.worldId,
			charId,
			contextType: "character_note",
			content,
			metadata
		});
		return response.id;
	}

	/**
	 * Find contexts using semantic search
	 */
	async findSimilarContexts(
		query: string,
		options: {
			limit?: number;
			threshold?: number;
			types?: ContextKind[];
			charId?: string;
		} = {}
	): Promise<GameContext[]> {
		const params = new URLSearchParams({
			worldId: this.worldId,
			query,
			limit: String(options.limit || 20),
			threshold: String(options.threshold || 0.3)
		});

		if (options.types?.length) {
			params.set("types", options.types.join(","));
		}

		if (options.charId) {
			params.set("charId", options.charId);
		}

		const response = await this._api<{ contexts: GameContext[] }>(`/api/context?${params}`, "GET");
		return response.contexts;
	}

	/**
	 * Get contexts by chatId
	 */
	async getContextByChatId(chatId: string): Promise<GameContext[]> {
		const params = new URLSearchParams({
			worldId: this.worldId,
			chatId
		});

		const response = await this._api<{ contexts: GameContext[] }>(`/api/context?${params}`, "GET");
		return response.contexts;
	}

	/**
	 * Get contexts by charId
	 */
	async getContextByCharId(charId: string, limit: number = 20): Promise<GameContext[]> {
		const params = new URLSearchParams({
			worldId: this.worldId,
			charId,
			limit: String(limit)
		});

		const response = await this._api<{ contexts: GameContext[] }>(`/api/context?${params}`, "GET");
		return response.contexts;
	}

	/**
	 * Get chat history from JSON database
	 */
	async getChatHistory(chatId: string): Promise<any[]> {
		const params = new URLSearchParams({
			worldId: this.worldId,
			chatId
		});

		const response = await this._api<{ history: any[] }>(`/api/context/chat-history?${params}`, "GET");
		return response.history;
	}

	/**
	 * Get character data from JSON database
	 */
	async getCharacterData(charId: string): Promise<any> {
		const params = new URLSearchParams({
			worldId: this.worldId,
			charId
		});

		try {
			const response = await this._api<{ characterData: any }>(`/api/context/character?${params}`, "GET");
			return response.characterData;
		} catch (error) {
			DebugLogger.error("Error fetching character data:", error);
			return null;
		}
	}

	/**
	 * Compile comprehensive context for system prompt generation
	 */
	async compileContext(
		query: string,
		options: {
			charId?: string;
			limit?: number;
			includeHistory?: boolean;
		} = {}
	): Promise<CompiledContext> {
		//FIXME: redundant includeHistory - check and fix.
		const { charId, limit = 30, includeHistory = true } = options;

		// Get relevant contexts using semantic search
		const contexts = await this.findSimilarContexts(query, {
			limit,
			charId,
			threshold: 0.2 // Lower threshold for broader context
		});

		// Organize contexts by type
		const compiled: CompiledContext = {
			chat_history: contexts.filter((c) => c.type === "chat"),
			world_lore: contexts.filter((c) => c.type === "world_lore"),
			recent_events: contexts.filter((c) => c.type === "world_event"),
			character_notes: contexts.filter((c) => c.type === "character_note"),
			episodic_summary: "",
			total_contexts: contexts.length
		};

		// Generate episodic summary
		compiled.episodic_summary = this.generateEpisodicSummary(compiled);

		return compiled;
	}

	/**
	 * Generate system prompt for character roleplay
	 */
	async generateSystemPrompt(
		charId: string,
		query?: string,
		options: {
			contextLimit?: number;
			threshold?: number;
			customInstructions?: string;
		} = {}
	): Promise<string> {
		const response = await this._api<{ systemPrompt: string }>("/api/context/system-prompt", "POST", {
			worldId: this.worldId,
			charId,
			query: query || `roleplay as ${charId}`,
			options
		});

		return response.systemPrompt;
	}

	/**
	 * Clean up resources
	 */
	async cleanup(): Promise<void> {
		const params = new URLSearchParams({
			worldId: this.worldId
		});

		await this._api(`/api/context/cleanup`, "DELETE", { params });
	}

	// Private helper methods

	private generateEpisodicSummary(context: CompiledContext): string {
		const parts: string[] = [];

		if (context.chat_history.length > 0) {
			const recentChat = context.chat_history.slice(-3);
			const chatSummary = recentChat
				.map((c) => {
					const speaker = c.metadata?.speaker || "Unknown";
					const content = c.summary || c.content.slice(0, 50);
					return `${speaker}: ${content}`;
				})
				.join(" → ");
			parts.push(`Recent conversation: ${chatSummary}`);
		}

		if (context.recent_events.length > 0) {
			const latestEvent = context.recent_events[0];
			const eventSummary = latestEvent.summary || latestEvent.content.slice(0, 80);
			parts.push(`Latest event: ${eventSummary}`);
		}

		if (context.world_lore.length > 0) {
			parts.push(`Available world knowledge: ${context.world_lore.length} entries`);
		}

		if (context.character_notes.length > 0) {
			parts.push(`Character insights: ${context.character_notes.length} notes`);
		}

		return parts.join(" | ") || "No significant context available";
	}

	private async _api<T>(url: string, method: "GET" | "POST" | "DELETE" = "GET", body?: any): Promise<T> {
		return await _api(url, method, body);
	}
}

/**
 * Create a new EngineContext instance
 */
export function createEngineContext(worldId?: string): EngineContext {
	return new EngineContext(worldId);
}
