import type { PipelineType } from "@huggingface/transformers";
import module from "$lib/transformers/ssr/transformers";
import { DebugLogger } from "$lib/utilities/error-manager";
import { resp } from "$lib/utilities/apiHelper";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	DebugLogger.debug("POST /api/transformers/embeddings");
	try {
		const { text } = await request.json();
		console.log("Request body:", text);
		if (!text) {
			return resp({ error: "Text is required" }, 400);
		}
		const vector = await getTransformersVector(text);
		if (vector.length === 0) {
			return resp({ error: "Failed to vectorize text" }, 500);
		}
		//Else we got some mother-fuckin vectors.
		DebugLogger.debug("Got some mother-fuckin vectors");
		return resp({ vector }, 200);
	} catch (error) {
		DebugLogger.error(error);
		return resp({ error: "Failed to process request" }, 500);
	}
};
async function getTransformersVector(text: string, task: PipelineType = "feature-extraction"): Promise<number[]> {
	const pipe = await module.getPipeline(task);
	const result = await pipe(text, { pooling: "mean", normalize: true });
	return Array.from(result.data);
}
