import { chmodSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import { ContextManager } from "$lib/controllers/memory/context-manager.ssr";

// Global instance management
const contextManagers = new Map<string, ContextManager>();

function getContextManager(worldId: string, dbPath: string): ContextManager {
	const key = `${worldId}:${dbPath}`;

	if (!contextManagers.has(key)) {
		const dbLocation = `data/users/default-user/${dbPath}`;

		// Ensure directory exists
		const dbDir = dirname(dbLocation);
		if (!existsSync(dbDir)) {
			mkdirSync(dbDir, { recursive: true });
			chmodSync(dbDir, 0o755);
		}

		contextManagers.set(
			key,
			new ContextManager(
				worldId,
				dbLocation
			)
		);
	}

	const manager = contextManagers.get(key);
	if (!manager) {
		throw new Error(`ContextManager not found for key: ${key}`);
	}
	return manager;
}

/**
 * POST /api/context - Create context entries or handle chat messages
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { data, dbPath = "context.db", message } = await request.json();

		if (!data) {
			throw new Error("Request body is required");
		}

		const { worldId } = data;
		if (!worldId) {
			throw new Error("worldId is required");
		}

		const manager = getContextManager(worldId, dbPath);

		/*if (data.type === "character_data") {
			// Store character data in JSON database
			await manager.storeCharacterData(data.charId, data.characterData);
			return json({ success: true, message: "Character data stored" });
		}*/

		// Handle regular context entry creation
		manager.newMessage = message;
		const contextId = await manager.addContext({
			worldId: data.worldId,
			chatId: data.chatId,
			charId: data.charId,
			type: data.contextType || data.type,
			emotionalState: data.emotionalState,
			metadata: data.metadata || {}
		});

		return json({ id: contextId, success: true });
	} catch (err: any) {
		console.error("Error in POST handler:", err);
		throw error(500, err.message);
	}
};

/**
 * GET /api/context - Retrieve context based on various criteria
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const dbPath = url.searchParams.get("dbPath") || "context.db";
		const worldId = url.searchParams.get("worldId");
		const chatId = url.searchParams.get("chatId");
		const charId = url.searchParams.get("charId");
		const query = url.searchParams.get("query") || "";
		const limit = Number.parseInt(url.searchParams.get("limit") || "20");
		const threshold = Number.parseFloat(url.searchParams.get("threshold") || "0.3");
		const types = url.searchParams.get("types")?.split(",") || [];
		const includeConnections = url.searchParams.get("includeConnections") === "true";

		if (!worldId) {
			throw error(400, "worldId is required");
		}

		const manager = getContextManager(worldId, dbPath);
		let contexts: any[] = [];

		if (chatId) {
			// Get context by chatId
			contexts = await manager.getContextByChatId(chatId);
		} else if (charId && !query) {
			// Get context by charId
			contexts = await manager.getContextByCharId(charId, limit);
		} else if (query) {
			// Semantic search
			contexts = await manager.findSimilarContexts(query, {
				limit,
				threshold,
				types,
				charId: charId ?? undefined,
				includeConnections
			});
		} else {
			// Get general world context
			contexts = await manager.getContextByWorldId(limit);
		}

		return json({
			contexts,
			count: contexts.length,
			worldId
		});
	} catch (err: any) {
		console.error("Error retrieving context:", err);
		throw error(500, err.message);
	}
};
/**
 * DELETE /api/context/cleanup - Clean up resources
 */
export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const worldId = url.searchParams.get("worldId");
		const dbPath = url.searchParams.get("dbPath") || "context.db";

		if (worldId) {
			const key = `${worldId}:${dbPath}`;
			const manager = contextManagers.get(key);
			if (manager) {
				manager.close();
				contextManagers.delete(key);
			}
		} else {
			// Clean up all managers
			for (const manager of Array.from(contextManagers.values())) {
				manager.close();
			}
			contextManagers.clear();
		}

		return json({ success: true, message: "Resources cleaned up" });
	} catch (err: any) {
		console.error("Error cleaning up resources:", err);
		throw error(500, err.message);
	}
};
