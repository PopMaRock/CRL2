import { LMStudioClient } from "@lmstudio/sdk";
import type { RequestHandler } from "@sveltejs/kit";
import { resp } from "$lib/utilities/apiHelper";

export const POST: RequestHandler = async ({ request }) => {
	try {
		let { messages, settings } = await request.json();
		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return resp({ error: "Messages array is required and cannot be empty" }, 400);
		}

		const client = new LMStudioClient();
		const model = await client.llm.model();
		if (!model) return resp({ error: "No model available" }, 500);
		//find messages[].role = "system" and append /no_think to the end of the content
		const hasSystemMessage = messages.some((msg: any) => msg.role === "system");
		if (hasSystemMessage) {
			messages = messages.map((msg: any) => {
				if (msg.role === "system") {
					return { ...msg, content: `${msg.content}/no_think` };
				}
				return msg;
			});
		}
		const result = await model.respond(messages as any, {
			...settings,
			stream: false, // Disable streaming for summarization
			maxNewTokens: 256,
			minPSampling: 0.1,
			topPSampling: 0.9,
			temperature: 0.7,
			topKSampling: 50,
			stopStrings: ["\n\n"],
			repeatPenalty: 1.3,
			contextOverflowPolicy: "truncateMiddle"
		});
		if (!result || !result.content) {
			return resp({ error: "No content generated" }, 500);
		}

		return resp({ summary: result?.content }, 200);
	} catch (error) {
		console.error("/api/transformers/summarise", error);
		return resp({ error: "Failed to process request" }, 500);
	}
};
