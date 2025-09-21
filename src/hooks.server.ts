import type { Handle } from "@sveltejs/kit";
import auth from "$lib/controllers/auth";
import { DebugLogger } from "$lib/utilities/error-manager";

const TTL = 60 * 20; // 20 min
function redirect(location: string, body?: string) {
	return new Response(body, {
		status: 303,
		headers: { location }
	});
}
const unProtectedRoutes: string[] = ["/", "/login", "/logout", "/api", "/.well-known"];
export const handle: Handle = async ({ event, resolve }) => {
	if (unProtectedRoutes.includes(event.url.pathname) || event.url.pathname.startsWith("/api")) {
		//DebugLogger.debug("Unprotected route, skipping session check:", event.url.pathname);
		return resolve(event);
	}
	const id = event.cookies.get("session");
	//console.log("Session ID in handle hook:", id);
	let session = id ? await auth.getSession(id) : [];
	//console.debug("Session in handle hook:", session);
	if (session && id && session.expires < Date.now()) {
		// 2 – drop expired row
		//DebugLogger.debug("Session expired, deleting session:", id);
		await auth.deleteSession(id);
		session = null;
	}
	if (session && id) {
		//DebugLogger.debug("Session found, checking expiry:", session.expires);
		const age = (session.expires - Date.now()) / 1000;
		if (age < TTL / 2) {
			const expires = Date.now() + TTL * 1000;
			await auth.bumpSessionExpiry(id, expires);
			event.cookies.set("session", id, {
				path: "/",
				httpOnly: true,
				sameSite: true,
				secure: false, //dev - for production, use dev variable,
				maxAge: TTL
			});
			//extend userId cookie as well
			const userId = event.cookies.get("umanId");
			if (userId) {
				event.cookies.set("umanId", userId, {
					path: "/",
					httpOnly: true,
					sameSite: true,
					secure: false,
					maxAge: TTL
				});
			} else {
				//if we end up in this scenario, something is really fuckin broken or the user modified their cookies.
			}
		}
	}

	if (!session) {
		DebugLogger.debug("No session found, deleting session:", id, session);
		event.cookies.delete("session", { path: "/" });
		event.locals.user = null;
		event.locals.key = null;
		return redirect("/login", "No authenticated user.");
	}
	//if we got this far then likely we have a session, just need userdata.
	//DebugLogger.debug("Session in hook:", session);
	const userData = await auth.getUser(session.userId);
	//console.debug("userData in hook:", userData);
	event.locals.user = { name: userData.name, uid: userData.userId }; // {name, uid}
	event.locals.key = session?.md5_key ?? ""; // MD5(password)

	const response = await resolve(event);
	return response;
};

/*
//fixme: use or remove
  New init hook to handle WebSocket connections globally.
  This sets up event listeners for connection, message, and close events.
  It allows us to send an abort or custom messages later on from the front end.

export const init = async () => {
	// Get our global WebSocketServer instance from the global scope
	const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];

	// Listen for new WebSocket connections
	wss.on("connection", (ws: any) => {
		// Assign a unique socketId to each connection
		ws.socketId = nanoid();
		DebugLogger.debug(`[wss:client] Client ${ws.socketId} connected`);

		// Send a test message to verify connection
		ws.send("Hello, Client!");

		// Listen for messages from the client
		ws.on("message", (message: any) => {
			DebugLogger.debug(`[wss:client] Client ${ws.socketId} sent message: ${message}`);
			if (message.toString() === "clients") {
				const clients = Array.from(wss.clients).map((client: any) => client.socketId);
				ws.send(`Clients: ${clients.join(", ")}`);
			}
		});

		// Log when the connection is closed
		ws.on("close", () => {
			DebugLogger.debug(`[wss:client] Client ${ws.socketId} disconnected`);
		});
	});
};*/
