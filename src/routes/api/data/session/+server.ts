import type { RequestHandler } from "@sveltejs/kit";
import { resp, throwError } from "../../../../lib/utilities/apiHelper";
import dbAssist from "../db-assist";

const db = await dbAssist.dbConnect("data/uman.db", "users-schema.sql");
console.warn("Session DB connected:", db);
//GET A SESSION
export const GET: RequestHandler = async ({ url }) => {
	try {
		console.log("IN GET SESSION");
		const sessionId = url.searchParams.get("sessionId") ?? undefined;
		if (!sessionId) {
			throwError("Need sessionId to get a session", 400);
		}
		return dbAssist.select(db, "sessions", "sessionId", sessionId);
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Session retrieval failed" }, 500);
	}
};
//CREATE A SESSION
export const POST: RequestHandler = async ({ request }) => {
	try {
		console.log("IN POST SESSION");
		const { userId, sessionId, expires }: { userId: string; sessionId: string; expires: number } = await request.json();
		if (!userId || !sessionId) {
			throwError("Need userId and sessionId to create a session", 400);
		}
		//delete all past sessions for this user
		dbAssist.deleteRecord(db, "sessions", "userId", userId); // ignore errors and return value.
		return dbAssist.insert(db, "sessions", { userId, sessionId, expires });
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Session creation failed" }, 500);
	}
};
//DELETE A SESSION
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		console.log("IN DELETE SESSION");
		const { sessionId }: { userId: string; sessionId: string } = await request.json();
		if (!sessionId) {
			throwError("Need sessionId to delete a session", 400);
		}
		return dbAssist.deleteRecord(db, "sessions", "sessionId", sessionId);
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Session deletion failed" }, 500);
	}
};
//UPDATE A SESSION EXPIRY
export const PATCH: RequestHandler = async ({ request }) => {
	try {
		console.log("IN PATCH SESSION");
		const { sessionId, expires }: { sessionId: string; expires: number } = await request.json();
		if (!sessionId || !expires) {
			throwError("Need sessionId and expires to update a session", 400);
		}
		return dbAssist.dbUpdate(db, "sessions", "sessionId", sessionId, { expires });
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Session update failed" }, 500);
	}
};
