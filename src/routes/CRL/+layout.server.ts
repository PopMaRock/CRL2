import { redirect } from "@sveltejs/kit";
import { DebugLogger } from "$lib/utilities/error-manager";

export async function load({ url, locals }: { url: any; locals: any }) {
	DebugLogger.debug("locals from layout.server.ts", locals.user);
	const { uid, name } = locals.user; // comes from +layout.server.ts
	const data = {
		user: locals.user || null,
		url: url.pathname
	};
	if (locals.user) {
		if (!uid) {
			//redirect to home page
			DebugLogger.debug("no uid redirecting to login page");
			//TODO: redirect to login page once auth is implemented
			throw redirect(307, "/login");
		}
		if (!name) {
			//redirect to home page
			//TODO: redirect to login page once auth is implemented
			DebugLogger.debug("no name redirecting to login page");
			throw redirect(307, "/login");
		}
	}
	return data;
}
function redirectGeeza() {
	//for when the cunts are lost. Try find where they're meant to be or punt them somewhere else.
	//redirect to home page
	//throw redirect(307, "/CRL");
}
