import fs from "fs/promises";
import path from "path";
import type { RequestHandler } from "@sveltejs/kit";
import { DebugLogger } from "$lib/utilities/error-manager";
import { resp } from "../../../../lib/utilities/apiHelper";

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	const mode = params.mode as string;
	const id = params.id as string;

	const umanId = cookies.get("umanId");

	// Validate umanId: only alphanumeric and hyphens
	if (!umanId || !/^[a-zA-Z0-9-]+$/.test(umanId)) {
		return resp({ error: "Invalid or missing umanId" }, 400);
	}

	// Validate mode and id: must be set, not empty, and not contain slashes
	if (!mode || !id || mode.trim() === "" || id.trim() === "" || mode.includes("/") || id.includes("/")) {
		return resp({ error: "Invalid or missing mode or id" }, 400);
	}

	const folderPath = path.resolve(`/data/users/${umanId}/${mode}/${id}`);

	try {
		DebugLogger.info(`Attempting to delete folder: ${folderPath}`);
		await fs.rm(folderPath, { recursive: true, force: true });
		return resp({ success: true }, 200);
	} catch (error) {
		return resp({ error: "Failed to delete folder", details: String(error) }, 500);
	}
};
