import { browser } from "$app/environment";
import { addIfPresent } from "$lib/utilities/utils";
import { DebugLogger } from "./error-manager";

export async function _api<T>(
	url: string,
	method: "GET" | "POST" | "PATCH" | "HEAD" | "DELETE" | "PUT" = "GET",
	body?: any,
	additionalBody?: any
): Promise<T> {
	const init: RequestInit = {
		method,
		headers: { "Content-Type": "application/json" }
	};
	//DebugLogger.debug(`API Request: ${method} ${url}`, { body, ...additionalBody });
	try {
		if (method === "GET" || method === "HEAD") {
			const urlObj = new URL(url, "http://localhost:5173");

			// Merge body and additionalBody for search params
			const paramsObj = { ...(body || {}), ...(additionalBody || {}) };
			Object.entries(paramsObj).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					urlObj.searchParams.set(key, String(value));
				}
			});

			url = urlObj.toString();
		} else {
			const requestBody = { ...body, ...addIfPresent(additionalBody, "additionalBody")};
			init.body = JSON.stringify(requestBody);
		}
		init.credentials = "include"; // Include credentials for same-origin requests
		
		const baseOrigin = browser ? window?.location?.origin : "http://localhost:5173";
		const resolvedUrl = url.startsWith("http") ? url : new URL(url, baseOrigin).toString();
		const res = await fetch(resolvedUrl, init);
		const result = await res.json();
		if(!res.ok) {
			//throw result.error and status code
			const error = new Error(result.error || "Unknown error") as any;
			error.status = res.status;
			throw error
		}
		return result as T;
	} catch (error:any) {
		DebugLogger.error("API request failed", {
			url,
			method,
			body,
			additionalBody,
			init,
			error
		});
		throw { error: error.message, status: error.status || 500 };
	}
}
