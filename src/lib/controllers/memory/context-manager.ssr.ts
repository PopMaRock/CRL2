import fs from "fs";
import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import { llmEmbeddings, llmSummarise } from "$lib/controllers/llm";
export interface ContextEntry {
	id?: number;
	worldId: string;
	chatId?: string;
	charId?: string;
	type: "chat" | "world_event" | "world_lore" | "character_note";
	summary?: string;
	tags?: string[];
	embedding?: number[];
	emotionalState?: Record<string, any>;
	metadata?: Record<string, any>;
	created_at?: number;
	updated_at?: number;
}
export interface ContextSearchResult extends ContextEntry {
	similarity: number;
	connections?: ContextConnection[];
}
export interface ContextConnection {
	id?: number;
	source_id: number;
	target_id: number;
	similarity_score: number;
	connection_type: "semantic" | "temporal" | "character";
}

export interface SearchOptions {
	limit?: number;
	threshold?: number;
	types?: string[];
	charId?: string;
	includeConnections?: boolean;
}

/**
 * ContextManager - A lean A-MEM inspired context management system
 * Optimizes for performance by minimizing LLM calls and using vector similarity
 */
export class ContextManager {
	private db: Database.Database;
	private embeddingCache = new Map<string, number[]>();
	private summaryCache = new Map<string, string>();
	public newMessage: string = "";

	constructor(
		private worldId: string,
		dbPath: string = "context.db"
	) {
		this.db = new Database(dbPath);
		this.db.loadExtension(sqliteVec.getLoadablePath());
		this.initializeDatabase();
	}

	private async initializeDatabase() {
		// Load and execute schema
		const schemaSql = fs.readFileSync("./context-schema.sql", "utf8").toString();
		this.db.exec(schemaSql);

		// Enable sqlite-vec extension
		this.db.exec("CREATE VIRTUAL TABLE IF NOT EXISTS vec_context USING vec0(embedding float[384])");
	}

