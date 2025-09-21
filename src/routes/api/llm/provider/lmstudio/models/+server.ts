import { LMStudioClient } from "@lmstudio/sdk";
import { resp } from "../../../../../../lib/utilities/apiHelper";
import type { RequestHandler } from "./$types";

//get information on all models
export const GET: RequestHandler = async () => {
	try {
		const client = new LMStudioClient();
		const result = await client.system.listDownloadedModels("llm");
		if (!result || (Array.isArray(result) && result.length === 0)) {
			throw { message: "No models found", status: 404 };
		}
		return resp(result, 200);
	} catch (error: any) {
		const message = error?.message || error?.toString?.() || "Unknown error";
		const status = error?.status || 500;
		return resp({ error: message }, status);
	}
};
export const DELETE: RequestHandler = async () => {
	try {
		const client = new LMStudioClient();
		const model = await client.llm.model();
		await model.unload();
		return resp({ message: "All models cleared successfully" }, 200);
	} catch (error: any) {
		const message = error?.message || error?.toString?.() || "Unknown error";
		const status = error?.status || 500;
		return resp({ error: message }, status);
	}
};
export const PUT: RequestHandler = async ({ url }) => {
	const modelName = url.searchParams.get("model");
	try {
		if (!modelName) {
			throw { message: "Model name is required", status: 400 };
		}
		const client = new LMStudioClient();
		const model = await client.llm.load(modelName);
		if (!model) {
			throw { message: "Model not found", status: 404 };
		}
		return resp({ message: "Model loaded successfully" }, 200);
	} catch (error: any) {
		const message = error?.message || error?.toString?.() || "Unknown error";
		const status = error?.status || 500;
		return resp({ error: message }, status);
	}
};
//geti nformation on current loaded model.
export const HEAD: RequestHandler = async ({ url }) => {
	const modelName = url.searchParams.get("model");
	try {
		if (!modelName) {
			throw { message: "Model name is required", status: 400 };
		}
		const client = new LMStudioClient();
		const model = await client.llm.model(modelName);
		if (!model) {
			throw { message: "Model not found", status: 404 };
		}
		return resp(model, 200);
	} catch (error: any) {
		const message = error?.message || error?.toString?.() || "Unknown error";
		const status = error?.status || 500;
		return resp({ error: message }, status);
	}
};
