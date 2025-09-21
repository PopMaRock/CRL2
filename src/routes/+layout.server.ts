import { redirect } from "@sveltejs/kit";

export async function load({ url, locals, cookies }: { url: any; locals: any; cookies: any; fetch: any }) {
	try {
		return { user: locals.user, url: url.pathname };
	} catch (e) {
		console.error("TRIGGERED ERROR /layout.svelte.ts");
		console.error(e);
		cookies.delete("token", { path: "/" });
		cookies.delete("session", { path: "/" });
		return redirect(307, "/login"); // Will go here if an ERROR is thrown
	}
}