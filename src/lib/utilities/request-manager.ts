import { writable } from "svelte/store";
import { DebugLogger } from "./error-manager";
//TODO: Verify implementation.
export interface FetchRequestOutput {
	success: boolean;
	error?: string;
	aborted?: boolean;
	hash?: number;
	type?: "image" | "LLM";
	url?: string;
	options?: RequestInit;
	opts?: { stream?: boolean; streamType?: "websocket" | "text" };
	data?: any;
}
export interface FetchRequestInput {
	hash: number;
	type: "image" | "LLM";
	url: string;
	options: RequestInit;
	opts?: { stream?: boolean; streamType?: "websocket" | "text" };
}
export class RequestManager {
	public activeRequests = writable(new Map<number, AbortController>());
	public responseStream = writable({ loading: false, reasoning: false, text: "" });

	async fetchWithCancel(settings: FetchRequestInput): Promise<FetchRequestOutput> {
		const { hash, type, url, options, opts } = settings;
		//--------------------------------
		//basic error checking
		if (!url) {
			DebugLogger.error("No URL provided", { toast: true });
			return { success: false, error: "No URL provided to Fetch RequestManager" };
		}
		if (!options) {
			DebugLogger.error("No options provided", { toast: true });
			return { success: false, error: "No options provided to Fetch RequestManager" };
		}
		if (!hash) {
			DebugLogger.error("No ID provided", { toast: true });
			return { success: false, error: "No ID provided to Fetch RequestManager" };
		}
		if (opts?.stream && !opts.streamType) {
			DebugLogger.error("No streamType provided", { toast: true });
			return { success: false, error: "No streamType provided with stream=true to Fetch RequestManager" };
		}
		//--------------------------------
		//set up abort controller and record that pish
		const controller = new AbortController();
		this.responseStream.set({ loading: false, reasoning: false, text: "" });
		this.activeRequests.update((requests) => {
			requests.set(hash, controller);
			return requests;
		});
		let allData = "";
		let result: any = { hash, type, url, options, opts, data: "" };

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal,
				credentials: "include"
			});
			//handle HTTP errors
			if (!response.ok) {
				//throw error
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			if (opts?.stream && response.body) {
				if (opts.streamType === "websocket") {
					const reader = response.body.getReader();
					const decoder = new TextDecoder();

					while (true) {
						const { value, done } = await reader.read();
						if (done) break;
						if (value) {
							const chunk = decoder.decode(value, { stream: true });
							allData += chunk;
							this.responseStream.update((stream) => ({ ...stream, text: allData }));
						}
					}
				} else if (opts.streamType === "text") {
					const textStream = response.body.pipeThrough(new TextDecoderStream());
					const reader = textStream.getReader();

					while (true) {
						const { value, done } = await reader.read();
						if (done) break;
						if (value) {
							allData += value;
							this.responseStream.update((stream) => ({ ...stream, text: allData }));
						}
					}
				}
				if (!allData) throw new Error("No data received from stream");
				result.data = allData;
			} else {
				const contentType = response.headers.get("Content-Type");
				if (contentType?.includes("application/json")) {
					result.data = await response.json();
				} else if (contentType?.includes("image")) {
					result.data = await response.text();
				} else {
					result = { ...result, success: false, error: "Invalid response type" };
				}
			}
			result.success = true;
			return result;
		} catch (error: any) {
			return error?.name === "AbortError" ? { success: false, aborted: true } : { success: false, error };
		} finally {
			//remove abort controller from active requests
			this.activeRequests.update((requests) => {
				requests.delete(hash);
				return requests;
			});
		}
	}

	/**
	 * Cancels an ongoing HTTP request with the specified ID.
	 * If the request exists, it will be aborted and removed from the active requests.
	 *
	 * @param id - The unique identifier of the request to cancel
	 * @returns void
	 */
	killSwitchEngage(hash: number) {
		let controller: AbortController | undefined;
		this.activeRequests.update((requests) => {
			controller = requests.get(hash);
			if (controller) {
				controller.abort();
				requests.delete(hash);
			}
			return requests;
		});
	}
	/**
	 * Cancels all active HTTP requests and clears the request map.
	 * This method aborts all pending requests using their respective AbortControllers
	 * and removes them from the active requests collection.
	 *
	 * @remarks
	 * This is useful for cleanup operations, like when unmounting a component
	 * or when needing to cancel all pending operations at once.
	 */
	killSwitchEngageAll() {
		this.activeRequests.update((requests) => {
			for (const controller of requests.values()) {
				controller.abort();
			}
			requests.clear();
			return requests;
		});
	}
}
