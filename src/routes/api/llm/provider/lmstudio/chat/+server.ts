// [src/routes/api/llm/provider/lmstudio/chat/+server.ts](src/routes/api/llm/provider/lmstudio/chat/+server.ts)

import { LMStudioClient } from "@lmstudio/sdk";
import { DebugLogger } from "$lib/utilities/error-manager";
import { addIfPresent } from "$lib/utilities/utils";
import { resp } from "../../../../../../lib/utilities/apiHelper";

export const POST = async ({ request }) => {
	let client = null;
	try {
		//the below will aggressively throw and error and kill the server.
		client = new LMStudioClient();
	} catch (e: any) {
		DebugLogger.error("LMStudio client initialization error:", e.message);
		return resp({ error: "LMStudio client initialization error: " + e.message }, 500);
	}
	const { messages, settings, user } = await request.json();
	const signal = (request as any).signal || new AbortController().signal;
	if (!messages || !Array.isArray(messages)) {
		DebugLogger.error("messages array is required and must be an array", messages);
		return resp({ error: "messages array is required and must be an array" }, 400);
	}
	// Build stop strings array
	let stops: string[] = [];
	if (settings?.stop) {
		stops.push("\n\n");
	}
	if (user && settings?.userNameAsStop) {
		stops.push(`\n${user}:`);
	}
	//if settings.reasoning == false then we'll add /no_think to the end of system message just for good measure
	if (!settings?.reasoning) {
		const systemMessage = messages.find((msg) => msg.role === "system");
		if (systemMessage) {
			systemMessage.content += " /no_think";
		} else {
			messages.unshift({
				role: "system",
				content: "/no_think"
			});
		}
	}

	const controller = new AbortController();
	const config: any = {
		messages: messages,
		stopStrings: stops,
		stream: settings?.streaming || false,
		contextOverflowPolicy: "truncateMiddle", //TODO: we set this in the UI so pull it
		...addIfPresent(settings.temperature, "temperature"),
		...addIfPresent(settings?.maxTokens, "maxTokens"),
		...addIfPresent(settings?.topP, "topPSampling"),
		...addIfPresent(settings?.typicalP, "topPSampling"),
		...addIfPresent(settings?.minP, "minPSampling"),
		...addIfPresent(settings?.penaltyFrequency, "repeatPenalty"),
		...addIfPresent(settings?.topK, "topKSampling")
		/*
		...addIfPresent(llmTextSettings?.beam?.numBeams, "num_beams"),
		...addIfPresent(llmTextSettings?.beam?.lengthPenalty, "length_penalty"),
		...addIfPresent(llmTextSettings?.beam?.earlyStopping, "early_stopping"),
		...addIfPresent(llmTextSettings?.smoothing?.smoothingFactor, "smoothing_factor"),
		...addIfPresent(llmTextSettings?.smoothing?.smoothingCurve, "smoothing_curve"),
		...addIfPresent(llmTextSettings?.DRY?.allowedLength, "dry_allowed_length"),
		...addIfPresent(llmTextSettings?.DRY?.multiplier, "dry_multiplier"),
		...addIfPresent(llmTextSettings?.DRY?.base, "dry_base"),
		...addIfPresent(llmTextSettings?.DRY?.penaltyLastN, "dry_penalty_last_n"),
		...addIfPresent(llmTextSettings?.skipSpecialTokens, "skip_special_tokens"),
		...addIfPresent(llmTextSettings?.topA, "top_a"),
		...addIfPresent(llmTextSettings?.epsilonCutoff, "epsilon_cutoff"),
		...addIfPresent(llmTextSettings?.etaCutoff, "eta_cutoff"),
		...addIfPresent(llmTextSettings?.microStat?.mode, "mirostat_mode"),
		...addIfPresent(llmTextSettings?.microStat?.tau, "mirostat_tau"),
		...addIfPresent(llmTextSettings?.microStat?.eta, "mirostat_eta"),*/
		//...addIfPresent(llmTextSettings?.CFG, "guidance_scale"),
		//...addIfPresent(llmTextSettings?.tfsZ, "tfs_z")
	};

	try {
		const model = await client.llm.model();

		// Streaming response.
		if (settings.streaming) {
			const chatCompletion = model.respond(messages as any, {
				...config,
				signal: controller.signal
			});
			setTimeout(() => controller.abort(), 90000); // cancel after 90 seconds
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					// Abort handling: if the sender aborts, abort the stream.
					signal.addEventListener("abort", () => {
						controller.error(new Error("Request aborted by the sender."));
					});
					try {
						for await (const chunk of chatCompletion as unknown as AsyncIterable<any>) {
							const text = chunk.content || "";
							controller.enqueue(encoder.encode(text));
						}
						controller.close();
					} catch (error) {
						controller.error(error);
					}
				}
			});
			return new Response(stream, {
				headers: { "Content-Type": "text/plain; charset=utf-8" }
			});
		} else {
			const result = await model.respond(messages as any, {
				...config,
				signal: controller.signal
			});
			console.log("LMStudio response:", result?.content);
			//return
			return resp(result?.content, 200);
		}
	} catch (e: any) {
		DebugLogger.error(e);
		return resp({ error: e.message }, 500);
	}
};
