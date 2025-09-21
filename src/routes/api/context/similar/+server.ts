import type { RequestHandler } from "@sveltejs/kit";
import { ContextManager } from "$lib/controllers/memory/context-manager.ssr";
import { resp } from "$lib/utilities/apiHelper";

export const POST: RequestHandler = async ({ request }) => {
	const { worldId, charId, query, dbPath, options } = await request.json();
	const manager = new ContextManager(worldId, dbPath);
	// Get relevant context
	const contexts = await manager.findSimilarContexts(query || `roleplay as ${charId}`, {
		limit: options?.contextLimit || 20,
		threshold: options?.threshold || 0.3,
		charId: charId,
		includeConnections: true
	});
	return resp(contexts, 200);
};
