//middleware to move data between database and site.
//So why is it in the controller folder? because files can be in any folder on a computer.
//there's just no stopping the folder hierarchial madness.
import { _api } from "$lib/utilities/_api";
import { quietAsyncCatch } from "$lib/utilities/utils";

/*
type Session = { id: string; userId: string; md5_key: string; expires: number };
type User    = { id: string; name: string; password_hash: string; salt: string };

may have an issue with sessions as we're storing the fuckin md5_key which will be nice
for anyone that wants to decrypt files and data - just give them the key.
Future me: Em, so we like, totally don't like, do this anymore.
*/
async function createSession(params: { sessionId: string; userId: string; expires: number }) {
	return await _api("/api/data/session", "POST", { ...params });
}
async function getSession(sessionId: string) {
	const resp: any = await _api("/api/data/session", "GET", { sessionId });
	return resp.length > 0 ? resp[0] : resp;
}
async function deleteSession(sessionId: string) {
	if (sessionId === "" || sessionId === null) return null;
	return await _api("/api/data/session", "DELETE", { sessionId });
}
async function getUser(userId: string) {
	const resp = await quietAsyncCatch(async () => await _api("/api/data/user", "GET", { userId }), {
		error: "user-not-found"
	});
	return resp?.length > 0 ? resp[0] : resp;
}
async function bumpSessionExpiry(sessionId: string, expires: number) {
	if (!sessionId && !expires) return null;
	return await _api("/api/data/session", "PATCH", { sessionId, expires });
}
async function getUserByName(name: string) {
	const resp = await quietAsyncCatch(async () => await _api("/api/data/user", "GET", { name }), { error: "user-not-found" });
	return resp?.length > 0 ? resp[0] : resp;
}
async function createUser(params: { userId: string; name: string; password_hash: string; salt: string }) {
	if (!params || !params.userId || !params.name || !params.password_hash || !params.salt) {
		console.error("Missing user data for creation", params);
		throw new Error("Missing user data for creation");
	}
	return await _api("/api/data/user", "POST", { ...params });
}

export default { createSession, getSession, deleteSession, getUser, bumpSessionExpiry, getUserByName, createUser };