	/**
	 * Add a context entry with minimal LLM processing
	 */
	async addContext(entry: ContextEntry): Promise<number> {
		const timestamp = Date.now();
		entry.created_at = timestamp;
		entry.updated_at = timestamp;
		entry.worldId = this.worldId;

		// Generate embedding (cached)
		const cacheKey = `${entry.type}:${this.newMessage}`;
		if (!this.embeddingCache.has(cacheKey)) {
			const embedding = await llmEmbeddings(this.newMessage);
			this.embeddingCache.set(cacheKey, embedding);
			entry.embedding = embedding;
		} else {
			entry.embedding = this.embeddingCache.get(cacheKey);
		}

		// Generate summary only for longer content (>200 chars) and cache it
		if (this.newMessage.length > 200 && !entry.summary) {
			if (!this.summaryCache.has(cacheKey)) {
				try {
					const summary = await llmSummarise(this.newMessage);
					this.summaryCache.set(cacheKey, summary);
					entry.summary = summary;
				} catch (error) {
					console.warn("Summary generation failed:", error);
					entry.summary = this.newMessage.slice(0, 150) + "...";
				}
			} else {
				entry.summary = this.summaryCache.get(cacheKey);
			}
		}

		// Generate simple tags (batched with other operations to reduce LLM calls)
		if (!entry.tags) {
			entry.tags = this.generateSimpleTags(entry.type);
		}

		// Insert into database
		const insertStmt = this.db.prepare(`
            INSERT INTO context_entries
            (worldId, chatId, charId, type, summary, tags, embedding, emotionalState, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

		const result = insertStmt.run(
			entry.worldId,
			entry.chatId || null,
			entry.charId || null,
			entry.type,
			entry.summary || null,
			JSON.stringify(entry.tags || []),
			JSON.stringify(entry.embedding),
			JSON.stringify(entry.emotionalState || {}),
			JSON.stringify(entry.metadata || {}),
			entry.created_at,
			entry.updated_at
		);

		const contextId = result.lastInsertRowid as number;

		// Find connections using vector similarity (much faster than LLM analysis)
		if (entry.embedding) {
			await this.findAndCreateConnections(contextId, entry.embedding);
		}

		return contextId;
	}

	/**
	 * Find similar contexts using vector search
	 */
	async findSimilarContexts(query: string | number[], options: SearchOptions = {}): Promise<ContextSearchResult[]> {
		const { limit = 10, threshold = 0.3, types = [], charId, includeConnections = false } = options;

		let queryEmbedding: number[];
		if (typeof query === "string") {
			queryEmbedding = await llmEmbeddings(query);
		} else {
			queryEmbedding = query;
		}

		// Build query with filters
		let sql = `
            SELECT c.*,
                   (SELECT json_group_array(json_object(
                       'target_id', cc.target_id,
                       'similarity_score', cc.similarity_score,
                       'connection_type', cc.connection_type
                   )) FROM context_connections cc WHERE cc.source_id = c.id) as connections
            FROM context_entries c
            WHERE c.worldId = ?
        `;
		const params: any[] = [this.worldId];

		if (types.length > 0) {
			sql += ` AND c.type IN (${types.map(() => "?").join(",")})`;
			params.push(...types);
		}

		if (charId) {
			sql += ` AND c.charId = ?`;
			params.push(charId);
		}

		sql += ` ORDER BY c.created_at DESC LIMIT ?`;
		params.push(limit * 3); // Get more to filter by similarity

		const results = this.db.prepare(sql).all(...params) as any[];

		const contextsWithSimilarity = results
			.map((row: any) => ({
				...row,
				tags: JSON.parse(row.tags || "[]"),
				embedding: JSON.parse(row.embedding || "[]"),
				emotionalState: JSON.parse(row.emotionalState || "{}"),
				metadata: JSON.parse(row.metadata || "{}"),
				connections: includeConnections ? JSON.parse(row.connections || "[]") : undefined,
				similarity: this.calculateCosineSimilarity(queryEmbedding, JSON.parse(row.embedding || "[]"))
			}))
			.filter((ctx: any) => ctx.similarity >= threshold)
			.sort((a: any, b: any) => b.similarity - a.similarity)
			.slice(0, limit);

		return contextsWithSimilarity as ContextSearchResult[];
	}

	/**
	 * Get context by different identifiers
	 */
	async getContextByChatId(chatId: string): Promise<ContextEntry[]> {
		const sql = `
            SELECT * FROM context_entries
            WHERE worldId = ? AND chatId = ?
            ORDER BY created_at ASC
        `;
		return this.executeAndParseResults(sql, [this.worldId, chatId]);
	}

	async getContextByCharId(charId: string, limit: number = 20): Promise<ContextEntry[]> {
		const sql = `
            SELECT * FROM context_entries
            WHERE worldId = ? AND charId = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;
		return this.executeAndParseResults(sql, [this.worldId, charId, limit]);
	}

	async getContextByWorldId(limit: number = 50): Promise<ContextEntry[]> {
		const sql = `
            SELECT * FROM context_entries
            WHERE worldId = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;
		return this.executeAndParseResults(sql, [this.worldId, limit]);
	}

	// Private helper methods

	private async findAndCreateConnections(contextId: number, embedding: number[]) {
		// Explicitly type the result as ContextSearchResult[]
		const similarContexts: ContextSearchResult[] = await this.findSimilarContexts(embedding, {
			limit: 5,
			threshold: 0.4
		});

		const insertConnection = this.db.prepare(`
        INSERT OR REPLACE INTO context_connections
        (source_id, target_id, similarity_score, connection_type)
        VALUES (?, ?, ?, ?)
    `);

		for (const similar of similarContexts) {
			if (similar.id && similar.id !== contextId) {
				const connectionType = this.determineConnectionType(similar.similarity, similar.type, similar.charId);
				insertConnection.run(contextId, similar.id, similar.similarity, connectionType);
			}
		}
	}

	private generateSimpleTags(type: string): string[] {
		//FIXME: Use the fuckin LLM to generate tabs. for fuck sake.
		// Simple keyword-based tagging to avoid LLM calls
		const words = this.newMessage
			.toLowerCase()
			.replace(/[^\w\s]/g, " ")
			.split(/\s+/)
			.filter((word) => word.length > 3);

		const wordCounts = words.reduce(
			(acc, word) => {
				acc[word] = (acc[word] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const keywordTags = Object.entries(wordCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 3)
			.map(([word]) => word);

		// Add type-based tags
		const typeTags: Record<string, string[]> = {
			chat: ["conversation", "dialogue"],
			world_event: ["event", "world"],
			world_lore: ["lore", "knowledge"],
			character_note: ["character", "personality"]
		};

		return [...keywordTags, ...(typeTags[type] || [])].slice(0, 5);
	}

	private determineConnectionType(
		similarity: number,
		targetType: string,
		targetCharId?: string
	): "semantic" | "temporal" | "character" {
		if (targetCharId) return "character";
		if (similarity > 0.7) return "semantic";

		// Use targetType for more nuanced connections
		if (targetType === "world_event" || targetType === "world_lore") {
			return "temporal";
		}

		return "semantic";
	}

	private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
		if (vecA.length !== vecB.length || vecA.length === 0) return 0;

		let dotProduct = 0;
		let normA = 0;
		let normB = 0;

		for (let i = 0; i < vecA.length; i++) {
			dotProduct += vecA[i] * vecB[i];
			normA += vecA[i] ** 2;
			normB += vecB[i] ** 2;
		}

		return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
	}

	private executeAndParseResults(sql: string, params: any[]): ContextEntry[] {
		const results = this.db.prepare(sql).all(...params) as any[];
		return results.map((row: any) => ({
			...row,
			tags: JSON.parse(row.tags || "[]"),
			embedding: JSON.parse(row.embedding || "[]"),
			emotionalState: JSON.parse(row.emotionalState || "{}"),
			metadata: JSON.parse(row.metadata || "{}")
		}));
	}

	/**
	 * Clean up resources
	 */
	close() {
		if (this.db) {
			this.db.close();
		}
	}
}
