import { DebugLogger } from "$lib/utilities/error-manager";
import type { RequestHandler } from "./$types";
//yay, a normal api. Good ole' Webui...
export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = await request.json();
		const body = payload.body;
		const url = new URL(payload.url);
		//join the following path: /sdapi/v1/txt2img
		url.pathname = "/sdapi/v1/txt2img";
		const result = await fetch(url.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ ...body })
		});
		if (result.ok) {
			const data = await result.json();
			return new Response(data.images[0], {
				headers: { "Content-Type": "image/png" }
			});
		}
		const text = await result.text();
		DebugLogger.error("ForgeUI Generate Error:", text);
		return new Response(text, { status: result.status });
	} catch (error) {
		console.error(error);
		return new Response("Internal Server Error", { status: 500 });
	}
};
