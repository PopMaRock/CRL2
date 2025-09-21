import { LMStudioClient } from "@lmstudio/sdk";
import { resp } from "../../../../../../lib/utilities/apiHelper";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
	try {
		const client = new LMStudioClient();
		const result = await client.system.listDownloadedModels("llm");
		if (!result || (Array.isArray(result) && result.length === 0)) {
			throw { message: "No models found", status: 404 };
		}
		return resp({ models: result }, 200);
	} catch (error: any) {
		const message = error?.message || error?.toString?.() || "Unknown error";
		const status = error?.status || 500;
		return resp({ error: message }, status);
	}
};
