import { writable } from "svelte/store";
import { DebugLogger } from "./error-manager";

export function readablestreamStore() {
	const { subscribe, set, update } = writable({ loading: false, reasoning: false, text: "" });

	async function request(request: Request, reasoning = false) {
		set({ loading: true, reasoning, text: "" });

		try {
			const result = await fetch(request, { credentials: "include" });

			if (!result.ok) throw new Error(result.statusText);
			if (!result.body) return;

			const reader = result.body.pipeThrough(new TextDecoderStream()).getReader();

			let finaltext = "";
			while (true) {
				const { value: token, done } = await reader.read();

				if (token !== undefined) {
					// Append the token directly to the accumulator.
					finaltext += token;
					// Update the UI, but don't use the returned value for further concatenation.
					update(() => ({
						loading: true,
						reasoning,
						text: "Thinking..."
					}));
				}
				if (done) break;
			}
			DebugLogger.debug(finaltext);
			set({ loading: false, reasoning, text: "" });
			return finaltext;
		} catch (err: any) {
			set({ loading: false, reasoning, text: err.toString() });
			return false;
		}
	}

	return { subscribe, request };
}